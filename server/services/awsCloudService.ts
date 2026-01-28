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
} from '@aws-sdk/client-iam';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { AmplifyClient } from '@aws-sdk/client-amplify';
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

export interface CloudScanResult {
  scannedRegion: string;
  securityIssues: SecurityIssue[];
  costOpportunities: CostOpportunity[];
  costBreakdown?: {
    totalMonthly: number;
    byService: Record<string, number>;
  };
  costTrend?: Array<{ name: string; cost: number }>;
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
  };
}

/**
 * Scan S3 buckets for security issues
 */
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
        if (!config?.BlockPublicAcls || !config?.BlockPublicPolicy) {
          issues.push({
            resourceType: 'S3 Bucket',
            resourceId: bucket.Name,
            severity: 'CRITICAL',
            issue: 'Public access is not blocked',
            recommendation: 'Enable BlockPublicAcls and BlockPublicPolicy',
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

        // Check for 0.0.0.0/0 ingress on dangerous ports
        for (const range of permission.IpRanges || []) {
          if (range.CidrIp === '0.0.0.0/0') {
            if (fromPort && dangerousPorts.includes(fromPort)) {
              issues.push({
                resourceType: 'Security Group',
                resourceId: `${sg.GroupId} (${sg.GroupName})`,
                severity: 'CRITICAL',
                issue: `Port ${fromPort} is open to the world (0.0.0.0/0)`,
                recommendation: 'Restrict CIDR to specific IP addresses or ranges',
              });
            }

            // Check for all ports open
            if (fromPort === 0 && toPort === 65535) {
              issues.push({
                resourceType: 'Security Group',
                resourceId: `${sg.GroupId} (${sg.GroupName})`,
                severity: 'CRITICAL',
                issue: 'All ports are open to the world (0.0.0.0/0)',
                recommendation: 'Restrict to only necessary ports and IPs',
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

/**
 * Fetch real historical trends from Cost Explorer
 */
async function fetchHistoricalTrends(client: CostExplorerClient): Promise<Array<{ name: string; cost: number }>> {
  const end = new Date();
  end.setDate(1); // Start of current month
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1); // 6 months ago

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
  const [s3, sg, rds, iam, cost, allResources, trends] = await Promise.all([
    scanS3Buckets(clients.s3),
    scanSecurityGroups(clients.ec2),
    scanRDSInstances(clients.rds),
    scanIAMKeys(clients.iam),
    findCostOpportunities(clients.ec2, clients.rds, clients.s3, clients.costExplorer),
    discoverAllResources(credentials),
    fetchHistoricalTrends(clients.costExplorer)
  ]);

  // Calculate detailed cost breakdown
  let costBreakdown;
  try {
    costBreakdown = await costService.analyzeLiveResources(allResources, scannedRegion);
  } catch (error: any) {
    console.warn(`[CloudScanner] Cost analysis failed: ${error.message}`);
    // Provide a fallback empty breakdown
    costBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: [],
    };
  }

  console.log(`[CloudScanner] Scan complete for ${scannedRegion}:`);
  console.log(`  - S3 Buckets: ${s3.scannedCount} (global)`);
  console.log(`  - Security Groups: ${sg.scannedCount}`);
  console.log(`  - RDS Instances: ${rds.scannedCount}`);
  console.log(`  - IAM Users: ${iam.scannedCount} (global)`);
  console.log(`  - EC2 for Cost: ${cost.scannedCount}`);

  // Aggregate results
  const allIssues = [
    ...s3.items,
    ...sg.items,
    ...rds.items,
    ...iam.items,
  ];

  const totalScanned = s3.scannedCount + sg.scannedCount + rds.scannedCount + iam.scannedCount + cost.scannedCount;
  
  // Collect errors with better messaging
  const errors = [s3.error, sg.error, rds.error, iam.error, cost.error].filter(Boolean) as string[];
  
  if (errors.length > 0) {
    console.warn(`[CloudScanner] Errors encountered:`, errors);
  }

  return {
    scannedRegion,
    securityIssues: allIssues,
    costOpportunities: cost.items,
    costBreakdown: {
      totalMonthly: costBreakdown.totalMonthly,
      byService: costBreakdown.byService,
    },
    costTrend: trends.length > 0 ? trends : undefined,
    errors,
    summary: {
      totalResources: allResources.length,
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
