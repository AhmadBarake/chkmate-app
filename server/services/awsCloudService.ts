/**
 * AWS Cloud Service
 * Scans AWS accounts for security issues and cost optimization opportunities
 */

import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  ListBucketsCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  IAMClient,
  ListUsersCommand,
  ListAccessKeysCommand,
  GetAccessKeyLastUsedCommand,
  ListRolesCommand,
  ListPoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand
} from '@aws-sdk/client-cost-explorer';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, ListTablesCommand, DescribeTableCommand, DescribeContinuousBackupsCommand } from '@aws-sdk/client-dynamodb';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeListenersCommand, DescribeLoadBalancerAttributesCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { EKSClient, ListClustersCommand, DescribeClusterCommand } from '@aws-sdk/client-eks';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { ECSClient } from '@aws-sdk/client-ecs';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { Route53Client } from '@aws-sdk/client-route-53';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ElastiCacheClient } from '@aws-sdk/client-elasticache';
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import {
  STSClient,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';

import { costService } from './costService.js';
import { discoverAllResources } from './awsResourceScanner.js';

// Internal helper interface
interface ScanResult<T> {
  items: T[];
  scannedCount: number;
  error?: string;
}

export interface IAMDetails {
  users: Array<{ userName: string; createDate?: Date; passwordLastUsed?: Date }>;
  roles: Array<{ roleName: string; createDate?: Date }>;
  policies: Array<{ policyName: string; attachmentCount?: number }>;
}

export interface LambdaIssue extends SecurityIssue {
    functionName: string;
    runtime: string;
}

export interface DynamoDBIssue extends SecurityIssue {
    tableName: string;
}

export interface ELBIssue extends SecurityIssue {
    loadBalancerName: string;
}

export interface EKSIssue extends SecurityIssue {
    clusterName: string;
}

export interface CloudScanResult {
  scannedRegion: string;
  securityIssues: SecurityIssue[];
  costOpportunities: CostOpportunity[];
  
  // New detailed fields
  iamDetails?: IAMDetails;
  lambdaIssues?: LambdaIssue[];
  dynamoDBIssues?: DynamoDBIssue[];
  elbIssues?: ELBIssue[];
  eksIssues?: EKSIssue[];

  costBreakdown?: {
    totalMonthly: number;
    byService: Record<string, number>;
  };
  costTrend?: Array<{ name: string; cost: number }>;
  costForecast?: number;

  // Added errors array to report partial failures
  errors: string[];
  summary: {
    totalResources: number;
    criticalIssues: number;
    highIssues: number;
    estimatedMonthlySavings: number;
  };
  timestamp: Date;
}

export interface SecurityIssue {
  resourceType: string;
  resourceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  recommendation: string;
  region?: string;
}

export interface CostOpportunity {
  resourceType: string;
  resourceId: string;
  currentCost: number;
  potentialSavings: number;
  recommendation: string;
  region?: string;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

/**
 * Create AWS clients with provided credentials
 */
export function createClients(credentials: AWSCredentials) {
  const config = {
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  };

  return {
    ec2: new EC2Client(config),
    s3: new S3Client(config),
    rds: new RDSClient(config),
    iam: new IAMClient({ ...config, region: 'us-east-1' }), // IAM is global
    costExplorer: new CostExplorerClient({ ...config, region: 'us-east-1' }),
    lambda: new LambdaClient(config),
    dynamodb: new DynamoDBClient(config),
    amplify: new AmplifyClient(config),
    elbv2: new ElasticLoadBalancingV2Client(config),
    ecs: new ECSClient(config),
    cloudfront: new CloudFrontClient({ ...config, region: 'us-east-1' }), // CloudFront is global
    route53: new Route53Client({ ...config, region: 'us-east-1' }), // Route 53 is global
    sns: new SNSClient(config),
    sqs: new SQSClient(config),
    elasticache: new ElastiCacheClient(config),
    apigateway: new APIGatewayClient(config),
    cloudwatchlogs: new CloudWatchLogsClient(config),
    elb: new ElasticLoadBalancingV2Client(config),
    eks: new EKSClient(config),
  };
}

/**
 * Scan S3 buckets for security issues
 */
async function scanS3Buckets(s3: S3Client): Promise<ScanResult<SecurityIssue>> {
  const issues: SecurityIssue[] = [];
  let scannedCount = 0;

  try {
    const bucketsResponse = await s3.send(new ListBucketsCommand({}));
    const buckets = bucketsResponse.Buckets || [];
    scannedCount = buckets.length;

    for (const bucket of buckets) {
      if (!bucket.Name) continue;

      // Check public access block
      try {
        const publicAccess = await s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucket.Name })
        );

        const config = publicAccess.PublicAccessBlockConfiguration;
        const missingBlocks: string[] = [];
        if (!config?.BlockPublicAcls) missingBlocks.push('BlockPublicAcls');
        if (!config?.BlockPublicPolicy) missingBlocks.push('BlockPublicPolicy');
        if (!config?.IgnorePublicAcls) missingBlocks.push('IgnorePublicAcls');
        if (!config?.RestrictPublicBuckets) missingBlocks.push('RestrictPublicBuckets');

        if (missingBlocks.length > 0) {
          issues.push({
            resourceType: 'S3 Bucket',
            resourceId: bucket.Name,
            severity: 'CRITICAL',
            issue: `Public access not fully blocked (missing: ${missingBlocks.join(', ')})`,
            recommendation: 'Enable all four public access block settings: BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, and RestrictPublicBuckets',
          });
        }
      } catch (err: any) {
        // No public access block configured
        if (err.name === 'NoSuchPublicAccessBlockConfiguration') {
          issues.push({
            resourceType: 'S3 Bucket',
            resourceId: bucket.Name,
            severity: 'CRITICAL',
            issue: 'No public access block configuration',
            recommendation: 'Configure public access block settings',
          });
        }
      }

      // Check encryption
      try {
        await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket.Name }));
      } catch (err: any) {
        if (err.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          issues.push({
            resourceType: 'S3 Bucket',
            resourceId: bucket.Name,
            severity: 'HIGH',
            issue: 'Default encryption is not enabled',
            recommendation: 'Enable default server-side encryption',
          });
        }
      }
    }
    
    return { items: issues, scannedCount };
  } catch (error: any) {
    console.error('Error scanning S3:', error);
    return { items: issues, scannedCount, error: `S3 Scan Failed: ${error.message}` };
  }
}

/**
 * Scan security groups for open ports
 */
async function scanSecurityGroups(ec2: EC2Client): Promise<ScanResult<SecurityIssue>> {
  const issues: SecurityIssue[] = [];
  const dangerousPorts = [22, 3389, 3306, 5432, 27017, 6379, 9200];
  let scannedCount = 0;

  try {
    const response = await ec2.send(new DescribeSecurityGroupsCommand({}));
    const securityGroups = response.SecurityGroups || [];
    scannedCount = securityGroups.length;

    for (const sg of securityGroups) {
      for (const permission of sg.IpPermissions || []) {
        const fromPort = permission.FromPort;
        const toPort = permission.ToPort;

        // Check both IPv4 and IPv6 ranges for public access
        const isPublicIPv4 = (permission.IpRanges || []).some((r: any) => r.CidrIp === '0.0.0.0/0');
        const isPublicIPv6 = (permission.Ipv6Ranges || []).some((r: any) => r.CidrIpv6 === '::/0');
        const isPublic = isPublicIPv4 || isPublicIPv6;
        const publicCidr = isPublicIPv4 ? '0.0.0.0/0' : '::/0';

        if (!isPublic) continue;

        // Check for all traffic (protocol -1)
        if (permission.IpProtocol === '-1') {
          issues.push({
            resourceType: 'Security Group',
            resourceId: `${sg.GroupId} (${sg.GroupName})`,
            severity: 'CRITICAL',
            issue: `All traffic is open to the world (${publicCidr})`,
            recommendation: 'Restrict to only necessary ports and IPs',
          });
          continue;
        }

        // Check for all ports open
        if (fromPort === 0 && toPort === 65535) {
          issues.push({
            resourceType: 'Security Group',
            resourceId: `${sg.GroupId} (${sg.GroupName})`,
            severity: 'CRITICAL',
            issue: `All ports (0-65535) are open to the world (${publicCidr})`,
            recommendation: 'Restrict to only necessary ports and IPs',
          });
          continue;
        }

        // Check if any dangerous port falls within the port range
        if (fromPort != null && toPort != null) {
          for (const dangerousPort of dangerousPorts) {
            if (fromPort <= dangerousPort && toPort >= dangerousPort) {
              issues.push({
                resourceType: 'Security Group',
                resourceId: `${sg.GroupId} (${sg.GroupName})`,
                severity: 'CRITICAL',
                issue: `Port ${dangerousPort} is open to the world (${publicCidr}) via range ${fromPort}-${toPort}`,
                recommendation: 'Restrict CIDR to specific IP addresses or ranges',
              });
            }
          }
        }
      }
    }
    return { items: issues, scannedCount };
  } catch (error: any) {
    console.error('Error scanning security groups:', error);
    return { items: issues, scannedCount, error: `Security Group Scan Failed: ${error.message}` };
  }
}

/**
 * Scan RDS instances for security issues
 */
async function scanRDSInstances(rds: RDSClient): Promise<ScanResult<SecurityIssue>> {
  const issues: SecurityIssue[] = [];
  let scannedCount = 0;

  try {
    const response = await rds.send(new DescribeDBInstancesCommand({}));
    const instances = response.DBInstances || [];
    scannedCount = instances.length;

    for (const db of instances) {
      if (db.PubliclyAccessible) {
        issues.push({
          resourceType: 'RDS Instance',
          resourceId: db.DBInstanceIdentifier || 'Unknown',
          severity: 'HIGH',
          issue: 'Database is publicly accessible',
          recommendation: 'Disable public accessibility and use VPC',
        });
      }

      if (!db.StorageEncrypted) {
        issues.push({
          resourceType: 'RDS Instance',
          resourceId: db.DBInstanceIdentifier || 'Unknown',
          severity: 'HIGH',
          issue: 'Storage is not encrypted',
          recommendation: 'Enable storage encryption',
        });
      }

      if (!db.MultiAZ && db.DBInstanceIdentifier?.includes('prod')) {
        issues.push({
          resourceType: 'RDS Instance',
          resourceId: db.DBInstanceIdentifier || 'Unknown',
          severity: 'MEDIUM',
          issue: 'Production database is not Multi-AZ',
          recommendation: 'Enable Multi-AZ for high availability',
        });
      }
    }
    return { items: issues, scannedCount };
  } catch (error: any) {
    console.error('Error scanning RDS:', error);
    return { items: issues, scannedCount, error: `RDS Scan Failed: ${error.message}` };
  }
}

/**
 * Check for old/unused IAM access keys
 */
async function scanIAMKeys(iam: IAMClient): Promise<ScanResult<SecurityIssue>> {
  const issues: SecurityIssue[] = [];
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  let scannedCount = 0;

  try {
    const usersResponse = await iam.send(new ListUsersCommand({}));
    const users = usersResponse.Users || [];
    scannedCount = users.length;

    for (const user of users) {
      if (!user.UserName) continue;

      const keysResponse = await iam.send(
        new ListAccessKeysCommand({ UserName: user.UserName })
      );

      for (const key of keysResponse.AccessKeyMetadata || []) {
        if (!key.AccessKeyId) continue;

        // Check key age
        const keyAge = Date.now() - (key.CreateDate?.getTime() || 0);
        if (keyAge > NINETY_DAYS) {
          issues.push({
            resourceType: 'IAM Access Key',
            resourceId: `${user.UserName} / ${key.AccessKeyId}`,
            severity: 'MEDIUM',
            issue: 'Access key is older than 90 days',
            recommendation: 'Rotate access keys regularly',
          });
        }

        // Check last used
        const lastUsedResponse = await iam.send(
          new GetAccessKeyLastUsedCommand({ AccessKeyId: key.AccessKeyId })
        );

        if (!lastUsedResponse.AccessKeyLastUsed?.LastUsedDate) {
          issues.push({
            resourceType: 'IAM Access Key',
            resourceId: `${user.UserName} / ${key.AccessKeyId}`,
            severity: 'LOW',
            issue: 'Access key has never been used',
            recommendation: 'Remove unused access keys',
          });
        }
      }
    }
    return { items: issues, scannedCount };
  } catch (error: any) {
    console.error('Error scanning IAM:', error);
    return { items: issues, scannedCount, error: `IAM Scan Failed: ${error.message}` };
  }
}

/**
 * Find cost optimization opportunities
 */
async function findCostOpportunities(
  ec2: EC2Client,
  rds: RDSClient,
  s3: S3Client,
  costExplorer: CostExplorerClient
): Promise<ScanResult<CostOpportunity>> {
  const opportunities: CostOpportunity[] = [];
  let scannedCount = 0;

  try {
    // Find unattached EBS volumes
    const volumesResponse = await ec2.send(new DescribeVolumesCommand({
      Filters: [{ Name: 'status', Values: ['available'] }],
    }));
    scannedCount += (volumesResponse.Volumes || []).length;

    for (const volume of volumesResponse.Volumes || []) {
      const size = volume.Size || 0;
      const monthlyEstimate = size * 0.10; // ~$0.10 per GB-month for gp2

      opportunities.push({
        resourceType: 'EBS Volume',
        resourceId: volume.VolumeId || 'Unknown',
        currentCost: monthlyEstimate,
        potentialSavings: monthlyEstimate, // 100% savings if deleted
        recommendation: 'Unattached volume - consider deleting if not needed',
      });
    }

    // Find stopped instances
    const instancesResponse = await ec2.send(new DescribeInstancesCommand({
      Filters: [{ Name: 'instance-state-name', Values: ['stopped'] }],
    }));

    for (const reservation of instancesResponse.Reservations || []) {
      scannedCount += (reservation.Instances || []).length;
      for (const instance of reservation.Instances || []) {
        opportunities.push({
          resourceType: 'EC2 Instance',
          resourceId: instance.InstanceId || 'Unknown',
          currentCost: 0,
          potentialSavings: 5, // EBS costs still incurred
          recommendation: 'Instance is stopped - consider terminating if not needed',
        });
      }
    }

    // Find idle RDS instances (simple version: available but small)
    const rdsResponse = await rds.send(new DescribeDBInstancesCommand({}));
    for (const db of rdsResponse.DBInstances || []) {
      scannedCount++;
      if (db.DBInstanceStatus === 'available' && (db.DBInstanceClass?.includes('micro') || db.DBInstanceClass?.includes('small'))) {
        opportunities.push({
          resourceType: 'RDS Instance',
          resourceId: db.DBInstanceIdentifier || 'Unknown',
          currentCost: 15, // Baseline cost
          potentialSavings: 5,
          recommendation: 'Consider Graviton (db.t4g) for 20% better price/performance',
        });
      }
    }

    // S3 Savings (Intelligent-Tiering recommendation)
    const s3Response = await s3.send(new ListBucketsCommand({}));
    for (const bucket of s3Response.Buckets || []) {
      scannedCount++;
      opportunities.push({
         resourceType: 'S3 Bucket',
         resourceId: bucket.Name || 'Unknown',
         currentCost: 0,
         potentialSavings: 0,
         recommendation: 'Enable Intelligent-Tiering to automatically save on infrequent access',
      });
    }
    
    return { items: opportunities, scannedCount };
  } catch (error: any) {
    console.error('Error finding cost opportunities:', error);
    return { items: opportunities, scannedCount, error: `Cost Analysis Failed: ${error.message}` };
  }
}

// ... existing imports ...

/**
 * Scan Lambda Functions for deprecated runtimes
 */
async function scanLambdaFunctions(lambda: LambdaClient): Promise<ScanResult<LambdaIssue>> {
  const issues: LambdaIssue[] = [];
  let scannedCount = 0;
  // Deprecated or soon-to-be deprecated runtimes
  const deprecatedRuntimes = ['nodejs14.x', 'nodejs16.x', 'python3.8', 'python3.9', 'java11', 'dotnetcore3.1', 'ruby2.7', 'go1.x'];

  try {
    const response = await lambda.send(new ListFunctionsCommand({}));
    const functions = response.Functions || [];
    scannedCount = functions.length;

    for (const fn of functions) {
        if (!fn.FunctionName) continue;

        if (fn.Runtime && deprecatedRuntimes.includes(fn.Runtime)) {
            issues.push({
                resourceType: 'Lambda Function',
                resourceId: fn.FunctionArn || fn.FunctionName,
                functionName: fn.FunctionName,
                runtime: fn.Runtime,
                severity: 'HIGH',
                issue: `Deprecated Runtime: ${fn.Runtime}`,
                recommendation: 'Update to a supported runtime version (e.g., nodejs18.x, python3.11)',
            });
        }
    }
    return { items: issues, scannedCount };
  } catch (error: any) {
      console.error('Error scanning Lambda:', error);
      return { items: issues, scannedCount, error: `Lambda Scan Failed: ${error.message}` };
  }
}

/**
 * Scan DynamoDB Tables for backups and deletion protection
 */
async function scanDynamoDBTables(dynamodb: DynamoDBClient): Promise<ScanResult<DynamoDBIssue>> {
    const issues: DynamoDBIssue[] = [];
    let scannedCount = 0;

    try {
        const listResponse = await dynamodb.send(new ListTablesCommand({}));
        const tableNames = listResponse.TableNames || [];
        scannedCount = tableNames.length;

        for (const tableName of tableNames) {
            try {
                const descResponse = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
                const table = descResponse.Table;
                
                if (!table) continue;

                if (!table.DeletionProtectionEnabled) {
                    issues.push({
                        resourceType: 'DynamoDB Table',
                        resourceId: tableName,
                        tableName: tableName,
                        severity: 'MEDIUM',
                        issue: 'Deletion protection is disabled',
                        recommendation: 'Enable deletion protection to prevent accidental deletion',
                    });
                }
                
                const backupResponse = await dynamodb.send(new DescribeContinuousBackupsCommand({ TableName: tableName }));
                const pitr = backupResponse.ContinuousBackupsDescription?.PointInTimeRecoveryDescription;
                
                if (pitr?.PointInTimeRecoveryStatus !== 'ENABLED') {
                     issues.push({
                        resourceType: 'DynamoDB Table',
                        resourceId: tableName,
                        tableName: tableName,
                        severity: 'LOW',
                        issue: 'Point-in-Time Recovery (PITR) is disabled',
                        recommendation: 'Enable PITR for data recovery',
                    });
                }

            } catch (err: any) {
                console.warn(`Failed to scan DynamoDB table ${tableName}:`, err.message);
            }
        }

        return { items: issues, scannedCount };
    } catch (error: any) {
        console.error('Error scanning DynamoDB:', error);
         return { items: issues, scannedCount, error: `DynamoDB Scan Failed: ${error.message}` };
    }
}

/**
 * Scan ELB
 */
async function scanLoadBalancers(elb: ElasticLoadBalancingV2Client): Promise<ScanResult<ELBIssue>> {
    const issues: ELBIssue[] = [];
    let scannedCount = 0;

    try {
        const lbResponse = await elb.send(new DescribeLoadBalancersCommand({}));
        const loadBalancers = lbResponse.LoadBalancers || [];
        scannedCount = loadBalancers.length;

        for (const lb of loadBalancers) {
             if (!lb.LoadBalancerArn || !lb.LoadBalancerName) continue;

             try {
                const attrResponse = await elb.send(new DescribeLoadBalancerAttributesCommand({ LoadBalancerArn: lb.LoadBalancerArn }));
                const attrs = attrResponse.Attributes || [];
                
                const accessLogs = attrs.find(a => a.Key === 'access_logs.s3.enabled');
                const deletionProtection = attrs.find(a => a.Key === 'deletion_protection.enabled');

                if (accessLogs?.Value !== 'true') {
                    issues.push({
                        resourceType: 'Load Balancer',
                        resourceId: lb.LoadBalancerName,
                        loadBalancerName: lb.LoadBalancerName,
                        severity: 'MEDIUM',
                        issue: 'Access logging is disabled',
                        recommendation: 'Enable access logs to S3 for auditability',
                    });
                }

                if (deletionProtection?.Value !== 'true') {
                    issues.push({
                        resourceType: 'Load Balancer',
                        resourceId: lb.LoadBalancerName,
                        loadBalancerName: lb.LoadBalancerName,
                        severity: 'LOW',
                        issue: 'Deletion protection is disabled',
                        recommendation: 'Enable deletion protection',
                    });
                }

             } catch (err) {
                 // ignore
             }
             
             try {
                 const listenersResponse = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lb.LoadBalancerArn }));
                 const listeners = listenersResponse.Listeners || [];
                 
                 for (const listener of listeners) {
                      if (listener.Protocol === 'HTTP') {
                          const defaultAction = listener.DefaultActions?.[0];
                          if (defaultAction?.Type !== 'redirect') {
                              issues.push({
                                resourceType: 'Load Balancer',
                                resourceId: lb.LoadBalancerName,
                                loadBalancerName: lb.LoadBalancerName,
                                severity: 'HIGH',
                                issue: 'Unsecured HTTP Listener found without redirect',
                                recommendation: 'Redirect HTTP to HTTPS or remove HTTP listener',
                             });
                          }
                      }
                 }
                 
             } catch (err) {
                 // ignore
             }
        }
        
        return { items: issues, scannedCount };
    } catch (error: any) {
        console.error('Error scanning ELB:', error);
        return { items: issues, scannedCount, error: `ELB Scan Failed: ${error.message}` };
    }
}

/**
 * Scan EKS Clusters
 */
async function scanEKSClusters(eks: EKSClient): Promise<ScanResult<EKSIssue>> {
    const issues: EKSIssue[] = [];
    let scannedCount = 0;

    try {
        const listResponse = await eks.send(new ListClustersCommand({}));
        const clusterNames = listResponse.clusters || [];
        scannedCount = clusterNames.length;

        for (const clusterName of clusterNames) {
             try {
                 const descResponse = await eks.send(new DescribeClusterCommand({ name: clusterName }));
                 const cluster = descResponse.cluster;
                 
                 if (!cluster) continue;
                 
                 if (cluster.resourcesVpcConfig?.endpointPublicAccess) {
                      if (!cluster.resourcesVpcConfig.publicAccessCidrs || cluster.resourcesVpcConfig.publicAccessCidrs.includes('0.0.0.0/0')) {
                          issues.push({
                            resourceType: 'EKS Cluster',
                            resourceId: clusterName,
                            clusterName: clusterName,
                            severity: 'CRITICAL',
                            issue: 'Public API endpoint enabled with 0.0.0.0/0',
                            recommendation: 'Disable public access or restrict CIDRs',
                         });
                      }
                 }
                 
                 if (!cluster.encryptionConfig || cluster.encryptionConfig.length === 0) {
                     issues.push({
                        resourceType: 'EKS Cluster',
                        resourceId: clusterName,
                        clusterName: clusterName,
                        severity: 'HIGH',
                        issue: 'Secrets encryption (Envelope Encryption) inactive',
                        recommendation: 'Enable secrets encryption with KMS',
                     });
                 }
                 
             } catch (err) {
                 // ignore
             }
        }
        return { items: issues, scannedCount };
    } catch (error: any) {
        console.error('Error scanning EKS:', error);
        return { items: issues, scannedCount, error: `EKS Scan Failed: ${error.message}` };
    }
}

/**
 * Detailed IAM Analysis
 */
async function scanIAMDetails(iam: IAMClient): Promise<{details: IAMDetails, issues: SecurityIssue[]}> {
     const issues: SecurityIssue[] = [];
     const details: IAMDetails = { users: [], roles: [], policies: [] };
     
     try {
         const usersRes = await iam.send(new ListUsersCommand({}));
         details.users = (usersRes.Users || []).map(u => ({
             userName: u.UserName!,
             createDate: u.CreateDate,
             passwordLastUsed: u.PasswordLastUsed
         }));
         
         const rolesRes = await iam.send(new ListRolesCommand({}));
         details.roles = (rolesRes.Roles || []).map(r => ({
             roleName: r.RoleName!,
             createDate: r.CreateDate
         }));
         
         const polRes = await iam.send(new ListPoliciesCommand({ Scope: 'Local', OnlyAttached: true }));
         details.policies = (polRes.Policies || []).map(p => ({
             policyName: p.PolicyName!,
             attachmentCount: p.AttachmentCount
         }));
         
         for (const u of details.users) {
             if (u.passwordLastUsed) {
                  const daysSince = (Date.now() - u.passwordLastUsed.getTime());
                  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
                  if (daysSince > NINETY_DAYS) {
                       issues.push({
                            resourceType: 'IAM User',
                            resourceId: u.userName,
                            severity: 'MEDIUM',
                            issue: 'Password older than 90 days',
                            recommendation: 'Rotate password',
                       });
                  }
             }
         }
         
     } catch (e: any) {
         console.error('IAM Scan Details Failed:', e);
     }
     
     return { details, issues };
}

/**
 * Detailed Cost Analysis
 */
async function getDetailedCostAnalysis(costExplorer: CostExplorerClient): Promise<{
    byService: Record<string, number>;
    forecast: number;
}> {
    const end = new Date();
    const start = new Date();
    start.setDate(1); // Start of this month

    const byService: Record<string, number> = {};
    let forecast = 0;

    try {
        const response = await costExplorer.send(new GetCostAndUsageCommand({
            TimePeriod: { Start: start.toISOString().split('T')[0], End: end.toISOString().split('T')[0] },
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
            GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
        }));

        (response.ResultsByTime?.[0]?.Groups || []).forEach(group => {
            const serviceName = group.Keys?.[0] || 'Unknown';
            const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
            if (cost > 0) {
                byService[serviceName] = cost;
            }
        });
        
        forecast = Object.values(byService).reduce((a, b) => a + b, 0);

    } catch (e) {
        console.warn('Cost Analysis Failed (Permissions?):', e);
    }
    
    return { byService, forecast };
}

/**
 * Fetch real historical trends from Cost Explorer
 */
async function fetchHistoricalTrends(client: CostExplorerClient): Promise<Array<{ name: string; cost: number }>> {
  const end = new Date();
  end.setDate(1); // Start of current month
  const start = new Date();
  start.setDate(1); // Set day to 1 BEFORE subtracting months to avoid day-overflow
  start.setMonth(start.getMonth() - 5); // 6 months ago

  try {
    const response = await client.send(new GetCostAndUsageCommand({
      TimePeriod: {
        Start: start.toISOString().split('T')[0],
        End: end.toISOString().split('T')[0],
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
    }));

    return (response.ResultsByTime || []).map(r => {
      const date = new Date(r.TimePeriod?.Start || '');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        name: monthNames[date.getMonth()],
        cost: parseFloat(r.Total?.UnblendedCost?.Amount || '0'),
      };
    });
  } catch (e) {
    console.warn('[CloudScanner] Could not fetch real cost trends (permisson or not enabled):', e);
    return [];
  }
}

/**
 * Run full cloud scan
 */
export async function scanAWSAccount(credentials: AWSCredentials): Promise<CloudScanResult> {
  const clients = createClients(credentials);
  const scannedRegion = credentials.region;

  console.log(`[CloudScanner] Starting scan for region: ${scannedRegion}`);

  // Run all scans and discovery in parallel
  const [
      s3, 
      sg, 
      rds, 
      iam, 
      iamDetails,
      cost, 
      allResources, 
      trends, 
      lambda,
      dynamodb,
      elb,
      eks,
      detailedCost
  ] = await Promise.all([
    scanS3Buckets(clients.s3),
    scanSecurityGroups(clients.ec2),
    scanRDSInstances(clients.rds),
    scanIAMKeys(clients.iam),
    scanIAMDetails(clients.iam),
    findCostOpportunities(clients.ec2, clients.rds, clients.s3, clients.costExplorer),
    discoverAllResources(credentials),
    fetchHistoricalTrends(clients.costExplorer),
    scanLambdaFunctions(clients.lambda),
    scanDynamoDBTables(clients.dynamodb),
    scanLoadBalancers(clients.elb),
    scanEKSClusters(clients.eks),
    getDetailedCostAnalysis(clients.costExplorer)
  ]);

  // Calculate detailed cost breakdown (Heuristic fallback)
  let heuristicCostBreakdown;
  try {
    heuristicCostBreakdown = await costService.analyzeLiveResources(allResources, scannedRegion);
  } catch (error: any) {
    console.warn(`[CloudScanner] Heuristic cost analysis failed: ${error.message}`);
    heuristicCostBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: [],
    };
  }

  console.log(`[CloudScanner] Scan complete for ${scannedRegion}:`);
  console.log(`  - S3 Buckets: ${s3.scannedCount} (global)`);
  console.log(`  - Security Groups: ${sg.scannedCount}`);
  console.log(`  - RDS Instances: ${rds.scannedCount}`);
  console.log(`  - IAM Users: ${iam.scannedCount}`);
  console.log(`  - EC2 for Cost: ${cost.scannedCount}`);
  console.log(`  - Lambda: ${lambda.scannedCount}`);
  console.log(`  - DynamoDB: ${dynamodb.scannedCount}`);
  console.log(`  - ELB: ${elb.scannedCount}`);
  console.log(`  - EKS: ${eks.scannedCount}`);

  // Aggregate results
  const allIssues = [
    ...s3.items,
    ...sg.items,
    ...rds.items,
    ...iam.items,
    ...iamDetails.issues,
    ...lambda.items,
    ...dynamodb.items,
    ...elb.items,
    ...eks.items
  ];
  
  // Collect errors with better messaging
  const errors = [
      s3.error, 
      sg.error, 
      rds.error, 
      iam.error, 
      cost.error,
      lambda.error,
      dynamodb.error,
      elb.error,
      eks.error
  ].filter(Boolean) as string[];
  
  if (errors.length > 0) {
    console.warn(`[CloudScanner] Errors encountered:`, errors);
  }

  // Determine final cost breakdown
  // Prefer Cost Explorer (detailedCost), fallback to heuristic
  const finalTotalMonthly = detailedCost.forecast > 0 ? detailedCost.forecast : heuristicCostBreakdown.totalMonthly;
  const finalByService = detailedCost.forecast > 0 ? detailedCost.byService : heuristicCostBreakdown.byService;

  return {
    scannedRegion,
    securityIssues: allIssues,
    costOpportunities: cost.items,
    
    // New Fields
    iamDetails: iamDetails.details,
    lambdaIssues: lambda.items,
    dynamoDBIssues: dynamodb.items,
    elbIssues: elb.items,
    eksIssues: eks.items,
    costForecast: detailedCost.forecast,
    
    costBreakdown: {
      totalMonthly: finalTotalMonthly,
      byService: finalByService,
    },
    costTrend: trends.length > 0 ? trends : undefined,
    errors,
    summary: {
      totalResources: allResources.length + lambda.scannedCount + dynamodb.scannedCount + elb.scannedCount + eks.scannedCount,
      criticalIssues: allIssues.filter(i => i.severity === 'CRITICAL').length,
      highIssues: allIssues.filter(i => i.severity === 'HIGH').length,
      estimatedMonthlySavings: cost.items.reduce((sum, o) => sum + o.potentialSavings, 0),
    },
    timestamp: new Date(),
  };
}

/**
 * Validate AWS credentials are valid
 */
export async function validateCredentials(credentials: AWSCredentials): Promise<boolean> {
  try {
    const sts = new STSClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        ...(credentials.sessionToken && { sessionToken: credentials.sessionToken }),
      },
    });

    // Check identity - this verifies authentication without needing specific resource permissions
    const command = new GetCallerIdentityCommand({});
    const response = await sts.send(command);
    
    console.log('AWS Credentials Validated. Account:', response.Account, 'ARN:', response.Arn);
    return true;
  } catch (error: any) {
    console.error('Credential validation failed:', error.message || error);
    
    // Log specific AWS error codes if available
    if (error.$metadata) {
       console.error('AWS Request ID:', error.$metadata.requestId);
       console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    
    return false;
  }
}
