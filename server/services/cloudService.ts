import { PrismaClient, CloudConnection, ConnectionStatus, CloudResource } from '@prisma/client';
import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { scanAWSAccount, AWSCredentials } from './awsCloudService.js';
import { discoverAllResources } from './awsResourceScanner.js';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// The host account credentials (chkmate's own credentials to assume roles)
// These should be in environment variables or assumed by the running task (if on ECS/Lambda)
// For now, we assume the environment has AWS_ACCESS_KEY_ID etc set for the host
const HOST_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Generate setup details for a new AWS connection
 */
export async function generateAWSSetupDetails(userId: string) {
  const externalId = randomUUID(); // Use this to secure the cross-account role
  
  // Dynamically get the Host Account Identity
  const sts = new STSClient({ region: HOST_REGION });
  const caller = await sts.send(new GetCallerIdentityCommand({}));
  
  // We trust the specific user ARN running the server, or the root account if preferred.
  // Using the ARN is most specific and matches the current environment (e.g. user/ahmad-local)
  const TRUSTED_PRINCIPAL = caller.Arn || `arn:aws:iam::${caller.Account}:root`; 
  const HOST_ACCOUNT_ID = caller.Account || 'Unknown';

  const templateYaml = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Chkmate Cross-Account Access Role'
Parameters:
  ExternalId:
    Type: String
    Description: 'The External ID provided by Chkmate to secure the connection.'
    Default: '${externalId}'
Resources:
  ChkmateCrossAccountRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: ChkmateConnectRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: 
                - '${TRUSTED_PRINCIPAL}'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': !Ref ExternalId
      Policies:
        - PolicyName: ChkmateReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:Describe*'
                  - 'rds:Describe*'
                  - 's3:ListAllMyBuckets'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                  - 's3:GetPublicAccessBlock'
                  - 's3:GetBucketEncryption'
                  - 's3:ListBucket'
                  - 'iam:ListUsers'
                  - 'iam:ListRoles'
                  - 'iam:ListAccessKeys'
                  - 'iam:GetAccessKeyLastUsed'
                  - 'iam:GetLoginProfile'
                  - 'iam:ListMFADevices'
                  - 'lambda:ListFunctions'
                  - 'lambda:GetFunction'
                  - 'dynamodb:ListTables'
                  - 'dynamodb:DescribeTable'
                  - 'amplify:ListApps'
                  - 'amplify:ListBranches'
                  - 'elasticloadbalancing:Describe*'
                  - 'ecs:List*'
                  - 'ecs:Describe*'
                  - 'cloudfront:ListDistributions'
                  - 'route53:ListHostedZones'
                  - 'route53:ListResourceRecordSets'
                  - 'sns:ListTopics'
                  - 'sqs:ListQueues'
                  - 'sqs:GetQueueAttributes'
                  - 'elasticache:Describe*'
                  - 'apigateway:GET'
                  - 'ce:GetCostAndUsage'
                  - 'cloudwatch:DescribeAlarms'
                  - 'logs:DescribeLogGroups'
                Resource: '*'
Outputs:
  RoleArn:
    Description: 'The ARN of the role to copy into Chkmate'
    Value: !GetAtt ChkmateCrossAccountRole.Arn
`;

  return {
    externalId,
    hostAccountId: HOST_ACCOUNT_ID, // Return the dynamic account ID
    templateYaml,
    setupUrl: `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/template`
  };
}

/**
 * Assume role to get temporary credentials
 * @param roleArn - The ARN of the role to assume
 * @param externalId - External ID for the role
 * @param region - AWS region for scanning (defaults to 'us-east-1')
 */
async function assumeRole(roleArn: string, externalId: string, region: string = 'us-east-1'): Promise<AWSCredentials> {
  const sts = new STSClient({ region: HOST_REGION });
  
  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: 'ChkmateScanSession',
    ExternalId: externalId
  });

  const response = await sts.send(command);

  if (!response.Credentials?.AccessKeyId || !response.Credentials?.SecretAccessKey) {
    throw new Error('Failed to assume role: No credentials returned');
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId,
    secretAccessKey: response.Credentials.SecretAccessKey,
    sessionToken: response.Credentials.SessionToken,
    region: region, // Use provided region or default
  };
}

/**
 * Verify and create an AWS connection
 */
export async function createAWSConnection(
  userId: string,
  name: string,
  roleArn: string,
  externalId: string
): Promise<CloudConnection> {
  // 1. Verify access by assuming role
  try {
    await assumeRole(roleArn, externalId);
  } catch (err: any) {
    throw new Error(`Failed to verify connection: ${err.message}`);
  }

  // 2. Save to database
  return prisma.cloudConnection.create({
    data: {
      userId,
      provider: 'aws',
      name,
      awsRoleArn: roleArn,
      awsExternalId: externalId,
      status: 'ACTIVE'
    }
  });
}

/**
 * Trigger a sync (scan) for a connection
 * @param connectionId - The ID of the cloud connection to sync
 * @param region - Optional AWS region to scan (defaults to 'us-east-1')
 * @param userId - The user ID for ownership verification
 */
export async function syncConnection(connectionId: string, region: string | undefined, userId: string): Promise<CloudConnection> {
  // Verify ownership first
  const connection = await verifyConnectionOwnership(connectionId, userId);
  if (connection.provider !== 'aws' || !connection.awsRoleArn || !connection.awsExternalId) {
    throw new Error('Invalid connection configuration');
  }

  let status: ConnectionStatus = 'ACTIVE';

  try {
    // 1. Get Credentials with optional region override
    const credentials = await assumeRole(connection.awsRoleArn, connection.awsExternalId, region);

    // 2. Scan
    // Note: scanAWSAccount iterates regions or defaults to us-east-1 context
    // We utilize the resource scanner to get inventory
    const discoveredResources = await discoverAllResources(credentials);

    // 3. Save Resources
    // Clear existing resources and recreate
    const updatedConnection = await prisma.$transaction(async (tx) => {
      await tx.cloudResource.deleteMany({ where: { connectionId } });

      if (discoveredResources.length > 0) {
        await tx.cloudResource.createMany({
          data: discoveredResources.map(r => ({
            connectionId,
            resourceType: r.resourceType,
            resourceId: r.resourceId,
            name: r.name,
            region: r.region,
            metadata: r.metadata
          }))
        });
      }

      return tx.cloudConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          status: 'ACTIVE'
        }
      });
    });

    return updatedConnection;

  } catch (error: any) {
    console.error('Sync failed:', error);
    await prisma.cloudConnection.update({
      where: { id: connectionId },
      data: { status: 'FAILED' }
    });
    if (error.message.includes('No credentials') || error.message.includes('AccessDenied')) {
        throw { statusCode: 403, message: 'Access Denied: Could not assume role. Check AWS configuration.' };
    }
    throw error;
  }
}

/**
 * List connections for user
 */
export async function listConnections(userId: string) {
  return prisma.cloudConnection.findMany({
    where: { userId },
    include: {
      _count: {
        select: { resources: true }
      }
    }
  });
}

/**
 * Verify connection belongs to user
 * @returns The connection if ownership verified, throws Error otherwise
 */
export async function verifyConnectionOwnership(connectionId: string, userId: string) {
  const connection = await prisma.cloudConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  if (connection.userId !== userId) {
    throw new Error('Connection not found');
  }

  return connection;
}

/**
 * Delete connection (with ownership verification)
 */
export async function deleteConnection(id: string, userId: string) {
  // Verify ownership first
  await verifyConnectionOwnership(id, userId);
  return prisma.cloudConnection.delete({ where: { id } });
}

/**
 * Get all resources for a connection to use as context
 * @param connectionId - The connection ID
 * @param userId - Optional user ID for ownership verification (if provided)
 */
export async function getConnectionResources(connectionId: string, userId?: string) {
  // If userId provided, verify ownership
  if (userId) {
    await verifyConnectionOwnership(connectionId, userId);
  }
  return prisma.cloudResource.findMany({
    where: { connectionId }
  });
}

/**
 * Run a full security/cost scan on a saved connection
 * Returns the report directly (does not save individual resources like sync does)
 * @param connectionId - The connection to scan
 * @param region - Optional AWS region to scan (defaults to 'us-east-1')
 * @param userId - The user ID for ownership verification
 */
export async function scanSavedConnection(connectionId: string, region: string | undefined, userId: string) {
  // Verify ownership first
  const connection = await verifyConnectionOwnership(connectionId, userId);
  if (connection.provider !== 'aws' || !connection.awsRoleArn || !connection.awsExternalId) {
    throw new Error('Invalid connection configuration');
  }

  // 1. Get Credentials with optional region override
  try {
    const credentials = await assumeRole(connection.awsRoleArn, connection.awsExternalId, region);

    // 2. Run Scan
    return await scanAWSAccount(credentials);
  } catch (error: any) {
    console.error(`[ScanFailed] Connection ${connectionId}:`, error);
    if (error.message && (error.message.includes('No credentials') || error.message.includes('AccessDenied'))) {
      const customError: any = new Error('Access Denied: Could not assume role. Please verify your CloudFormation stack is deployed and the External ID matches.');
      customError.statusCode = 403;
      throw customError;
    }
    throw error;
  }
}
