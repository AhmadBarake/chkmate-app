
import {
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  ListUsersCommand,
  GetLoginProfileCommand, 
  ListMFADevicesCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  ListFunctionsCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  ListTablesCommand,
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  ListAppsCommand,
  ListBranchesCommand,
  AmplifyClient
} from '@aws-sdk/client-amplify';
import { createClients, AWSCredentials } from './awsCloudService.js';

export interface DiscoveredResource {
  resourceType: string; // vpc, subnet, rds, ec2, s3, etc.
  resourceId: string;
  name?: string;
  region: string;
  metadata: any;
}

/**
 * Helper to extract Name tag
 */
function getNameFromTags(tags: any[] | undefined): string | undefined {
  if (!tags) return undefined;
  return tags.find((t: any) => t.Key === 'Name')?.Value;
}

/**
 * Helper to log AWS errors with clear messaging
 */
function logAWSError(service: string, region: string, error: any): void {
  const errorName = error?.name || error?.Code || 'Unknown';
  const errorMessage = error?.message || String(error);
  
  if (errorName === 'AccessDeniedException' || errorName === 'UnauthorizedAccess' || 
      errorMessage.includes('AccessDenied') || errorMessage.includes('not authorized')) {
    console.warn(`[AWS Scanner] ⚠️  PERMISSION DENIED for ${service} in ${region}`);
    console.warn(`  → Update your IAM policy to include ${service} permissions`);
  } else {
    console.error(`[AWS Scanner] Error discovering ${service} in ${region}:`, errorName, '-', errorMessage);
  }
}

/**
 * Discover VPCs
 */
async function discoverVPCs(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await ec2.send(new DescribeVpcsCommand({}));
    for (const vpc of response.Vpcs || []) {
      results.push({
        resourceType: 'vpc',
        resourceId: vpc.VpcId!,
        name: getNameFromTags(vpc.Tags),
        region,
        metadata: {
          cidrBlock: vpc.CidrBlock,
          isDefault: vpc.IsDefault,
          state: vpc.State
        }
      });
    }
  } catch (e) {
    console.error(`Error discovering VPCs in ${region}:`, e);
  }
  return results;
}

/**
 * Discover Subnets
 */
async function discoverSubnets(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await ec2.send(new DescribeSubnetsCommand({}));
    for (const subnet of response.Subnets || []) {
      results.push({
        resourceType: 'subnet',
        resourceId: subnet.SubnetId!,
        name: getNameFromTags(subnet.Tags),
        region,
        metadata: {
          vpcId: subnet.VpcId,
          cidrBlock: subnet.CidrBlock,
          availabilityZone: subnet.AvailabilityZone,
          mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch
        }
      });
    }
  } catch (e) {
    console.error(`Error discovering Subnets in ${region}:`, e);
  }
  return results;
}

/**
 * Discover EC2 Instances
 */
async function discoverEC2(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await ec2.send(new DescribeInstancesCommand({}));
    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        if (instance.State?.Name === 'terminated') continue;
        
        results.push({
          resourceType: 'ec2_instance',
          resourceId: instance.InstanceId!,
          name: getNameFromTags(instance.Tags),
          region,
          metadata: {
            instanceType: instance.InstanceType,
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            privateIp: instance.PrivateIpAddress,
            publicIp: instance.PublicIpAddress,
            state: instance.State?.Name
          }
        });
      }
    }
  } catch (e) {
    console.error(`Error discovering EC2 in ${region}:`, e);
  }
  return results;
}

/**
 * Discover Security Groups
 */
async function discoverSecurityGroups(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await ec2.send(new DescribeSecurityGroupsCommand({}));
    for (const sg of response.SecurityGroups || []) {
      results.push({
        resourceType: 'security_group',
        resourceId: sg.GroupId!,
        name: sg.GroupName,
        region,
        metadata: {
          vpcId: sg.VpcId,
          description: sg.Description,
          inboundRules: sg.IpPermissions,
          outboundRules: sg.IpPermissionsEgress
        }
      });
    }
  } catch (e) {
    logAWSError('EC2 (SecurityGroups)', region, e);
  }
  return results;
}

/**
 * Discover RDS Instances
 */
async function discoverRDS(rds: RDSClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await rds.send(new DescribeDBInstancesCommand({}));
    for (const db of response.DBInstances || []) {
      results.push({
        resourceType: 'rds_instance',
        resourceId: db.DBInstanceIdentifier!,
        name: db.DBInstanceIdentifier,
        region,
        metadata: {
          engine: db.Engine,
          engineVersion: db.EngineVersion,
          instanceClass: db.DBInstanceClass,
          status: db.DBInstanceStatus,
          endpoint: db.Endpoint?.Address,
          multiAZ: db.MultiAZ,
          publiclyAccessible: db.PubliclyAccessible
        }
      });
    }
  } catch (e) {
    console.error(`Error discovering RDS in ${region}:`, e);
  }
  return results;
}

/**
 * Discover S3 Buckets
 */
async function discoverS3(s3: S3Client, defaultRegion: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await s3.send(new ListBucketsCommand({}));
    for (const bucket of response.Buckets || []) {
      if (!bucket.Name) continue;
      
      // Determine bucket region and versioning
      let bucketRegion = defaultRegion;
      let versioning = 'Disabled';
      try {
        const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
        bucketRegion = loc.LocationConstraint || 'us-east-1';
        
        try {
          const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket.Name }));
          versioning = ver.Status || 'Disabled';
        } catch (e) {
          // AccessDenied or other error for versioning
        }
      } catch (e) {
        // Ignore location fetch error, assume default or global
      }

      results.push({
        resourceType: 's3_bucket',
        resourceId: bucket.Name,
        name: bucket.Name,
        region: bucketRegion,
        metadata: {
          creationDate: bucket.CreationDate,
          versioning
        }
      });
    }
  } catch (e) {
    logAWSError('S3', 'global', e);
  }
  return results;
}


/**
 * Discover IAM Users
 */
async function discoverIAM(iam: IAMClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const response = await iam.send(new ListUsersCommand({}));
    for (const user of response.Users || []) {
      if (!user.UserName) continue;

      let hasConsoleAccess = false;
      let mfaEnabled = false;

      // Check Console Access
      try {
        await iam.send(new GetLoginProfileCommand({ UserName: user.UserName }));
        hasConsoleAccess = true;
      } catch (e: any) {
        // NoSuchEntity means no console access
        if (e.name !== 'NoSuchEntityException') {
            console.error(`Error checking profile for ${user.UserName}`, e);
        }
      }

      // Check MFA
      try {
        const mfa = await iam.send(new ListMFADevicesCommand({ UserName: user.UserName }));
        mfaEnabled = (mfa.MFADevices?.length || 0) > 0;
      } catch (e) {
          console.error(`Error checking MFA for ${user.UserName}`, e);
      }

      results.push({
        resourceType: 'iam_user',
        resourceId: user.Arn || user.UserName,
        name: user.UserName,
        region: 'global',
        metadata: {
          path: user.Path,
          createDate: user.CreateDate,
          passwordLastUsed: user.PasswordLastUsed,
          hasConsoleAccess,
          mfaEnabled
        }
      });
    }
  } catch (e) {
    logAWSError('IAM', 'global', e);
  }
  return results;
}

/**
 * Discover Lambda Functions
 */
async function discoverLambda(lambda: LambdaClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
     const response = await lambda.send(new ListFunctionsCommand({}));
     for (const func of response.Functions || []) {
         results.push({
             resourceType: 'lambda_function',
             resourceId: func.FunctionArn!,
             name: func.FunctionName,
             region,
             metadata: {
                 runtime: func.Runtime,
                 lastModified: func.LastModified,
                 memorySize: func.MemorySize,
                 timeout: func.Timeout
             }
         });
     }
  } catch (e) {
    logAWSError('Lambda', region, e);
  }
  return results;
}

/**
 * Discover DynamoDB Tables
 */
async function discoverDynamoDB(dynamodb: DynamoDBClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
      const list = await dynamodb.send(new ListTablesCommand({}));
      for (const tableName of list.TableNames || []) {
          try {
              const details = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
              const table = details.Table;
              if (!table) continue;

              results.push({
                  resourceType: 'dynamodb_table',
                  resourceId: table.TableArn || tableName,
                  name: tableName,
                  region,
                  metadata: {
                      status: table.TableStatus,
                      itemCount: table.ItemCount,
                      sizeBytes: table.TableSizeBytes,
                      billingMode: table.BillingModeSummary?.BillingMode || 'PROVISIONED',
                      readCapacity: table.ProvisionedThroughput?.ReadCapacityUnits,
                      writeCapacity: table.ProvisionedThroughput?.WriteCapacityUnits
                  }
              });
          } catch (e) {
              console.error(`Error describing table ${tableName}`, e);
          }
      }
  } catch (e) {
    logAWSError('DynamoDB', region, e);
  }
  return results;
}


/**
 * Discover Amplify Apps
 */
async function discoverAmplify(amplify: AmplifyClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    const appsResponse = await amplify.send(new ListAppsCommand({}));
    for (const app of appsResponse.apps || []) {
      // Get branches for this app
      let branches: string[] = [];
      try {
        const branchesResponse = await amplify.send(new ListBranchesCommand({ appId: app.appId }));
        branches = (branchesResponse.branches || []).map(b => b.branchName || 'unknown');
      } catch (e) {
        console.error(`Error listing branches for ${app.name}`, e);
      }

      results.push({
        resourceType: 'amplify_app',
        resourceId: app.appArn || app.appId!,
        name: app.name,
        region,
        metadata: {
          appId: app.appId,
          defaultDomain: app.defaultDomain,
          repository: app.repository,
          platform: app.platform,
          createTime: app.createTime,
          updateTime: app.updateTime,
          branches
        }
      });
    }
  } catch (e) {
    logAWSError('Amplify', region, e);
  }
  return results;
}


/**
 * Main discovery function
 */
export async function discoverAllResources(credentials: AWSCredentials): Promise<DiscoveredResource[]> {
  const clients = createClients(credentials);
  const region = credentials.region;

  const [vpcs, subnets, ec2s, sgs, rdss, s3s, iams, lambdas, dynamos, amplifys] = await Promise.all([
    discoverVPCs(clients.ec2, region),
    discoverSubnets(clients.ec2, region),
    discoverEC2(clients.ec2, region),
    discoverSecurityGroups(clients.ec2, region),
    discoverRDS(clients.rds, region),
    discoverS3(clients.s3, region),
    discoverIAM(clients.iam, region),
    discoverLambda(clients.lambda, region),
    discoverDynamoDB(clients.dynamodb, region),
    discoverAmplify(clients.amplify, region)
  ]);

  return [
    ...vpcs,
    ...subnets,
    ...ec2s,
    ...sgs,
    ...rdss,
    ...s3s,
    ...iams,
    ...lambdas,
    ...dynamos,
    ...amplifys
  ];
}
