# GitHub Integration Plan — Chkmate App

## Overview

Add GitHub as a first-class integration to Chkmate, enabling users to:
1. **Push** generated Terraform templates to GitHub repositories
2. **Create** new repositories for infrastructure code directly from Chkmate
3. **Link** repositories to deployments for automatic pull-build-deploy workflows
4. **Sync** template changes bidirectionally between Chkmate and GitHub

---

## Part 1: GitHub OAuth & Connection Model

### 1A. GitHub App Registration
- Register a **GitHub App** (not OAuth App) — better for org installs, fine-grained permissions, webhooks
- Permissions needed:
  - `contents: write` — push commits, create files
  - `metadata: read` — list repos, branches
  - `pull_requests: write` — create PRs for plan diffs (enhancement)
  - `webhooks` — receive push events for auto-deploy
- App redirects to `/api/github/callback` after installation

### 1B. Prisma Schema Changes

```prisma
model GitHubConnection {
  id              String   @id @default(uuid())
  userId          String
  installationId  String   // GitHub App installation ID
  accessToken     String   // Encrypted installation access token
  tokenExpiresAt  DateTime
  githubUsername  String
  avatarUrl       String?
  scope           String   // Comma-separated: "repo,read:org"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  repositories    GitHubRepo[]

  @@unique([userId, githubUsername])
  @@index([userId])
}

model GitHubRepo {
  id              String   @id @default(uuid())
  connectionId    String
  repoOwner       String   // "AhmadBarake"
  repoName        String   // "my-infra"
  fullName        String   // "AhmadBarake/my-infra"
  defaultBranch   String   @default("main")
  isPrivate       Boolean  @default(true)
  filePath        String   @default("main.tf") // Path where template is stored
  lastSyncedAt    DateTime?
  lastCommitSha   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  connection      GitHubConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  templateLinks   TemplateRepoLink[]

  @@unique([connectionId, fullName])
  @@index([connectionId])
}

model TemplateRepoLink {
  id              String   @id @default(uuid())
  templateId      String
  repoId          String
  branch          String   @default("main")
  filePath        String   @default("main.tf")
  syncDirection   SyncDirection @default(PUSH) // PUSH, PULL, BIDIRECTIONAL
  autoSync        Boolean  @default(false) // Auto-push on template save
  autoDeploy      Boolean  @default(false) // Auto-deploy on repo push
  credentialId    String?  // DeploymentCredential for auto-deploy
  region          String?  // Region for auto-deploy
  lastPushAt      DateTime?
  lastPullAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  template        Template        @relation(fields: [templateId], references: [id], onDelete: Cascade)
  repo            GitHubRepo      @relation(fields: [repoId], references: [id], onDelete: Cascade)
  credential      DeploymentCredential? @relation(fields: [credentialId], references: [id])

  @@unique([templateId, repoId])
  @@index([templateId])
  @@index([repoId])
}

enum SyncDirection {
  PUSH        // Chkmate → GitHub
  PULL        // GitHub → Chkmate
  BIDIRECTIONAL
}
```

Add to existing models:
- `User`: add `githubConnections GitHubConnection[]`
- `Template`: add `repoLinks TemplateRepoLink[]`
- `DeploymentCredential`: add `repoLinks TemplateRepoLink[]`

### 1C. New Transaction Type
```prisma
enum TransactionType {
  // ... existing
  GITHUB_SYNC    // Used for GitHub push/pull operations
}
```

---

## Part 2: Backend Services

### 2A. `server/services/githubService.ts`

Core service with methods:

```
authenticateInstallation(installationId) → accessToken
refreshTokenIfExpired(connectionId) → accessToken

listUserRepos(connectionId) → Repo[]
getRepo(connectionId, owner, name) → Repo
createRepo(connectionId, name, description, isPrivate) → Repo
deleteRepo(connectionId, owner, name) → void

getFileContent(connectionId, owner, repo, path, branch?) → { content, sha }
pushFile(connectionId, owner, repo, path, content, message, branch?, sha?) → commit
createBranch(connectionId, owner, repo, branchName, fromBranch?) → ref

pushTemplate(templateId, repoLinkId) → commitSha
pullTemplate(templateId, repoLinkId) → { content, sha }

createPRWithPlan(connectionId, owner, repo, head, base, title, body) → PR
```

### 2B. `server/services/webhookService.ts`

Handle GitHub webhook events:
- `push` event → if linked template has `autoDeploy`, trigger `planDeployment`
- `installation` event → track app install/uninstall
- Webhook signature verification via `@octokit/webhooks`

### 2C. API Endpoints (in `server/index.ts`)

```
GET    /api/github/install        → Redirect to GitHub App install URL
GET    /api/github/callback       → Handle OAuth callback, store connection
DELETE /api/github/connections/:id → Remove GitHub connection

GET    /api/github/repos           → List repos from connected account
POST   /api/github/repos           → Create new repo
GET    /api/github/repos/:owner/:name/branches → List branches
GET    /api/github/repos/:owner/:name/files    → List files in repo

POST   /api/templates/:id/github/link    → Link template to repo
DELETE /api/templates/:id/github/link/:linkId → Unlink
GET    /api/templates/:id/github/links   → Get links for template

POST   /api/templates/:id/github/push    → Push template to linked repo
POST   /api/templates/:id/github/pull    → Pull from repo into template

POST   /api/github/webhook         → Webhook receiver (no auth, signature verified)
```

### 2D. Dependencies
```
@octokit/rest          — GitHub API client
@octokit/auth-app      — GitHub App authentication
@octokit/webhooks      — Webhook signature verification
```

---

## Part 3: Frontend — Full Dashboard

### 3A. New Sidebar Item
Under the **Connect** section:
```
── CONNECT ───────────────
  Connections      (Server)    ← existing AWS connections
  GitHub           (Github)    ← NEW
  Invoices         (FileText)
```

### 3B. `GitHubConnections.tsx` page (`/github`)
- Connect GitHub button → initiates GitHub App install flow
- Shows connected account (avatar, username, installation status)
- Repository list with search/filter
- "Create New Repo" button → modal with name, description, private/public
- Each repo card shows: name, visibility, last commit, linked templates count
- Disconnect button

### 3C. Builder.tsx Updates — Push to GitHub
Add a **GitHub button** to the Builder toolbar (next to Save):
- If no GitHub connection → "Connect GitHub" CTA
- If connected but template not linked → "Push to GitHub" dropdown:
  - Select existing repo or "Create New Repo"
  - Choose branch and file path
  - Creates link + pushes in one action
- If linked → "Push" button (one-click sync)
- Also: "Pull from GitHub" if link exists
- Status indicator showing last sync time

### 3D. Deployments.tsx Updates — Repo-Linked Deploy
In the deployment creation flow:
- New option: "Deploy from GitHub Repository"
- User picks: linked repo → branch → credential → region
- Backend pulls latest code from repo before running `terraform plan`
- Shows commit SHA in deployment record for traceability

### 3E. Template Detail — Sync Settings
In the template view, new "GitHub Sync" tab/section:
- Linked repository info
- Sync direction toggle (Push / Pull / Bidirectional)
- Auto-sync on save toggle
- Auto-deploy on push toggle (with credential + region selector)
- Sync history (last 10 push/pull events)

---

## Part 4: Frontend — Simplified Dashboard

### 4A. Simplified Sidebar Addition
```
── QUICK START ───────────
  Overview         (LayoutDashboard)
  Deploy App       (Rocket)
  GitHub           (Github)         ← NEW
  Guides           (BookOpen)
```

### 4B. `SimpleGitHub.tsx` page (`/simple/github`)
Simplified GitHub page focused on non-dev use cases:
- **Connect** section: Big "Connect GitHub" button with explanation
- **My Repos** section: Visual card grid of repos (not a technical table)
  - Each card: repo name, visibility badge, last updated, "Deploy" quick action
- **Create Repo** section: Guided flow:
  1. Choose purpose: "Terraform Infrastructure" / "Web App Source Code"
  2. Name it
  3. Chkmate creates with README + .gitignore + optional scaffold

### 4C. SimpleDeployWizard Updates
Add a **Step 0** option at the template selection stage:
- "From Template Preset" (existing flow)
- "From GitHub Repository" (new flow):
  - Pick a repo → pick branch → detect Terraform files
  - If found: import as template → continue to configure step
  - If not found: offer to generate template and push to repo

### 4D. SimpleGuides Updates
Add new guide: "Connect GitHub and Deploy from a Repository"
- Steps: Connect GitHub → Link or Create Repo → Push Template → Deploy

---

## Part 5: Enhanced Deployment Flow (Repo-Aware)

### 5A. Deployment Model Changes
```prisma
model Deployment {
  // ... existing fields
  repoLinkId    String?           // NEW: optional link to repo
  commitSha     String?           // NEW: Git commit that triggered deploy
  sourceBranch  String?           // NEW: Branch deployed from

  repoLink      TemplateRepoLink? @relation(fields: [repoLinkId], references: [id])
}
```

### 5B. Updated Deployment Flow
```
User pushes to GitHub
  → Webhook fires
  → webhookService checks for TemplateRepoLink with autoDeploy=true
  → Pulls latest content from repo
  → Updates template content in DB
  → Creates new TemplateVersion (createdBy: "github-sync")
  → Triggers planDeployment() with linked credential + region
  → User sees new deployment in "Deployments" page
  → User reviews plan → approves apply (or auto-apply if configured)
```

---

## Part 6: Additional Enhancements & Ideas

### 6A. PR-Based Plan Reviews (High Value)
When a user pushes to a non-default branch:
- Chkmate automatically runs `terraform plan` on the branch
- Posts a **PR comment** with the plan diff, cost estimate, and security score
- Similar to Atlantis or Spacelift workflow
- Merge to main triggers apply (if auto-deploy enabled)

### 6B. Multi-File Repository Support
Currently templates are single-file. Enhance to support:
- `main.tf`, `variables.tf`, `outputs.tf`, `terraform.tfvars` as separate files
- Directory structure in repos: `environments/prod/`, `modules/`
- Template "packs" that map to a directory in a repo

### 6C. `.chkmate.yml` Config File
Users can add a config file to their repo root:
```yaml
version: 1
provider: aws
region: us-east-1
credential: production-account
auto_deploy: true
deploy_branch: main
plan_on_pr: true
notify:
  - slack: "#infra-alerts"
```
Chkmate reads this on webhook events to determine behavior.

### 6D. Commit History Visualization
- Show git commit timeline alongside TemplateVersion history
- Diff viewer: compare any two commits
- Rollback to any commit with one click (creates revert commit)

### 6E. Branch-Based Environments
- Map branches to environments: `main` → Production, `staging` → Staging, `dev` → Development
- Each branch auto-deploys to its environment with different credentials
- Environment status dashboard showing all branches/environments

### 6F. Import Existing Infrastructure
- User connects a repo that already has Terraform code
- Chkmate imports it, runs audit + cost analysis
- Suggests improvements via Agentic Mode
- "Adopt" button links template → repo with BIDIRECTIONAL sync

### 6G. GitHub Actions Integration
Generate a `.github/workflows/chkmate.yml` that:
- Runs on PR: calls Chkmate API to plan + comment
- Runs on merge to main: calls Chkmate API to apply
- Includes status badges for security score + cost estimate

### 6H. Organization & Team Features
- GitHub org installations → shared repos across team members
- Template ownership transferred to team (not individual user)
- Collaborative plan reviews (multiple approvers)

### 6I. Template Marketplace / Sharing
- Publish templates to a public Chkmate registry
- Backed by GitHub repos (public)
- Users can fork + customize + deploy
- Star/review system

### 6J. Drift Detection
- Periodically compare deployed state vs. repo code
- If infrastructure has drifted (manual changes), alert user
- Option to: reconcile (apply repo code) or adopt (update repo from state)

---

## Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| P0 | GitHub App OAuth + Connection model | Medium | Foundation |
| P0 | Push template to GitHub | Medium | Core feature |
| P0 | Create new repo from Chkmate | Low | Core feature |
| P0 | Builder "Push to GitHub" button | Low | UX |
| P1 | Link repo to template (TemplateRepoLink) | Medium | Core feature |
| P1 | Pull from GitHub into template | Medium | Core feature |
| P1 | Full dashboard GitHub page | Medium | UX |
| P1 | Simplified dashboard GitHub page | Medium | UX |
| P2 | Webhook receiver for push events | Medium | Automation |
| P2 | Auto-deploy on push | Medium | Automation |
| P2 | Deploy from GitHub in wizard | Low | UX |
| P2 | SimpleDeployWizard repo option | Low | UX |
| P3 | PR-based plan reviews | High | High value |
| P3 | Multi-file repo support | High | Scalability |
| P3 | `.chkmate.yml` config | Medium | DX |
| P3 | GitHub Actions workflow generation | Medium | DX |
| P4 | Branch-based environments | High | Enterprise |
| P4 | Drift detection | High | Enterprise |
| P4 | Template marketplace | High | Growth |
| P4 | Org/team features | High | Enterprise |

---

## Files Summary (P0 + P1 Implementation)

| Action | File |
|--------|------|
| Create | `server/services/githubService.ts` |
| Create | `server/services/webhookService.ts` |
| Create | `server/prisma/migrations/XXXX_add_github_integration/migration.sql` |
| Modify | `server/prisma/schema.prisma` (new models + relations) |
| Modify | `server/index.ts` (12+ new endpoints) |
| Modify | `server/package.json` (add @octokit deps) |
| Create | `chkmate-cloud/src/pages/GitHubConnections.tsx` |
| Create | `chkmate-cloud/src/pages/SimpleGitHub.tsx` |
| Modify | `chkmate-cloud/src/pages/Builder.tsx` (push button) |
| Modify | `chkmate-cloud/src/pages/SimpleDeployWizard.tsx` (repo option) |
| Modify | `chkmate-cloud/src/pages/SimpleGuides.tsx` (new guide) |
| Modify | `chkmate-cloud/src/components/DashboardLayout.tsx` (sidebar items) |
| Modify | `chkmate-cloud/src/App.tsx` (new routes) |
| Modify | `chkmate-cloud/src/lib/api.ts` (new API functions + types) |
