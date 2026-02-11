-- AlterEnum: Add new TransactionType values
ALTER TYPE "TransactionType" ADD VALUE 'AGENT_ANALYSIS';
ALTER TYPE "TransactionType" ADD VALUE 'DEPLOY_PLAN';
ALTER TYPE "TransactionType" ADD VALUE 'DEPLOY_APPLY';

-- CreateEnum
CREATE TYPE "AgentSessionStatus" AS ENUM ('PLANNING', 'REVIEWING', 'APPLYING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PLANNING', 'PLAN_READY', 'APPLYING', 'SUCCEEDED', 'FAILED', 'DESTROYING', 'DESTROYED');

-- AlterTable: Add agenticMode to User
ALTER TABLE "User" ADD COLUMN "agenticMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add auditReportId to Violation
ALTER TABLE "Violation" ADD COLUMN "auditReportId" TEXT;

-- CreateIndex
CREATE INDEX "Violation_auditReportId_idx" ON "Violation"("auditReportId");

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_auditReportId_fkey" FOREIGN KEY ("auditReportId") REFERENCES "AuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INT NOT NULL,
    "content" TEXT NOT NULL,
    "changeLog" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "TemplateVersion_templateId_idx" ON "TemplateVersion"("templateId");

-- AddForeignKey
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'PLANNING',
    "changePlan" JSONB,
    "appliedChanges" JSONB,
    "originalScore" JSONB,
    "projectedScore" JSONB,
    "totalSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentSession_userId_idx" ON "AgentSession"("userId");

-- CreateIndex
CREATE INDEX "AgentSession_templateId_idx" ON "AgentSession"("templateId");

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeploymentCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "roleArn" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeploymentCredential_userId_idx" ON "DeploymentCredential"("userId");

-- AddForeignKey
ALTER TABLE "DeploymentCredential" ADD CONSTRAINT "DeploymentCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PLANNING',
    "planOutput" JSONB,
    "applyOutput" TEXT,
    "stateFile" TEXT,
    "resourceCount" INT NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deployment_userId_idx" ON "Deployment"("userId");

-- CreateIndex
CREATE INDEX "Deployment_templateId_idx" ON "Deployment"("templateId");

-- CreateIndex
CREATE INDEX "Deployment_credentialId_idx" ON "Deployment"("credentialId");

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "DeploymentCredential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
