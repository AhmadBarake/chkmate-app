import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption for access tokens
const ENCRYPTION_KEY = process.env.GITHUB_ENCRYPTION_KEY || process.env.STATE_ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn('WARNING: No GITHUB_ENCRYPTION_KEY set, tokens stored in plaintext');
    return text;
  }
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'github-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(text: string): string {
  if (!ENCRYPTION_KEY) return text;
  const parts = text.split(':');
  if (parts.length !== 3) return text; // Not encrypted
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'github-salt', 32);
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parts[2], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GitHub API base URL
const GITHUB_API = 'https://api.github.com';

async function githubFetch(token: string, path: string, options: RequestInit = {}) {
  const decryptedToken = decrypt(token);
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${decryptedToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }

  return response.json();
}

// ── Connection Management ────────────────────────────────

export async function connectGitHub(
  userId: string,
  accessToken: string,
) {
  // Validate the token by fetching user info
  const userInfo = await githubFetch(accessToken, '/user');

  const encryptedToken = encrypt(accessToken);

  const connection = await prisma.gitHubConnection.upsert({
    where: {
      userId_githubUsername: { userId, githubUsername: userInfo.login },
    },
    update: {
      accessToken: encryptedToken,
      avatarUrl: userInfo.avatar_url,
      updatedAt: new Date(),
    },
    create: {
      userId,
      accessToken: encryptedToken,
      githubUsername: userInfo.login,
      avatarUrl: userInfo.avatar_url,
    },
  });

  return {
    id: connection.id,
    githubUsername: connection.githubUsername,
    avatarUrl: connection.avatarUrl,
  };
}

export async function getGitHubConnections(userId: string) {
  return prisma.gitHubConnection.findMany({
    where: { userId },
    select: {
      id: true,
      githubUsername: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { repositories: true } },
    },
  });
}

export async function disconnectGitHub(userId: string, connectionId: string) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  await prisma.gitHubConnection.delete({ where: { id: connectionId } });
  return { success: true };
}

// ── Repository Operations ────────────────────────────────

export async function listGitHubRepos(userId: string, connectionId: string) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  const repos: any[] = await githubFetch(connection.accessToken, '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator');

  return repos.map((r: any) => ({
    name: r.name,
    fullName: r.full_name,
    owner: r.owner.login,
    isPrivate: r.private,
    defaultBranch: r.default_branch,
    description: r.description,
    language: r.language,
    updatedAt: r.updated_at,
    htmlUrl: r.html_url,
  }));
}

export async function createGitHubRepo(
  userId: string,
  connectionId: string,
  name: string,
  description: string,
  isPrivate: boolean,
  initReadme: boolean = true,
) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  const repo = await githubFetch(connection.accessToken, '/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: initReadme,
      gitignore_template: 'Terraform',
    }),
  });

  // Save repo reference locally
  const savedRepo = await prisma.gitHubRepo.create({
    data: {
      connectionId: connection.id,
      repoOwner: repo.owner.login,
      repoName: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
    },
  });

  return {
    id: savedRepo.id,
    fullName: repo.full_name,
    owner: repo.owner.login,
    name: repo.name,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
  };
}

export async function listRepoBranches(
  userId: string,
  connectionId: string,
  owner: string,
  repo: string,
) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  const branches: any[] = await githubFetch(
    connection.accessToken,
    `/repos/${owner}/${repo}/branches`,
  );

  return branches.map((b: any) => ({
    name: b.name,
    sha: b.commit.sha,
    protected: b.protected,
  }));
}

export async function getRepoFiles(
  userId: string,
  connectionId: string,
  owner: string,
  repo: string,
  path: string = '',
  branch?: string,
) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  const ref = branch ? `?ref=${branch}` : '';
  const files: any[] = await githubFetch(
    connection.accessToken,
    `/repos/${owner}/${repo}/contents/${path}${ref}`,
  );

  return (Array.isArray(files) ? files : [files]).map((f: any) => ({
    name: f.name,
    path: f.path,
    type: f.type, // 'file' or 'dir'
    size: f.size,
    sha: f.sha,
  }));
}

// ── Push / Pull Operations ───────────────────────────────

export async function pushTemplateToGitHub(
  userId: string,
  templateId: string,
  repoLinkId: string,
  commitMessage?: string,
) {
  const link = await prisma.templateRepoLink.findFirst({
    where: { id: repoLinkId },
    include: {
      template: true,
      repo: { include: { connection: true } },
    },
  });
  if (!link) throw new Error('Template-repo link not found');
  if (link.repo.connection.userId !== userId) throw new Error('Unauthorized');

  const connection = link.repo.connection;
  const { repoOwner, repoName } = link.repo;
  const branch = link.branch;
  const filePath = link.filePath;
  const content = link.template.content;

  // Check if file exists to get the current SHA (needed for updates)
  let existingSha: string | undefined;
  try {
    const existing = await githubFetch(
      connection.accessToken,
      `/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
    );
    existingSha = existing.sha;
  } catch {
    // File doesn't exist yet — create
  }

  const message = commitMessage || `Update ${filePath} from Chkmate`;
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  const result = await githubFetch(
    connection.accessToken,
    `/repos/${repoOwner}/${repoName}/contents/${filePath}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encodedContent,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
  );

  // Update link metadata
  await prisma.templateRepoLink.update({
    where: { id: repoLinkId },
    data: { lastPushAt: new Date() },
  });

  await prisma.gitHubRepo.update({
    where: { id: link.repoId },
    data: { lastCommitSha: result.commit.sha, lastSyncedAt: new Date() },
  });

  return {
    commitSha: result.commit.sha,
    commitUrl: result.commit.html_url,
  };
}

export async function pullFromGitHub(
  userId: string,
  templateId: string,
  repoLinkId: string,
) {
  const link = await prisma.templateRepoLink.findFirst({
    where: { id: repoLinkId },
    include: {
      template: true,
      repo: { include: { connection: true } },
    },
  });
  if (!link) throw new Error('Template-repo link not found');
  if (link.repo.connection.userId !== userId) throw new Error('Unauthorized');

  const connection = link.repo.connection;
  const { repoOwner, repoName } = link.repo;

  const file = await githubFetch(
    connection.accessToken,
    `/repos/${repoOwner}/${repoName}/contents/${link.filePath}?ref=${link.branch}`,
  );

  const content = Buffer.from(file.content, 'base64').toString('utf-8');

  // Update template content
  await prisma.template.update({
    where: { id: templateId },
    data: { content, updatedAt: new Date() },
  });

  // Create a new version
  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { version: 'desc' },
  });

  await prisma.templateVersion.create({
    data: {
      templateId,
      version: (lastVersion?.version || 0) + 1,
      content,
      changeLog: `Pulled from GitHub: ${link.repo.fullName}/${link.filePath}@${link.branch}`,
      createdBy: 'github-sync',
    },
  });

  // Update link metadata
  await prisma.templateRepoLink.update({
    where: { id: repoLinkId },
    data: { lastPullAt: new Date() },
  });

  await prisma.gitHubRepo.update({
    where: { id: link.repoId },
    data: { lastCommitSha: file.sha, lastSyncedAt: new Date() },
  });

  return { content, sha: file.sha };
}

// ── Template-Repo Linking ────────────────────────────────

export async function linkTemplateToRepo(
  userId: string,
  templateId: string,
  connectionId: string,
  repoFullName: string,
  branch: string = 'main',
  filePath: string = 'main.tf',
  syncDirection: 'PUSH' | 'PULL' | 'BIDIRECTIONAL' = 'PUSH',
) {
  const connection = await prisma.gitHubConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) throw new Error('GitHub connection not found');

  // Ensure template belongs to user
  const template = await prisma.template.findFirst({
    where: { id: templateId },
    include: { project: true },
  });
  if (!template || template.project.userId !== userId) {
    throw new Error('Template not found');
  }

  // Find or create the repo record
  const [owner, name] = repoFullName.split('/');
  let repo = await prisma.gitHubRepo.findUnique({
    where: { connectionId_fullName: { connectionId, fullName: repoFullName } },
  });

  if (!repo) {
    // Fetch repo info from GitHub to cache
    const ghRepo = await githubFetch(
      connection.accessToken,
      `/repos/${owner}/${name}`,
    );
    repo = await prisma.gitHubRepo.create({
      data: {
        connectionId,
        repoOwner: owner,
        repoName: name,
        fullName: repoFullName,
        defaultBranch: ghRepo.default_branch,
        isPrivate: ghRepo.private,
      },
    });
  }

  const link = await prisma.templateRepoLink.upsert({
    where: { templateId_repoId: { templateId, repoId: repo.id } },
    update: { branch, filePath, syncDirection, updatedAt: new Date() },
    create: {
      templateId,
      repoId: repo.id,
      branch,
      filePath,
      syncDirection,
    },
  });

  return {
    id: link.id,
    templateId: link.templateId,
    repoId: link.repoId,
    repoFullName: repo.fullName,
    branch: link.branch,
    filePath: link.filePath,
    syncDirection: link.syncDirection,
  };
}

export async function unlinkTemplateFromRepo(
  userId: string,
  templateId: string,
  linkId: string,
) {
  const link = await prisma.templateRepoLink.findFirst({
    where: { id: linkId, templateId },
    include: { repo: { include: { connection: true } } },
  });
  if (!link || link.repo.connection.userId !== userId) {
    throw new Error('Link not found');
  }

  await prisma.templateRepoLink.delete({ where: { id: linkId } });
  return { success: true };
}

export async function getTemplateRepoLinks(userId: string, templateId: string) {
  const template = await prisma.template.findFirst({
    where: { id: templateId },
    include: { project: true },
  });
  if (!template || template.project.userId !== userId) {
    throw new Error('Template not found');
  }

  return prisma.templateRepoLink.findMany({
    where: { templateId },
    include: {
      repo: {
        select: {
          id: true,
          fullName: true,
          repoOwner: true,
          repoName: true,
          defaultBranch: true,
          isPrivate: true,
          lastCommitSha: true,
          lastSyncedAt: true,
        },
      },
    },
  });
}

// ── Quick Push (create link + push in one go) ────────────

export async function quickPushToGitHub(
  userId: string,
  templateId: string,
  connectionId: string,
  repoFullName: string,
  branch: string = 'main',
  filePath: string = 'main.tf',
  commitMessage?: string,
) {
  // Create or update the link
  const link = await linkTemplateToRepo(
    userId,
    templateId,
    connectionId,
    repoFullName,
    branch,
    filePath,
    'PUSH',
  );

  // Push immediately
  const result = await pushTemplateToGitHub(userId, templateId, link.id, commitMessage);

  return { ...link, ...result };
}
