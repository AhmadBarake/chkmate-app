-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('PUSH', 'PULL', 'BIDIRECTIONAL');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'GITHUB_SYNC';

-- AlterTable: Add GitHub-related fields to Deployment
ALTER TABLE "Deployment" ADD COLUMN "commitSha" TEXT;
ALTER TABLE "Deployment" ADD COLUMN "sourceBranch" TEXT;
ALTER TABLE "Deployment" ADD COLUMN "repoLinkId" TEXT;

-- CreateTable: GitHubConnection
CREATE TABLE "GitHubConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "installationId" TEXT,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "githubUsername" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GitHubRepo
CREATE TABLE "GitHubRepo" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastCommitSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TemplateRepoLink
CREATE TABLE "TemplateRepoLink" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "filePath" TEXT NOT NULL DEFAULT 'main.tf',
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'PUSH',
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "autoDeploy" BOOLEAN NOT NULL DEFAULT false,
    "credentialId" TEXT,
    "region" TEXT,
    "lastPushAt" TIMESTAMP(3),
    "lastPullAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateRepoLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GitHubConnection_userId_idx" ON "GitHubConnection"("userId");
CREATE UNIQUE INDEX "GitHubConnection_userId_githubUsername_key" ON "GitHubConnection"("userId", "githubUsername");

CREATE INDEX "GitHubRepo_connectionId_idx" ON "GitHubRepo"("connectionId");
CREATE UNIQUE INDEX "GitHubRepo_connectionId_fullName_key" ON "GitHubRepo"("connectionId", "fullName");

CREATE INDEX "TemplateRepoLink_templateId_idx" ON "TemplateRepoLink"("templateId");
CREATE INDEX "TemplateRepoLink_repoId_idx" ON "TemplateRepoLink"("repoId");
CREATE UNIQUE INDEX "TemplateRepoLink_templateId_repoId_key" ON "TemplateRepoLink"("templateId", "repoId");

-- AddForeignKey
ALTER TABLE "GitHubConnection" ADD CONSTRAINT "GitHubConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GitHubRepo" ADD CONSTRAINT "GitHubRepo_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GitHubConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateRepoLink" ADD CONSTRAINT "TemplateRepoLink_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateRepoLink" ADD CONSTRAINT "TemplateRepoLink_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GitHubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateRepoLink" ADD CONSTRAINT "TemplateRepoLink_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "DeploymentCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_repoLinkId_fkey" FOREIGN KEY ("repoLinkId") REFERENCES "TemplateRepoLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
