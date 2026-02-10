
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
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  ListDistributionsCommand,
  CloudFrontClient
} from '@aws-sdk/client-cloudfront';
import {
  ListHostedZonesCommand,
  Route53Client
} from '@aws-sdk/client-route-53';
import {
  ListTopicsCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import {
  ListQueuesCommand,
  GetQueueAttributesCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import {
  DescribeCacheClustersCommand,
  ElastiCacheClient
} from '@aws-sdk/client-elasticache';
import {
  GetRestApisCommand,
  APIGatewayClient
} from '@aws-sdk/client-api-gateway';
import {
  DescribeLogGroupsCommand,
  CloudWatchLogsClient
} from '@aws-sdk/client-cloudwatch-logs';
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
    let nextToken: string | undefined;
    do {
      const response = await ec2.send(new DescribeVpcsCommand({ NextToken: nextToken }));
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
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('EC2 (VPCs)', region, e);
  }
  return results;
}

/**
 * Discover Subnets
 */
async function discoverSubnets(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await ec2.send(new DescribeSubnetsCommand({ NextToken: nextToken }));
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
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('EC2 (Subnets)', region, e);
  }
  return results;
}

/**
 * Discover EC2 Instances (paginated via NextToken)
 */
async function discoverEC2(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await ec2.send(new DescribeInstancesCommand({ NextToken: nextToken }));
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
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('EC2 (Instances)', region, e);
  }
  return results;
}

/**
 * Discover Security Groups
 */
async function discoverSecurityGroups(ec2: EC2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await ec2.send(new DescribeSecurityGroupsCommand({ NextToken: nextToken }));
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
      nextToken = response.NextToken;
    } while (nextToken);
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
    let marker: string | undefined;
    do {
      const response = await rds.send(new DescribeDBInstancesCommand({ Marker: marker }));
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
      marker = response.Marker;
    } while (marker);
  } catch (e) {
    logAWSError('RDS', region, e);
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
 * Discover IAM Users (paginated via Marker)
 */
async function discoverIAM(iam: IAMClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    let isTruncated = true;

    while (isTruncated) {
      const response = await iam.send(new ListUsersCommand({ Marker: marker }));
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
      isTruncated = response.IsTruncated ?? false;
      marker = response.Marker;
    }
  } catch (e) {
    logAWSError('IAM', 'global', e);
  }
  return results;
}

/**
 * Discover Lambda Functions (paginated via Marker)
 */
async function discoverLambda(lambda: LambdaClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    do {
      const response = await lambda.send(new ListFunctionsCommand({ Marker: marker }));
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
      marker = response.NextMarker;
    } while (marker);
  } catch (e) {
    logAWSError('Lambda', region, e);
  }
  return results;
}

/**
 * Discover DynamoDB Tables (paginated via ExclusiveStartTableName)
 */
async function discoverDynamoDB(dynamodb: DynamoDBClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let exclusiveStartTableName: string | undefined;
    do {
      const list = await dynamodb.send(new ListTablesCommand({
        ExclusiveStartTableName: exclusiveStartTableName
      }));
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
      exclusiveStartTableName = list.LastEvaluatedTableName;
    } while (exclusiveStartTableName);
  } catch (e) {
    logAWSError('DynamoDB', region, e);
  }
  return results;
}


/**
 * Discover Amplify Apps (paginated via nextToken)
 */
async function discoverAmplify(amplify: AmplifyClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const appsResponse = await amplify.send(new ListAppsCommand({ nextToken }));
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
      nextToken = appsResponse.nextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('Amplify', region, e);
  }
  return results;
}


/**
 * Discover ELB/ALB/NLB Load Balancers (paginated via Marker)
 */
async function discoverELBv2(elbv2: ElasticLoadBalancingV2Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    do {
      const response = await elbv2.send(new DescribeLoadBalancersCommand({ Marker: marker }));
      for (const lb of response.LoadBalancers || []) {
        results.push({
          resourceType: 'load_balancer',
          resourceId: lb.LoadBalancerArn!,
          name: lb.LoadBalancerName,
          region,
          metadata: {
            type: lb.Type,
            scheme: lb.Scheme,
            state: lb.State?.Code,
            dnsName: lb.DNSName,
            vpcId: lb.VpcId,
            availabilityZones: (lb.AvailabilityZones || []).map(az => az.ZoneName),
            createdTime: lb.CreatedTime,
            ipAddressType: lb.IpAddressType
          }
        });
      }
      marker = response.NextMarker;
    } while (marker);
  } catch (e) {
    logAWSError('ELBv2', region, e);
  }
  return results;
}

/**
 * Discover ECS Clusters and Services (paginated via nextToken)
 */
async function discoverECS(ecs: ECSClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    // Step 1: List all cluster ARNs with pagination
    const allClusterArns: string[] = [];
    let nextToken: string | undefined;
    do {
      const listResponse = await ecs.send(new ListClustersCommand({ nextToken }));
      allClusterArns.push(...(listResponse.clusterArns || []));
      nextToken = listResponse.nextToken;
    } while (nextToken);

    if (allClusterArns.length === 0) return results;

    // Step 2: Describe clusters in batches of 100 (API limit)
    for (let i = 0; i < allClusterArns.length; i += 100) {
      const batch = allClusterArns.slice(i, i + 100);
      const describeResponse = await ecs.send(new DescribeClustersCommand({
        clusters: batch,
        include: ['STATISTICS']
      }));

      for (const cluster of describeResponse.clusters || []) {
        results.push({
          resourceType: 'ecs_cluster',
          resourceId: cluster.clusterArn!,
          name: cluster.clusterName,
          region,
          metadata: {
            status: cluster.status,
            registeredContainerInstancesCount: cluster.registeredContainerInstancesCount,
            runningTasksCount: cluster.runningTasksCount,
            pendingTasksCount: cluster.pendingTasksCount,
            activeServicesCount: cluster.activeServicesCount,
            capacityProviders: cluster.capacityProviders
          }
        });

        // Step 3: List services in each cluster with pagination
        let serviceNextToken: string | undefined;
        do {
          try {
            const servicesResponse = await ecs.send(new ListServicesCommand({
              cluster: cluster.clusterArn,
              nextToken: serviceNextToken
            }));
            for (const serviceArn of servicesResponse.serviceArns || []) {
              const serviceName = serviceArn.split('/').pop() || serviceArn;
              results.push({
                resourceType: 'ecs_service',
                resourceId: serviceArn,
                name: serviceName,
                region,
                metadata: {
                  clusterArn: cluster.clusterArn,
                  clusterName: cluster.clusterName
                }
              });
            }
            serviceNextToken = servicesResponse.nextToken;
          } catch (e) {
            logAWSError(`ECS (ListServices for ${cluster.clusterName})`, region, e);
            break;
          }
        } while (serviceNextToken);
      }
    }
  } catch (e) {
    logAWSError('ECS', region, e);
  }
  return results;
}

/**
 * Discover CloudFront Distributions (paginated via Marker)
 */
async function discoverCloudFront(cloudfront: CloudFrontClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    do {
      const response = await cloudfront.send(new ListDistributionsCommand({
        Marker: marker,
        MaxItems: 100
      }));
      const distributionList = response.DistributionList;
      for (const dist of distributionList?.Items || []) {
        results.push({
          resourceType: 'cloudfront_distribution',
          resourceId: dist.ARN!,
          name: dist.DomainName,
          region: 'global',
          metadata: {
            id: dist.Id,
            domainName: dist.DomainName,
            status: dist.Status,
            enabled: dist.Enabled,
            priceClass: dist.PriceClass,
            httpVersion: dist.HttpVersion,
            aliases: dist.Aliases?.Items || [],
            origins: (dist.Origins?.Items || []).map(o => ({
              domainName: o.DomainName,
              id: o.Id
            })),
            comment: dist.Comment
          }
        });
      }
      marker = distributionList?.IsTruncated ? distributionList.NextMarker : undefined;
    } while (marker);
  } catch (e) {
    logAWSError('CloudFront', 'global', e);
  }
  return results;
}

/**
 * Discover Route 53 Hosted Zones (paginated via Marker)
 */
async function discoverRoute53(route53: Route53Client, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    let isTruncated = true;

    while (isTruncated) {
      const response = await route53.send(new ListHostedZonesCommand({
        Marker: marker,
        MaxItems: 100
      }));
      for (const zone of response.HostedZones || []) {
        results.push({
          resourceType: 'route53_hosted_zone',
          resourceId: zone.Id!,
          name: zone.Name,
          region: 'global',
          metadata: {
            id: zone.Id,
            name: zone.Name,
            callerReference: zone.CallerReference,
            resourceRecordSetCount: zone.ResourceRecordSetCount,
            isPrivateZone: zone.Config?.PrivateZone,
            comment: zone.Config?.Comment
          }
        });
      }
      isTruncated = response.IsTruncated ?? false;
      marker = response.NextMarker;
    }
  } catch (e) {
    logAWSError('Route53', 'global', e);
  }
  return results;
}

/**
 * Discover SNS Topics (paginated via NextToken)
 */
async function discoverSNS(sns: SNSClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await sns.send(new ListTopicsCommand({ NextToken: nextToken }));
      for (const topic of response.Topics || []) {
        if (!topic.TopicArn) continue;
        // Extract topic name from ARN (last segment after ':')
        const topicName = topic.TopicArn.split(':').pop() || topic.TopicArn;
        results.push({
          resourceType: 'sns_topic',
          resourceId: topic.TopicArn,
          name: topicName,
          region,
          metadata: {
            topicArn: topic.TopicArn
          }
        });
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('SNS', region, e);
  }
  return results;
}

/**
 * Discover SQS Queues (paginated via NextToken) with queue attributes
 */
async function discoverSQS(sqs: SQSClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await sqs.send(new ListQueuesCommand({ NextToken: nextToken }));
      for (const queueUrl of response.QueueUrls || []) {
        // Extract queue name from URL (last segment after '/')
        const queueName = queueUrl.split('/').pop() || queueUrl;

        // Fetch queue attributes for richer metadata
        let attributes: Record<string, string> = {};
        try {
          const attrResponse = await sqs.send(new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All']
          }));
          attributes = attrResponse.Attributes || {};
        } catch (e) {
          // Proceed without attributes if access denied
        }

        results.push({
          resourceType: 'sqs_queue',
          resourceId: attributes['QueueArn'] || queueUrl,
          name: queueName,
          region,
          metadata: {
            queueUrl,
            approximateNumberOfMessages: attributes['ApproximateNumberOfMessages'],
            approximateNumberOfMessagesNotVisible: attributes['ApproximateNumberOfMessagesNotVisible'],
            approximateNumberOfMessagesDelayed: attributes['ApproximateNumberOfMessagesDelayed'],
            visibilityTimeout: attributes['VisibilityTimeout'],
            createdTimestamp: attributes['CreatedTimestamp'],
            lastModifiedTimestamp: attributes['LastModifiedTimestamp'],
            fifoQueue: attributes['FifoQueue'] === 'true',
            delaySeconds: attributes['DelaySeconds']
          }
        });
      }
      nextToken = response.NextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('SQS', region, e);
  }
  return results;
}

/**
 * Discover ElastiCache Clusters (paginated via Marker)
 */
async function discoverElastiCache(elasticache: ElastiCacheClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let marker: string | undefined;
    do {
      const response = await elasticache.send(new DescribeCacheClustersCommand({
        Marker: marker,
        ShowCacheNodeInfo: true
      }));
      for (const cluster of response.CacheClusters || []) {
        results.push({
          resourceType: 'elasticache_cluster',
          resourceId: cluster.ARN || cluster.CacheClusterId!,
          name: cluster.CacheClusterId,
          region,
          metadata: {
            engine: cluster.Engine,
            engineVersion: cluster.EngineVersion,
            cacheNodeType: cluster.CacheNodeType,
            numCacheNodes: cluster.NumCacheNodes,
            cacheClusterStatus: cluster.CacheClusterStatus,
            preferredAvailabilityZone: cluster.PreferredAvailabilityZone,
            cacheSubnetGroupName: cluster.CacheSubnetGroupName,
            replicationGroupId: cluster.ReplicationGroupId,
            snapshotRetentionLimit: cluster.SnapshotRetentionLimit,
            transitEncryptionEnabled: cluster.TransitEncryptionEnabled,
            atRestEncryptionEnabled: cluster.AtRestEncryptionEnabled
          }
        });
      }
      marker = response.Marker;
    } while (marker);
  } catch (e) {
    logAWSError('ElastiCache', region, e);
  }
  return results;
}

/**
 * Discover API Gateway REST APIs (paginated via position)
 */
async function discoverAPIGateway(apigateway: APIGatewayClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let position: string | undefined;
    do {
      const response = await apigateway.send(new GetRestApisCommand({ position, limit: 500 }));
      for (const api of response.items || []) {
        results.push({
          resourceType: 'apigateway_rest_api',
          resourceId: api.id!,
          name: api.name,
          region,
          metadata: {
            id: api.id,
            description: api.description,
            createdDate: api.createdDate,
            apiKeySource: api.apiKeySource,
            endpointConfiguration: api.endpointConfiguration?.types,
            version: api.version
          }
        });
      }
      position = response.position;
    } while (position);
  } catch (e) {
    logAWSError('API Gateway', region, e);
  }
  return results;
}

/**
 * Discover CloudWatch Log Groups (paginated via nextToken)
 */
async function discoverCloudWatchLogs(cloudwatchlogs: CloudWatchLogsClient, region: string): Promise<DiscoveredResource[]> {
  const results: DiscoveredResource[] = [];
  try {
    let nextToken: string | undefined;
    do {
      const response = await cloudwatchlogs.send(new DescribeLogGroupsCommand({ nextToken }));
      for (const logGroup of response.logGroups || []) {
        results.push({
          resourceType: 'cloudwatch_log_group',
          resourceId: logGroup.arn || logGroup.logGroupName!,
          name: logGroup.logGroupName,
          region,
          metadata: {
            logGroupName: logGroup.logGroupName,
            storedBytes: logGroup.storedBytes,
            retentionInDays: logGroup.retentionInDays,
            creationTime: logGroup.creationTime,
            metricFilterCount: logGroup.metricFilterCount,
            kmsKeyId: logGroup.kmsKeyId
          }
        });
      }
      nextToken = response.nextToken;
    } while (nextToken);
  } catch (e) {
    logAWSError('CloudWatch Logs', region, e);
  }
  return results;
}


/**
 * Main discovery function
 */
export async function discoverAllResources(credentials: AWSCredentials): Promise<DiscoveredResource[]> {
  const clients = createClients(credentials);
  const region = credentials.region;

  const [
    vpcs, subnets, ec2s, sgs, rdss, s3s, iams, lambdas, dynamos, amplifys,
    elbv2s, ecss, cloudfronts, route53s, snss, sqss, elasticaches, apigateways, cwlogs
  ] = await Promise.all([
    discoverVPCs(clients.ec2, region),
    discoverSubnets(clients.ec2, region),
    discoverEC2(clients.ec2, region),
    discoverSecurityGroups(clients.ec2, region),
    discoverRDS(clients.rds, region),
    discoverS3(clients.s3, region),
    discoverIAM(clients.iam, region),
    discoverLambda(clients.lambda, region),
    discoverDynamoDB(clients.dynamodb, region),
    discoverAmplify(clients.amplify, region),
    discoverELBv2(clients.elbv2, region),
    discoverECS(clients.ecs, region),
    discoverCloudFront(clients.cloudfront, region),
    discoverRoute53(clients.route53, region),
    discoverSNS(clients.sns, region),
    discoverSQS(clients.sqs, region),
    discoverElastiCache(clients.elasticache, region),
    discoverAPIGateway(clients.apigateway, region),
    discoverCloudWatchLogs(clients.cloudwatchlogs, region)
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
    ...amplifys,
    ...elbv2s,
    ...ecss,
    ...cloudfronts,
    ...route53s,
    ...snss,
    ...sqss,
    ...elasticaches,
    ...apigateways,
    ...cwlogs
  ];
}
