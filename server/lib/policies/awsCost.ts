/**
 * Built-in Cost Optimization Policies for AWS
 * These policies detect cost optimization opportunities in Terraform AWS resources.
 *
 * COST001 - NAT Gateway to NAT Instance opportunity
 * COST002 - Oversized instance detection
 * COST003 - Multi-AZ on non-production RDS
 * COST004 - Elastic IP without association
 * COST005 - GP2 to GP3 migration
 * COST006 - Old-generation instance detection
 * COST007 - S3 lifecycle policy missing
 * COST008 - CloudWatch log retention not set
 * COST009 - DynamoDB capacity mode review
 * COST010 - EBS volume too large
 */

import { PolicyDefinition, PolicyResult, PolicyContext } from './types';
import { findResourcesByType, getProperty } from '../terraformParser.js';

// ============================================================================
// COST001: NAT Gateway to NAT Instance Opportunity
// ============================================================================
export const COST001_NAT_GATEWAY: PolicyDefinition = {
  code: 'COST001',
  name: 'Consider NAT Instance for Cost Savings',
  description: 'NAT Gateways cost ~$32/month + data charges. For dev/test environments, a NAT Instance can save 60-80%',
  provider: 'aws',
  category: 'COST',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const natGateways = findResourcesByType(context.parsed, 'aws_nat_gateway');

    for (const nat of natGateways) {
      results.push({
        resourceRef: nat.fullName,
        resourceType: nat.type,
        line: nat.startLine,
        message: `NAT Gateway "${nat.name}" costs ~$32/month plus data processing fees`,
        suggestion: `For non-production workloads, consider using a NAT Instance (t3.nano ~$3/month) instead. This can save $25-30/month per NAT.`,
        autoFixable: false,
        metadata: {
          estimatedMonthlyCost: 32,
          potentialSavings: 29,
          alternativeResource: 'aws_instance with source_dest_check = false',
        },
      });
    }

    return results;
  },
};

// ============================================================================
// COST002: Oversized Instance Detection
// ============================================================================
export const COST002_OVERSIZED_INSTANCE: PolicyDefinition = {
  code: 'COST002',
  name: 'Potentially Oversized Instance',
  description: 'Detects large instance types that might be oversized for typical workloads',
  provider: 'aws',
  category: 'COST',
  severity: 'LOW',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const ec2Instances = findResourcesByType(context.parsed, 'aws_instance');

    // Instance types that are often oversized for initial deployments
    const largeInstancePatterns = [
      { pattern: /\.(x?large|2xlarge|4xlarge|8xlarge|12xlarge|16xlarge|24xlarge)/, size: 'large' },
      { pattern: /^(m5|m6i|c5|c6i|r5|r6i)\.(2xlarge|4xlarge|8xlarge)/, size: 'very large' },
    ];

    for (const ec2 of ec2Instances) {
      const instanceType = getProperty(ec2, 'instance_type');

      if (typeof instanceType === 'string') {
        for (const { pattern, size } of largeInstancePatterns) {
          if (pattern.test(instanceType)) {
            results.push({
              resourceRef: ec2.fullName,
              resourceType: ec2.type,
              line: ec2.startLine,
              message: `Instance "${ec2.name}" uses a ${size} instance type (${instanceType})`,
              suggestion: `Consider starting with a smaller instance and scaling up based on actual usage. Use AWS Compute Optimizer for right-sizing recommendations.`,
              autoFixable: false,
              metadata: {
                currentInstanceType: instanceType,
              },
            });
            break;
          }
        }
      }
    }

    return results;
  },
};

// ============================================================================
// COST003: Multi-AZ on Non-Production Resources
// ============================================================================
export const COST003_MULTI_AZ_NONPROD: PolicyDefinition = {
  code: 'COST003',
  name: 'Multi-AZ Enabled (Verify if Needed)',
  description: 'Multi-AZ deployments double RDS costs. Ensure this is intended for production workloads.',
  provider: 'aws',
  category: 'COST',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const rdsInstances = findResourcesByType(context.parsed, 'aws_db_instance');

    for (const rds of rdsInstances) {
      const multiAz = getProperty(rds, 'multi_az');

      if (multiAz === true || rds.rawBlock.includes('multi_az = true')) {
        // Check if instance name suggests non-production
        const name = rds.name.toLowerCase();
        const isLikelyNonProd = ['dev', 'test', 'staging', 'qa', 'demo', 'sandbox'].some(
          env => name.includes(env)
        );

        if (isLikelyNonProd) {
          results.push({
            resourceRef: rds.fullName,
            resourceType: rds.type,
            line: rds.startLine,
            message: `RDS instance "${rds.name}" has Multi-AZ enabled but appears to be non-production`,
            suggestion: `Multi-AZ doubles your RDS cost. For dev/test environments, consider disabling Multi-AZ to save 50% on database costs.`,
            autoFixable: true,
            metadata: {
              environmentIndicator: name,
            },
          });
        } else {
          results.push({
            resourceRef: rds.fullName,
            resourceType: rds.type,
            line: rds.startLine,
            message: `RDS instance "${rds.name}" has Multi-AZ enabled (2x cost)`,
            suggestion: `Multi-AZ is recommended for production but doubles cost. Verify this is a production database.`,
            autoFixable: false,
          });
        }
      }
    }

    return results;
  },
};

// ============================================================================
// COST004: Elastic IP Without Association
// ============================================================================
export const COST004_UNATTACHED_EIP: PolicyDefinition = {
  code: 'COST004',
  name: 'Elastic IP Association Check',
  description: 'Unassociated Elastic IPs cost $3.65/month. Ensure all EIPs are attached to resources.',
  provider: 'aws',
  category: 'COST',
  severity: 'LOW',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const eips = findResourcesByType(context.parsed, 'aws_eip');
    const eipAssociations = findResourcesByType(context.parsed, 'aws_eip_association');

    for (const eip of eips) {
      // Check if EIP has inline association or separate association resource
      const hasInlineAssociation = hasProperty(eip, 'instance') || hasProperty(eip, 'network_interface');
      const hasSeparateAssociation = eipAssociations.some(
        assoc => assoc.rawBlock.includes(eip.name)
      );

      if (!hasInlineAssociation && !hasSeparateAssociation) {
        results.push({
          resourceRef: eip.fullName,
          resourceType: eip.type,
          line: eip.startLine,
          message: `Elastic IP "${eip.name}" may not be associated with any resource`,
          suggestion: `Unassociated EIPs cost $3.65/month. Ensure this EIP is attached to an instance or NAT Gateway.`,
          autoFixable: false,
          metadata: {
            monthlyCost: 3.65,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// COST005: GP2 to GP3 Migration
// ============================================================================
export const COST005_GP2_TO_GP3: PolicyDefinition = {
  code: 'COST005',
  name: 'EBS GP2 to GP3 Migration',
  description:
    'GP3 volumes are 20% cheaper than GP2 and provide a higher baseline performance (3,000 IOPS / 125 MiB/s) at no extra cost.',
  provider: 'aws',
  category: 'COST',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const ebsVolumes = findResourcesByType(context.parsed, 'aws_ebs_volume');

    for (const vol of ebsVolumes) {
      const volumeType = getProperty(vol, 'volume_type');

      if (typeof volumeType === 'string' && volumeType.toLowerCase() === 'gp2') {
        const size = getProperty(vol, 'size') || 20;
        const currentMonthlyCost = size * 0.10;   // gp2 $0.10/GB-month
        const gp3MonthlyCost = size * 0.08;       // gp3 $0.08/GB-month
        const savings = currentMonthlyCost - gp3MonthlyCost;

        results.push({
          resourceRef: vol.fullName,
          resourceType: vol.type,
          line: vol.startLine,
          message: `EBS volume "${vol.name}" uses gp2. Migrating to gp3 saves ~$${savings.toFixed(2)}/month for ${size} GB`,
          suggestion:
            'Change volume_type from "gp2" to "gp3". GP3 is 20% cheaper and offers 3,000 baseline IOPS (vs. 100 IOPS per GB for gp2). For most workloads this is a drop-in replacement.',
          autoFixable: true,
          metadata: {
            currentVolumeType: 'gp2',
            recommendedVolumeType: 'gp3',
            sizeGB: size,
            currentMonthlyCost: Math.round(currentMonthlyCost * 100) / 100,
            projectedMonthlyCost: Math.round(gp3MonthlyCost * 100) / 100,
            potentialSavings: Math.round(savings * 100) / 100,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// COST006: Old-Generation Instance Detection
// ============================================================================
export const COST006_OLD_GEN_INSTANCE: PolicyDefinition = {
  code: 'COST006',
  name: 'Old-Generation Instance Type',
  description:
    'Previous-generation instance families (m4, c4, r4, t2) are typically more expensive and less performant than current-generation equivalents.',
  provider: 'aws',
  category: 'COST',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const ec2Instances = findResourcesByType(context.parsed, 'aws_instance');

    const OLD_GEN_MAP: Record<string, string> = {
      m4: 'm6i',
      m3: 'm6i',
      c4: 'c6i',
      c3: 'c6i',
      r4: 'r6i',
      r3: 'r6i',
      t2: 't3',
      t1: 't3',
      i2: 'i3',
      d2: 'd3',
    };

    for (const ec2 of ec2Instances) {
      const instanceType = getProperty(ec2, 'instance_type');

      if (typeof instanceType === 'string') {
        const family = instanceType.split('.')[0];

        if (OLD_GEN_MAP[family]) {
          const recommended = OLD_GEN_MAP[family];
          const size = instanceType.split('.')[1] || 'large';
          const suggestedType = `${recommended}.${size}`;

          results.push({
            resourceRef: ec2.fullName,
            resourceType: ec2.type,
            line: ec2.startLine,
            message: `Instance "${ec2.name}" uses old-generation type ${instanceType}`,
            suggestion:
              `Upgrade to ${suggestedType} (or a Graviton equivalent like ${recommended.replace('i', 'g')}.${size}) for better price-performance. ` +
              `Current-gen instances offer up to 40% better price-performance over previous generations.`,
            autoFixable: true,
            metadata: {
              currentFamily: family,
              currentInstanceType: instanceType,
              recommendedFamily: recommended,
              recommendedInstanceType: suggestedType,
            },
          });
        }
      }
    }

    return results;
  },
};

// ============================================================================
// COST007: S3 Lifecycle Policy Missing
// ============================================================================
export const COST007_S3_LIFECYCLE_MISSING: PolicyDefinition = {
  code: 'COST007',
  name: 'S3 Bucket Missing Lifecycle Policy',
  description:
    'S3 buckets without a lifecycle policy never automatically transition objects to cheaper storage classes or expire old data.',
  provider: 'aws',
  category: 'COST',
  severity: 'LOW',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const s3Buckets = findResourcesByType(context.parsed, 'aws_s3_bucket');
    const lifecycleConfigs = findResourcesByType(context.parsed, 'aws_s3_bucket_lifecycle_configuration');

    for (const bucket of s3Buckets) {
      // Check for the separate lifecycle configuration resource that references this bucket
      const hasLifecycleConfig = lifecycleConfigs.some(
        lc => lc.rawBlock.includes(bucket.name)
      );

      // Also check for inline lifecycle_rule (older Terraform AWS provider style)
      const hasInlineLifecycle = bucket.rawBlock.includes('lifecycle_rule');

      if (!hasLifecycleConfig && !hasInlineLifecycle) {
        results.push({
          resourceRef: bucket.fullName,
          resourceType: bucket.type,
          line: bucket.startLine,
          message: `S3 bucket "${bucket.name}" has no lifecycle policy configured`,
          suggestion:
            'Add an aws_s3_bucket_lifecycle_configuration resource to automatically transition objects to Infrequent Access (IA) or Glacier after a set period, ' +
            'and expire old/unneeded objects. This can reduce S3 costs by 40-80% for aging data.',
          autoFixable: false,
          metadata: {
            bucketName: bucket.name,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// COST008: CloudWatch Log Retention Not Set
// ============================================================================
export const COST008_CW_LOG_RETENTION: PolicyDefinition = {
  code: 'COST008',
  name: 'CloudWatch Log Group Retention Not Set',
  description:
    'CloudWatch log groups without retention_in_days default to never-expire, causing unbounded storage costs over time.',
  provider: 'aws',
  category: 'COST',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const logGroups = findResourcesByType(context.parsed, 'aws_cloudwatch_log_group');

    for (const lg of logGroups) {
      const retention = getProperty(lg, 'retention_in_days');

      if (retention === undefined || retention === null) {
        results.push({
          resourceRef: lg.fullName,
          resourceType: lg.type,
          line: lg.startLine,
          message: `CloudWatch log group "${lg.name}" has no retention period set (logs kept forever)`,
          suggestion:
            'Set retention_in_days to an appropriate value (e.g., 30, 60, 90, or 365). ' +
            'Without retention, log storage grows indefinitely at $0.03/GB-month. ' +
            'For most operational use cases, 30-90 days is sufficient.',
          autoFixable: true,
          metadata: {
            currentRetention: 'never-expire',
            recommendedRetention: 90,
            storageRatePerGBMonth: 0.03,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// COST009: DynamoDB Capacity Mode Review
// ============================================================================
export const COST009_DYNAMODB_CAPACITY_MODE: PolicyDefinition = {
  code: 'COST009',
  name: 'DynamoDB Provisioned Capacity Mode',
  description:
    'DynamoDB tables using PROVISIONED mode incur charges for provisioned read/write capacity units even when idle. PAY_PER_REQUEST is often cheaper for variable workloads.',
  provider: 'aws',
  category: 'COST',
  severity: 'LOW',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const tables = findResourcesByType(context.parsed, 'aws_dynamodb_table');

    for (const table of tables) {
      const billingMode = getProperty(table, 'billing_mode');

      // If billing_mode is not set, Terraform defaults to PROVISIONED
      if (billingMode === undefined || billingMode === null || billingMode === 'PROVISIONED') {
        const readCapacity = getProperty(table, 'read_capacity') || 5;
        const writeCapacity = getProperty(table, 'write_capacity') || 5;

        results.push({
          resourceRef: table.fullName,
          resourceType: table.type,
          line: table.startLine,
          message: `DynamoDB table "${table.name}" uses PROVISIONED mode (${readCapacity} RCU, ${writeCapacity} WCU)`,
          suggestion:
            'For variable or unpredictable workloads, consider switching to billing_mode = "PAY_PER_REQUEST" (on-demand). ' +
            'Provisioned mode is cost-effective only when traffic is steady and predictable. ' +
            'On-demand mode eliminates the risk of paying for unused capacity.',
          autoFixable: true,
          metadata: {
            currentBillingMode: 'PROVISIONED',
            recommendedBillingMode: 'PAY_PER_REQUEST',
            currentReadCapacity: readCapacity,
            currentWriteCapacity: writeCapacity,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// COST010: EBS Volume Too Large
// ============================================================================
export const COST010_EBS_VOLUME_TOO_LARGE: PolicyDefinition = {
  code: 'COST010',
  name: 'Large EBS Volume Detected',
  description:
    'EBS volumes larger than 500 GB may indicate over-provisioned storage. Review whether the full capacity is needed.',
  provider: 'aws',
  category: 'COST',
  severity: 'INFO',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const ebsVolumes = findResourcesByType(context.parsed, 'aws_ebs_volume');

    const THRESHOLD_GB = 500;

    for (const vol of ebsVolumes) {
      const size = getProperty(vol, 'size');

      if (typeof size === 'number' && size > THRESHOLD_GB) {
        const volumeType = getProperty(vol, 'volume_type') || 'gp3';
        // Approximate monthly cost based on type
        const pricePerGB =
          volumeType === 'gp2' ? 0.10 :
          volumeType === 'io1' || volumeType === 'io2' ? 0.125 :
          volumeType === 'st1' ? 0.045 :
          volumeType === 'sc1' ? 0.015 :
          0.08; // gp3 default
        const monthlyCost = size * pricePerGB;

        results.push({
          resourceRef: vol.fullName,
          resourceType: vol.type,
          line: vol.startLine,
          message: `EBS volume "${vol.name}" is ${size} GB (${volumeType}), costing ~$${monthlyCost.toFixed(2)}/month`,
          suggestion:
            `Volumes over ${THRESHOLD_GB} GB should be reviewed for necessity. Consider: ` +
            '(1) moving infrequently accessed data to S3, ' +
            '(2) using a cheaper volume type like st1/sc1 for throughput-oriented workloads, or ' +
            '(3) right-sizing the volume if actual usage is lower.',
          autoFixable: false,
          metadata: {
            sizeGB: size,
            volumeType,
            estimatedMonthlyCost: Math.round(monthlyCost * 100) / 100,
            thresholdGB: THRESHOLD_GB,
          },
        });
      }
    }

    return results;
  },
};

// ============================================================================
// Helper (local to this module)
// ============================================================================
function hasProperty(resource: any, property: string): boolean {
  return resource.rawBlock.includes(property);
}

// ============================================================================
// Export all cost policies
// ============================================================================
export const AWS_COST_POLICIES: PolicyDefinition[] = [
  COST001_NAT_GATEWAY,
  COST002_OVERSIZED_INSTANCE,
  COST003_MULTI_AZ_NONPROD,
  COST004_UNATTACHED_EIP,
  COST005_GP2_TO_GP3,
  COST006_OLD_GEN_INSTANCE,
  COST007_S3_LIFECYCLE_MISSING,
  COST008_CW_LOG_RETENTION,
  COST009_DYNAMODB_CAPACITY_MODE,
  COST010_EBS_VOLUME_TOO_LARGE,
];
