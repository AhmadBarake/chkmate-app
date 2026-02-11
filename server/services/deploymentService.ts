/**
 * Deployment Service
 * Orchestrates Terraform deployments: plan, apply, destroy.
 * Manages deployment credentials and lifecycle.
 */

import { PrismaClient } from '@prisma/client';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { randomUUID } from 'crypto';
import {
  createWorkspace,
  writeTemplateFiles,
  terraformInit,
  terraformPlan,
  terraformApply,
  terraformDestroy,
  cleanupWorkspace,
  checkTerraformAvailable,
  TerraformCredentials,
} from '../lib/sandbox.js';
import { storeState, retrieveState, deleteState, encryptRoleArn, decryptRoleArn } from './stateService.js';
import { auditTemplate } from './policyEngine.js';

const prisma = new PrismaClient();
const HOST_REGION = process.env.AWS_REGION || 'us-east-1';

// Rate limiting: track concurrent deployments per user
const activeDeployments = new Map<string, number>();
const MAX_CONCURRENT_DEPLOYMENTS = 5;

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Create deployment credentials for a user
 */
export async function createDeploymentCredential(
  userId: string,
  name: string,
  roleArn: string
): Promise<{ id: string; name: string; provider: string; isActive: boolean; createdAt: Date }> {
  // Validate role ARN format
  if (!/^arn:aws:iam::\d{12}:role\/[\w+=,.@\-/]+$/.test(roleArn)) {
    throw new Error('Invalid IAM Role ARN format');
  }

  const externalId = randomUUID();

  // Test the role by trying to assume it
  await assumeDeploymentRole(roleArn, externalId);

  // Encrypt the role ARN for storage
  const credentialId = randomUUID();
  const encryptedArn = encryptRoleArn(roleArn, credentialId);

  const credential = await prisma.deploymentCredential.create({
    data: {
      id: credentialId,
      userId,
      provider: 'aws',
      roleArn: encryptedArn,
      externalId,
      name,
      isActive: true,
    },
  });

  return {
    id: credential.id,
    name: credential.name,
    provider: credential.provider,
    isActive: credential.isActive,
    createdAt: credential.createdAt,
  };
}

/**
 * List deployment credentials for a user (without exposing secrets)
 */
export async function listDeploymentCredentials(userId: string) {
  const credentials = await prisma.deploymentCredential.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      provider: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { deployments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return credentials;
}

/**
 * Delete a deployment credential
 */
export async function deleteDeploymentCredential(userId: string, credentialId: string): Promise<void> {
  const credential = await prisma.deploymentCredential.findUnique({
    where: { id: credentialId },
    include: { deployments: { where: { status: { in: ['PLANNING', 'PLAN_READY', 'APPLYING'] } } } },
  });

  if (!credential || credential.userId !== userId) {
    throw new Error('Credential not found');
  }

  if (credential.deployments.length > 0) {
    throw new Error('Cannot delete credentials with active deployments');
  }

  await prisma.deploymentCredential.delete({ where: { id: credentialId } });
}

/**
 * Toggle credential active status
 */
export async function toggleDeploymentCredential(userId: string, credentialId: string, isActive: boolean) {
  const credential = await prisma.deploymentCredential.findUnique({
    where: { id: credentialId },
  });

  if (!credential || credential.userId !== userId) {
    throw new Error('Credential not found');
  }

  return prisma.deploymentCredential.update({
    where: { id: credentialId },
    data: { isActive },
    select: { id: true, name: true, provider: true, isActive: true },
  });
}

// ============================================================================
// DEPLOYMENT LIFECYCLE
// ============================================================================

/**
 * Create a deployment and run terraform plan
 */
export async function planDeployment(
  userId: string,
  templateId: string,
  credentialId: string,
  region: string = 'us-east-1'
): Promise<{
  deploymentId: string;
  planOutput: any;
  summary: { add: number; change: number; destroy: number };
  estimatedCost: number | null;
  auditScore: number;
}> {
  // Check concurrent deployment limit
  const activeCount = activeDeployments.get(userId) || 0;
  if (activeCount >= MAX_CONCURRENT_DEPLOYMENTS) {
    throw new Error(`Maximum ${MAX_CONCURRENT_DEPLOYMENTS} concurrent deployments reached`);
  }

  // Get template and credential
  const [template, credential] = await Promise.all([
    prisma.template.findUnique({
      where: { id: templateId },
      include: { project: { select: { userId: true } } },
    }),
    prisma.deploymentCredential.findUnique({
      where: { id: credentialId },
    }),
  ]);

  if (!template || template.project.userId !== userId) {
    throw new Error('Template not found');
  }

  if (!credential || credential.userId !== userId || !credential.isActive) {
    throw new Error('Deployment credential not found or inactive');
  }

  // Create deployment record
  const deployment = await prisma.deployment.create({
    data: {
      userId,
      templateId,
      credentialId,
      region: region || 'us-east-1',
      status: 'PLANNING',
      startedAt: new Date(),
    },
  });

  activeDeployments.set(userId, activeCount + 1);

  let workDir: string | null = null;

  try {
    // Assume the deployment role
    const roleArn = decryptRoleArn(credential.roleArn, credential.id);
    const creds = await assumeDeploymentRole(roleArn, credential.externalId, region);

    // Create isolated workspace
    workDir = await createWorkspace(deployment.id);

    // Write template files
    await writeTemplateFiles(workDir, template.content, creds);

    // Run terraform init
    const initResult = await terraformInit(workDir);
    if (!initResult.success) {
      throw new Error(`Terraform init failed: ${initResult.error || initResult.output.slice(0, 500)}`);
    }

    // Run terraform plan
    const planResult = await terraformPlan(workDir);
    if (!planResult.success) {
      throw new Error(`Terraform plan failed: ${planResult.error || planResult.output.slice(0, 500)}`);
    }

    // Run security audit on the template
    const auditResult = await auditTemplate(template.content, template.provider, templateId);

    // Update deployment with plan results
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: 'PLAN_READY',
        planOutput: {
          summary: planResult.summary,
          output: planResult.output.slice(0, 50000), // Limit stored output
          auditScore: auditResult.summary.score,
          auditIssues: auditResult.summary.totalIssues,
        },
        resourceCount: planResult.summary.add + planResult.summary.change,
        estimatedCost: auditResult.costBreakdown?.totalMonthly || null,
      },
    });

    return {
      deploymentId: deployment.id,
      planOutput: {
        summary: planResult.summary,
        output: planResult.output,
      },
      summary: planResult.summary,
      estimatedCost: auditResult.costBreakdown?.totalMonthly || null,
      auditScore: auditResult.summary.score,
    };
  } catch (error: any) {
    // Mark deployment as failed
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message?.slice(0, 2000),
        completedAt: new Date(),
      },
    });
    throw error;
  } finally {
    activeDeployments.set(userId, Math.max(0, (activeDeployments.get(userId) || 1) - 1));
    // Don't clean up workspace yet - we need the plan file for apply
  }
}

/**
 * Apply a deployment (run terraform apply with the saved plan)
 */
export async function applyDeployment(
  userId: string,
  deploymentId: string
): Promise<{
  success: boolean;
  output: string;
  resourceCount: number;
}> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      credential: true,
      template: { include: { project: { select: { userId: true } } } },
    },
  });

  if (!deployment || deployment.userId !== userId) {
    throw new Error('Deployment not found');
  }

  if (deployment.status !== 'PLAN_READY') {
    throw new Error(`Cannot apply: deployment is in ${deployment.status} state`);
  }

  // Update status to applying
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'APPLYING' },
  });

  const activeCount = activeDeployments.get(userId) || 0;
  activeDeployments.set(userId, activeCount + 1);

  const workDir = await createWorkspace(deploymentId);

  try {
    // Re-assume role (previous session may have expired)
    const roleArn = decryptRoleArn(deployment.credential.roleArn, deployment.credential.id);
    const creds = await assumeDeploymentRole(
      roleArn,
      deployment.credential.externalId,
      deployment.region || 'us-east-1'
    );

    // Re-write files and re-init (workspace may have been cleaned)
    await writeTemplateFiles(workDir, deployment.template.content, creds);
    const initResult = await terraformInit(workDir);
    if (!initResult.success) {
      throw new Error(`Terraform init failed: ${initResult.error}`);
    }

    // Re-plan to generate the plan file
    const rePlan = await terraformPlan(workDir);
    if (!rePlan.success) {
      throw new Error(`Terraform re-plan failed: ${rePlan.error}`);
    }

    // Run terraform apply
    const applyResult = await terraformApply(workDir);

    if (applyResult.success) {
      // Store encrypted state
      if (applyResult.stateContent) {
        await storeState(deploymentId, applyResult.stateContent);
      }

      // Parse resource count from state
      let resourceCount = 0;
      if (applyResult.stateContent) {
        try {
          const state = JSON.parse(applyResult.stateContent);
          resourceCount = state.resources?.length || 0;
        } catch { /* ignore parse errors */ }
      }

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCEEDED',
          applyOutput: applyResult.output.slice(0, 50000),
          resourceCount,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        output: applyResult.output,
        resourceCount,
      };
    } else {
      throw new Error(applyResult.error || 'Terraform apply failed');
    }
  } catch (error: any) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'FAILED',
        errorMessage: error.message?.slice(0, 2000),
        applyOutput: error.message?.slice(0, 50000),
        completedAt: new Date(),
      },
    });
    throw error;
  } finally {
    activeDeployments.set(userId, Math.max(0, (activeDeployments.get(userId) || 1) - 1));
    await cleanupWorkspace(workDir);
  }
}

/**
 * Destroy a deployment's infrastructure
 */
export async function destroyDeployment(
  userId: string,
  deploymentId: string
): Promise<{ success: boolean; output: string }> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      credential: true,
      template: true,
    },
  });

  if (!deployment || deployment.userId !== userId) {
    throw new Error('Deployment not found');
  }

  if (!['SUCCEEDED', 'FAILED'].includes(deployment.status)) {
    throw new Error(`Cannot destroy: deployment is in ${deployment.status} state`);
  }

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'DESTROYING' },
  });

  const workDir = await createWorkspace(`${deploymentId}-destroy`);

  try {
    // Assume role
    const roleArn = decryptRoleArn(deployment.credential.roleArn, deployment.credential.id);
    const creds = await assumeDeploymentRole(roleArn, deployment.credential.externalId, deployment.region || 'us-east-1');

    // Write template files
    await writeTemplateFiles(workDir, deployment.template.content, creds);

    // Retrieve stored state
    const stateContent = await retrieveState(deploymentId);

    // Init and destroy
    await terraformInit(workDir);
    const destroyResult = await terraformDestroy(workDir, stateContent || undefined);

    if (destroyResult.success) {
      // Clean up state
      await deleteState(deploymentId);

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DESTROYED',
          resourceCount: 0,
          completedAt: new Date(),
        },
      });
    } else {
      throw new Error(destroyResult.error || 'Terraform destroy failed');
    }

    return {
      success: destroyResult.success,
      output: destroyResult.output,
    };
  } catch (error: any) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'FAILED',
        errorMessage: `Destroy failed: ${error.message?.slice(0, 2000)}`,
      },
    });
    throw error;
  } finally {
    await cleanupWorkspace(workDir);
  }
}

/**
 * Get deployment status and details
 */
export async function getDeployment(userId: string, deploymentId: string) {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      template: { select: { id: true, name: true, provider: true } },
      credential: { select: { id: true, name: true, provider: true } },
    },
  });

  if (!deployment || deployment.userId !== userId) {
    throw new Error('Deployment not found');
  }

  return deployment;
}

/**
 * List deployments for a user
 */
export async function listDeployments(userId: string, templateId?: string) {
  return prisma.deployment.findMany({
    where: {
      userId,
      ...(templateId ? { templateId } : {}),
    },
    include: {
      template: { select: { id: true, name: true, provider: true } },
      credential: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ============================================================================
// DEPLOYMENT CLOUDFORMATION TEMPLATE
// ============================================================================

/**
 * Generate a CloudFormation template for creating a deployment IAM role
 */
export function getDeploymentCFTemplate(externalId: string): string {
  const hostAccountId = process.env.AWS_ACCOUNT_ID || '000000000000';

  return `AWSTemplateFormatVersion: '2010-09-09'
Description: Chkmate Deployment Role - Allows Chkmate to deploy Terraform resources

Parameters:
  ExternalId:
    Type: String
    Default: '${externalId}'
    Description: External ID for secure cross-account access

Resources:
  ChkmateDeploymentRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ChkmateDeploymentRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::${hostAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': !Ref ExternalId
      Policies:
        - PolicyName: ChkmateDeploymentPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: ResourceManagement
                Effect: Allow
                Action:
                  - 'ec2:*'
                  - 'rds:*'
                  - 's3:*'
                  - 'lambda:*'
                  - 'dynamodb:*'
                  - 'elasticloadbalancing:*'
                  - 'ecs:*'
                  - 'route53:*'
                  - 'cloudfront:*'
                  - 'cloudwatch:*'
                  - 'logs:*'
                  - 'secretsmanager:*'
                  - 'sqs:*'
                  - 'sns:*'
                  - 'apigateway:*'
                  - 'elasticache:*'
                Resource: '*'
                Condition:
                  StringEqualsIfExists:
                    'aws:RequestTag/ManagedBy': 'chkmate'
              - Sid: TaggedResourceManagement
                Effect: Allow
                Action:
                  - 'ec2:*'
                  - 'rds:*'
                  - 's3:*'
                  - 'lambda:*'
                  - 'dynamodb:*'
                  - 'elasticloadbalancing:*'
                  - 'ecs:*'
                Resource: '*'
                Condition:
                  StringEquals:
                    'aws:ResourceTag/ManagedBy': 'chkmate'
              - Sid: IAMPassRole
                Effect: Allow
                Action:
                  - 'iam:PassRole'
                  - 'iam:CreateRole'
                  - 'iam:AttachRolePolicy'
                  - 'iam:DetachRolePolicy'
                  - 'iam:DeleteRole'
                  - 'iam:GetRole'
                  - 'iam:CreatePolicy'
                  - 'iam:DeletePolicy'
                Resource:
                  - 'arn:aws:iam::*:role/chkmate-*'
                  - 'arn:aws:iam::*:policy/chkmate-*'
              - Sid: KMSAccess
                Effect: Allow
                Action:
                  - 'kms:CreateKey'
                  - 'kms:CreateAlias'
                  - 'kms:Encrypt'
                  - 'kms:Decrypt'
                  - 'kms:DescribeKey'
                  - 'kms:TagResource'
                Resource: '*'
              - Sid: ReadOnly
                Effect: Allow
                Action:
                  - 'sts:GetCallerIdentity'
                  - 'iam:ListRoles'
                  - 'iam:ListPolicies'
                  - 'ec2:DescribeAvailabilityZones'
                  - 'ec2:DescribeRegions'
                Resource: '*'

Outputs:
  RoleArn:
    Description: ARN of the deployment role
    Value: !GetAtt ChkmateDeploymentRole.Arn
  ExternalId:
    Description: External ID for the role
    Value: !Ref ExternalId`;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

async function assumeDeploymentRole(
  roleArn: string,
  externalId: string,
  region: string = 'us-east-1'
): Promise<TerraformCredentials> {
  const sts = new STSClient({ region: HOST_REGION });

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `ChkmateDeploySession-${Date.now()}`,
    ExternalId: externalId,
    DurationSeconds: 3600, // 1 hour for deployments
  });

  const response = await sts.send(command);

  if (!response.Credentials?.AccessKeyId || !response.Credentials?.SecretAccessKey) {
    throw new Error('Failed to assume deployment role: No credentials returned');
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId,
    secretAccessKey: response.Credentials.SecretAccessKey,
    sessionToken: response.Credentials.SessionToken || '',
    region,
  };
}
