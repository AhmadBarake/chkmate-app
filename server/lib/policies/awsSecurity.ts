/**
 * Built-in Security Policies for AWS
 * These policies detect common security misconfigurations in Terraform AWS resources
 * Aligned with CIS AWS Foundations Benchmark
 */

import { PolicyDefinition, PolicyResult, PolicyContext } from './types';
import { findResourcesByType, getProperty, hasProperty } from '../terraformParser.js';

// ============================================================================
// SEC001: S3 Bucket Public Access
// ============================================================================
export const SEC001_S3_PUBLIC_ACCESS: PolicyDefinition = {
  code: 'SEC001',
  name: 'S3 Bucket Public Access Blocked',
  description: 'Ensures S3 buckets have public access blocked to prevent unintended data exposure',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'CRITICAL',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const s3Buckets = findResourcesByType(context.parsed, 'aws_s3_bucket');

    for (const bucket of s3Buckets) {
      // Check for public_access_block configuration
      const publicAccessBlocks = findResourcesByType(
        context.parsed,
        'aws_s3_bucket_public_access_block'
      );

      const hasBlock = publicAccessBlocks.some(
        block => getProperty(block, 'bucket')?.includes(bucket.name)
      );

      if (!hasBlock) {
        results.push({
          resourceRef: bucket.fullName,
          resourceType: bucket.type,
          line: bucket.startLine,
          message: `S3 bucket "${bucket.name}" does not have a public access block configured`,
          suggestion: `Add an aws_s3_bucket_public_access_block resource for "${bucket.name}" with block_public_acls, block_public_policy, ignore_public_acls, and restrict_public_buckets all set to true`,
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC002: Security Group Open Ports
// ============================================================================
export const SEC002_SECURITY_GROUP_OPEN: PolicyDefinition = {
  code: 'SEC002',
  name: 'Security Group Not Open to World',
  description: 'Detects security groups with SSH (22), RDP (3389) or database ports open to 0.0.0.0/0',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'CRITICAL',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const dangerousPorts = [22, 3389, 3306, 5432, 27017, 6379];
    const securityGroups = findResourcesByType(context.parsed, 'aws_security_group');
    const sgRules = findResourcesByType(context.parsed, 'aws_security_group_rule');

    for (const sg of securityGroups) {
      // Check inline ingress rules in the raw block
      if (sg.rawBlock.includes('0.0.0.0/0') || sg.rawBlock.includes('::/0')) {
        // Check if any dangerous port is exposed
        for (const port of dangerousPorts) {
          if (sg.rawBlock.includes(`from_port`) && sg.rawBlock.includes(String(port))) {
            results.push({
              resourceRef: sg.fullName,
              resourceType: sg.type,
              line: sg.startLine,
              message: `Security group "${sg.name}" allows inbound traffic on port ${port} from 0.0.0.0/0`,
              suggestion: `Restrict the CIDR block to specific IP ranges instead of 0.0.0.0/0`,
              autoFixable: false,
            });
          }
        }
      }
    }

    // Check standalone security group rules
    for (const rule of sgRules) {
      if (rule.rawBlock.includes('0.0.0.0/0') && rule.rawBlock.includes('ingress')) {
        for (const port of dangerousPorts) {
          if (rule.rawBlock.includes(String(port))) {
            results.push({
              resourceRef: rule.fullName,
              resourceType: rule.type,
              line: rule.startLine,
              message: `Security group rule "${rule.name}" allows inbound traffic on port ${port} from 0.0.0.0/0`,
              suggestion: `Restrict the CIDR block to specific IP ranges`,
              autoFixable: false,
            });
          }
        }
      }
    }

    return results;
  },
};

// ============================================================================
// SEC003: RDS Public Accessibility
// ============================================================================
export const SEC003_RDS_PUBLIC: PolicyDefinition = {
  code: 'SEC003',
  name: 'RDS Instance Not Publicly Accessible',
  description: 'Ensures RDS instances are not publicly accessible from the internet',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const rdsInstances = findResourcesByType(context.parsed, 'aws_db_instance');

    for (const rds of rdsInstances) {
      const publiclyAccessible = getProperty(rds, 'publicly_accessible');

      if (publiclyAccessible === true || rds.rawBlock.includes('publicly_accessible = true')) {
        results.push({
          resourceRef: rds.fullName,
          resourceType: rds.type,
          line: rds.startLine,
          message: `RDS instance "${rds.name}" is publicly accessible`,
          suggestion: `Set publicly_accessible = false to restrict access to your VPC`,
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC004: EBS Encryption
// ============================================================================
export const SEC004_EBS_ENCRYPTION: PolicyDefinition = {
  code: 'SEC004',
  name: 'EBS Volumes Encrypted',
  description: 'Ensures EBS volumes have encryption enabled at rest',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const ebsVolumes = findResourcesByType(context.parsed, 'aws_ebs_volume');
    const ec2Instances = findResourcesByType(context.parsed, 'aws_instance');

    // Check standalone EBS volumes
    for (const ebs of ebsVolumes) {
      const encrypted = getProperty(ebs, 'encrypted');
      if (encrypted !== true && !ebs.rawBlock.includes('encrypted = true')) {
        results.push({
          resourceRef: ebs.fullName,
          resourceType: ebs.type,
          line: ebs.startLine,
          message: `EBS volume "${ebs.name}" is not encrypted`,
          suggestion: `Add encrypted = true to enable encryption at rest`,
          autoFixable: true,
        });
      }
    }

    // Check root_block_device in EC2 instances
    for (const ec2 of ec2Instances) {
      if (ec2.rawBlock.includes('root_block_device') && !ec2.rawBlock.includes('encrypted = true')) {
        results.push({
          resourceRef: ec2.fullName,
          resourceType: ec2.type,
          line: ec2.startLine,
          message: `EC2 instance "${ec2.name}" has an unencrypted root block device`,
          suggestion: `Add encrypted = true inside the root_block_device block`,
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC005: IAM Wildcard Policies
// ============================================================================
export const SEC005_IAM_WILDCARD: PolicyDefinition = {
  code: 'SEC005',
  name: 'IAM Policies No Wildcards',
  description: 'Detects IAM policies using overly permissive wildcard (*) actions or resources',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const iamPolicies = findResourcesByType(context.parsed, 'aws_iam_policy');
    const iamRolePolicies = findResourcesByType(context.parsed, 'aws_iam_role_policy');

    const checkPolicy = (resource: any) => {
      // Check for "Action": "*" or "Action": ["*"]
      if (resource.rawBlock.includes('"Action"') && resource.rawBlock.includes('"*"')) {
        // Check if it's truly Action: * (not part of Action: s3:*)
        if (resource.rawBlock.match(/"Action"\s*:\s*"\*"/) ||
            resource.rawBlock.match(/"Action"\s*:\s*\[\s*"\*"\s*\]/)) {
          results.push({
            resourceRef: resource.fullName,
            resourceType: resource.type,
            line: resource.startLine,
            message: `IAM policy "${resource.name}" uses wildcard (*) for Action`,
            suggestion: `Specify explicit actions instead of using * to follow least privilege principle`,
            autoFixable: false,
          });
        }
      }

      // Check for "Resource": "*"
      if (resource.rawBlock.includes('"Resource"') &&
          (resource.rawBlock.match(/"Resource"\s*:\s*"\*"/) ||
           resource.rawBlock.match(/"Resource"\s*:\s*\[\s*"\*"\s*\]/))) {
        results.push({
          resourceRef: resource.fullName,
          resourceType: resource.type,
          line: resource.startLine,
          message: `IAM policy "${resource.name}" uses wildcard (*) for Resource`,
          suggestion: `Specify explicit resource ARNs instead of using * to limit scope`,
          autoFixable: false,
        });
      }
    };

    iamPolicies.forEach(checkPolicy);
    iamRolePolicies.forEach(checkPolicy);

    return results;
  },
};

// ============================================================================
// SEC006: CloudTrail Enabled
// ============================================================================
export const SEC006_CLOUDTRAIL_ENABLED: PolicyDefinition = {
  code: 'SEC006',
  name: 'CloudTrail Enabled',
  description: 'Ensures an AWS CloudTrail trail is defined to log API activity across the account',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const trails = findResourcesByType(context.parsed, 'aws_cloudtrail');

    if (trails.length === 0) {
      results.push({
        resourceRef: 'template',
        resourceType: 'aws_cloudtrail',
        message: 'No aws_cloudtrail resource found in the template. CloudTrail should be enabled for API auditing',
        suggestion: 'Add an aws_cloudtrail resource with is_multi_region_trail = true and enable_logging = true',
        autoFixable: false,
      });
    }

    return results;
  },
};

// ============================================================================
// SEC007: CloudTrail Log File Validation
// ============================================================================
export const SEC007_CLOUDTRAIL_LOG_VALIDATION: PolicyDefinition = {
  code: 'SEC007',
  name: 'CloudTrail Log File Validation Enabled',
  description: 'Ensures CloudTrail log file validation is enabled to detect tampering',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const trails = findResourcesByType(context.parsed, 'aws_cloudtrail');

    for (const trail of trails) {
      const logValidation = getProperty(trail, 'enable_log_file_validation');

      if (logValidation !== true && !trail.rawBlock.includes('enable_log_file_validation = true')) {
        results.push({
          resourceRef: trail.fullName,
          resourceType: trail.type,
          line: trail.startLine,
          message: `CloudTrail "${trail.name}" does not have log file validation enabled`,
          suggestion: 'Add enable_log_file_validation = true to detect unauthorized log modifications',
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC008: VPC Flow Logs
// ============================================================================
export const SEC008_VPC_FLOW_LOGS: PolicyDefinition = {
  code: 'SEC008',
  name: 'VPC Flow Logs Enabled',
  description: 'Ensures each VPC has flow logs enabled for network traffic monitoring',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const vpcs = findResourcesByType(context.parsed, 'aws_vpc');
    const flowLogs = findResourcesByType(context.parsed, 'aws_flow_log');

    for (const vpc of vpcs) {
      const hasFlowLog = flowLogs.some(
        fl => getProperty(fl, 'vpc_id')?.includes(vpc.name) ||
              fl.rawBlock.includes(vpc.name)
      );

      if (!hasFlowLog) {
        results.push({
          resourceRef: vpc.fullName,
          resourceType: vpc.type,
          line: vpc.startLine,
          message: `VPC "${vpc.name}" does not have flow logs enabled`,
          suggestion: `Add an aws_flow_log resource referencing "${vpc.name}" to capture network traffic for analysis and troubleshooting`,
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC009: S3 Access Logging
// ============================================================================
export const SEC009_S3_ACCESS_LOGGING: PolicyDefinition = {
  code: 'SEC009',
  name: 'S3 Bucket Access Logging Enabled',
  description: 'Ensures S3 buckets have server access logging enabled for audit purposes',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const s3Buckets = findResourcesByType(context.parsed, 'aws_s3_bucket');
    const bucketLogging = findResourcesByType(context.parsed, 'aws_s3_bucket_logging');

    for (const bucket of s3Buckets) {
      const hasLogging = bucketLogging.some(
        log => getProperty(log, 'bucket')?.includes(bucket.name) ||
               log.rawBlock.includes(bucket.name)
      );

      if (!hasLogging) {
        results.push({
          resourceRef: bucket.fullName,
          resourceType: bucket.type,
          line: bucket.startLine,
          message: `S3 bucket "${bucket.name}" does not have access logging configured`,
          suggestion: `Add an aws_s3_bucket_logging resource for "${bucket.name}" with a target_bucket and target_prefix for audit trail`,
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC010: Default Security Group Restricts All Traffic
// ============================================================================
export const SEC010_DEFAULT_SG_RESTRICTIVE: PolicyDefinition = {
  code: 'SEC010',
  name: 'Default Security Group Restricts All Traffic',
  description: 'Ensures the default security group of every VPC restricts all inbound and outbound traffic',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const defaultSGs = findResourcesByType(context.parsed, 'aws_default_security_group');

    for (const sg of defaultSGs) {
      // The default SG should have NO ingress and NO egress rules defined.
      // If the rawBlock contains "ingress" or "egress" sub-blocks, it means
      // rules have been added, making the default SG non-restrictive.
      if (sg.rawBlock.includes('ingress') || sg.rawBlock.includes('egress')) {
        results.push({
          resourceRef: sg.fullName,
          resourceType: sg.type,
          line: sg.startLine,
          message: `Default security group "${sg.name}" has ingress or egress rules defined. The default security group should restrict all traffic`,
          suggestion: 'Remove all ingress and egress blocks from the aws_default_security_group to ensure no traffic is allowed through the default group. Use dedicated security groups for traffic rules instead',
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC011: VPC Subnets Auto-Assign Public IP
// ============================================================================
export const SEC011_SUBNET_PUBLIC_IP: PolicyDefinition = {
  code: 'SEC011',
  name: 'VPC Subnets Do Not Auto-Assign Public IP',
  description: 'Flags subnets that automatically assign public IP addresses to launched instances',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const subnets = findResourcesByType(context.parsed, 'aws_subnet');

    for (const subnet of subnets) {
      const autoAssign = getProperty(subnet, 'map_public_ip_on_launch');

      if (autoAssign === true || subnet.rawBlock.includes('map_public_ip_on_launch = true')) {
        results.push({
          resourceRef: subnet.fullName,
          resourceType: subnet.type,
          line: subnet.startLine,
          message: `Subnet "${subnet.name}" auto-assigns public IP addresses to instances on launch`,
          suggestion: 'Set map_public_ip_on_launch = false and use Elastic IPs or NAT Gateways for controlled internet access',
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC012: RDS Encryption at Rest
// ============================================================================
export const SEC012_RDS_ENCRYPTION: PolicyDefinition = {
  code: 'SEC012',
  name: 'RDS Encryption at Rest Enabled',
  description: 'Ensures RDS database instances have encryption at rest enabled',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const rdsInstances = findResourcesByType(context.parsed, 'aws_db_instance');

    for (const rds of rdsInstances) {
      const encrypted = getProperty(rds, 'storage_encrypted');

      if (encrypted !== true && !rds.rawBlock.includes('storage_encrypted = true')) {
        results.push({
          resourceRef: rds.fullName,
          resourceType: rds.type,
          line: rds.startLine,
          message: `RDS instance "${rds.name}" does not have encryption at rest enabled`,
          suggestion: 'Add storage_encrypted = true and optionally specify a kms_key_id for customer-managed encryption',
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC013: RDS Deletion Protection
// ============================================================================
export const SEC013_RDS_DELETION_PROTECTION: PolicyDefinition = {
  code: 'SEC013',
  name: 'RDS Deletion Protection Enabled',
  description: 'Ensures RDS database instances have deletion protection enabled to prevent accidental deletion',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const rdsInstances = findResourcesByType(context.parsed, 'aws_db_instance');

    for (const rds of rdsInstances) {
      const deletionProtection = getProperty(rds, 'deletion_protection');

      if (deletionProtection !== true && !rds.rawBlock.includes('deletion_protection = true')) {
        results.push({
          resourceRef: rds.fullName,
          resourceType: rds.type,
          line: rds.startLine,
          message: `RDS instance "${rds.name}" does not have deletion protection enabled`,
          suggestion: 'Add deletion_protection = true to prevent accidental database deletion',
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC014: DynamoDB Encryption
// ============================================================================
export const SEC014_DYNAMODB_ENCRYPTION: PolicyDefinition = {
  code: 'SEC014',
  name: 'DynamoDB Server-Side Encryption Enabled',
  description: 'Ensures DynamoDB tables have server-side encryption configured with a customer-managed KMS key',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const tables = findResourcesByType(context.parsed, 'aws_dynamodb_table');

    for (const table of tables) {
      const hasSseBlock = hasProperty(table, 'server_side_encryption') ||
                          table.rawBlock.includes('server_side_encryption');

      if (!hasSseBlock) {
        results.push({
          resourceRef: table.fullName,
          resourceType: table.type,
          line: table.startLine,
          message: `DynamoDB table "${table.name}" does not have a server_side_encryption block configured`,
          suggestion: 'Add a server_side_encryption block with enabled = true and specify a kms_key_arn for customer-managed encryption',
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC015: SNS Topic Encryption
// ============================================================================
export const SEC015_SNS_ENCRYPTION: PolicyDefinition = {
  code: 'SEC015',
  name: 'SNS Topic Encryption Enabled',
  description: 'Ensures SNS topics are encrypted at rest using a KMS key',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const topics = findResourcesByType(context.parsed, 'aws_sns_topic');

    for (const topic of topics) {
      const kmsKeyId = getProperty(topic, 'kms_master_key_id');

      if (!kmsKeyId && !topic.rawBlock.includes('kms_master_key_id')) {
        results.push({
          resourceRef: topic.fullName,
          resourceType: topic.type,
          line: topic.startLine,
          message: `SNS topic "${topic.name}" does not have encryption enabled`,
          suggestion: 'Add kms_master_key_id with a KMS key ARN or alias to enable server-side encryption',
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC016: SQS Queue Encryption
// ============================================================================
export const SEC016_SQS_ENCRYPTION: PolicyDefinition = {
  code: 'SEC016',
  name: 'SQS Queue Encryption Enabled',
  description: 'Ensures SQS queues are encrypted at rest using KMS or SQS-managed SSE',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const queues = findResourcesByType(context.parsed, 'aws_sqs_queue');

    for (const queue of queues) {
      const kmsKeyId = getProperty(queue, 'kms_master_key_id');
      const sqsManagedSse = getProperty(queue, 'sqs_managed_sse_enabled');

      const hasKmsInRaw = queue.rawBlock.includes('kms_master_key_id');
      const hasSseManagedInRaw = queue.rawBlock.includes('sqs_managed_sse_enabled = true');

      if (!kmsKeyId && sqsManagedSse !== true && !hasKmsInRaw && !hasSseManagedInRaw) {
        results.push({
          resourceRef: queue.fullName,
          resourceType: queue.type,
          line: queue.startLine,
          message: `SQS queue "${queue.name}" does not have encryption enabled`,
          suggestion: 'Add kms_master_key_id with a KMS key ARN for KMS-managed encryption, or set sqs_managed_sse_enabled = true for SQS-managed server-side encryption',
          autoFixable: false,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC017: No Inline IAM Policies
// ============================================================================
export const SEC017_NO_INLINE_IAM_POLICIES: PolicyDefinition = {
  code: 'SEC017',
  name: 'No Inline IAM User Policies',
  description: 'Flags inline IAM user policies which are harder to audit and manage than managed policies',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'MEDIUM',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const inlinePolicies = findResourcesByType(context.parsed, 'aws_iam_user_policy');

    for (const policy of inlinePolicies) {
      results.push({
        resourceRef: policy.fullName,
        resourceType: policy.type,
        line: policy.startLine,
        message: `Inline IAM user policy "${policy.name}" found. Inline policies are harder to manage, audit, and reuse`,
        suggestion: 'Replace aws_iam_user_policy with aws_iam_user_policy_attachment referencing a managed policy (aws_iam_policy) for better governance',
        autoFixable: false,
      });
    }

    return results;
  },
};

// ============================================================================
// SEC018: IMDSv2 Enforced on EC2 Instances
// ============================================================================
export const SEC018_IMDSV2_REQUIRED: PolicyDefinition = {
  code: 'SEC018',
  name: 'EC2 IMDSv2 Enforced',
  description: 'Ensures EC2 instances require IMDSv2 (Instance Metadata Service v2) to mitigate SSRF attacks',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'HIGH',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const instances = findResourcesByType(context.parsed, 'aws_instance');

    for (const instance of instances) {
      const hasMetadataOptions = instance.rawBlock.includes('metadata_options');
      const hasHttpTokensRequired = instance.rawBlock.includes('http_tokens') &&
                                    instance.rawBlock.includes('"required"');

      if (!hasMetadataOptions || !hasHttpTokensRequired) {
        results.push({
          resourceRef: instance.fullName,
          resourceType: instance.type,
          line: instance.startLine,
          message: `EC2 instance "${instance.name}" does not enforce IMDSv2. Without http_tokens = "required", the instance metadata service is vulnerable to SSRF attacks`,
          suggestion: 'Add a metadata_options block with http_tokens = "required" and http_endpoint = "enabled" to enforce IMDSv2',
          autoFixable: true,
        });
      }
    }

    return results;
  },
};

// ============================================================================
// SEC019: Hardcoded Secrets Detection
// ============================================================================
export const SEC019_HARDCODED_SECRETS: PolicyDefinition = {
  code: 'SEC019',
  name: 'No Hardcoded Secrets',
  description: 'Scans Terraform content for hardcoded passwords, secret keys, and API keys that should use variables or secrets managers',
  provider: 'aws',
  category: 'SECURITY',
  severity: 'CRITICAL',
  check: (context: PolicyContext): PolicyResult[] => {
    const results: PolicyResult[] = [];
    const rawContent = context.rawContent;
    const lines = rawContent.split('\n');

    // Patterns that match hardcoded secret values (literal strings, not variable references)
    // Each pattern: [regex to test a line, human-readable label]
    const secretPatterns: Array<[RegExp, string]> = [
      [/password\s*=\s*"[^"$]+"/, 'password'],
      [/secret_key\s*=\s*"[^"$]+"/, 'secret_key'],
      [/api_key\s*=\s*"[^"$]+"/, 'api_key'],
      [/access_key\s*=\s*"[^"$]+"/, 'access_key'],
      [/secret\s*=\s*"[^"$]+"/, 'secret'],
      [/master_password\s*=\s*"[^"$]+"/, 'master_password'],
      [/db_password\s*=\s*"[^"$]+"/, 'db_password'],
      [/private_key\s*=\s*"[^"$]+"/, 'private_key'],
      [/token\s*=\s*"[^"$]+"/, 'token'],
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments
      if (line.startsWith('#') || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      for (const [pattern, label] of secretPatterns) {
        if (pattern.test(line)) {
          // Exclude lines that reference variables (var., local., data.) or empty strings
          if (line.includes('var.') || line.includes('local.') || line.includes('data.') || line.includes('""')) {
            continue;
          }

          results.push({
            resourceRef: 'template',
            resourceType: 'hardcoded_secret',
            line: i + 1,
            message: `Potential hardcoded ${label} detected on line ${i + 1}. Secrets should never be stored in plain text in Terraform files`,
            suggestion: `Use a variable reference (var.${label}), AWS Secrets Manager (aws_secretsmanager_secret), or SSM Parameter Store (aws_ssm_parameter) instead of hardcoding sensitive values`,
            autoFixable: false,
          });
          // Only report the first matching pattern per line to avoid duplicate findings
          break;
        }
      }
    }

    return results;
  },
};

// Export all security policies
export const AWS_SECURITY_POLICIES: PolicyDefinition[] = [
  SEC001_S3_PUBLIC_ACCESS,
  SEC002_SECURITY_GROUP_OPEN,
  SEC003_RDS_PUBLIC,
  SEC004_EBS_ENCRYPTION,
  SEC005_IAM_WILDCARD,
  SEC006_CLOUDTRAIL_ENABLED,
  SEC007_CLOUDTRAIL_LOG_VALIDATION,
  SEC008_VPC_FLOW_LOGS,
  SEC009_S3_ACCESS_LOGGING,
  SEC010_DEFAULT_SG_RESTRICTIVE,
  SEC011_SUBNET_PUBLIC_IP,
  SEC012_RDS_ENCRYPTION,
  SEC013_RDS_DELETION_PROTECTION,
  SEC014_DYNAMODB_ENCRYPTION,
  SEC015_SNS_ENCRYPTION,
  SEC016_SQS_ENCRYPTION,
  SEC017_NO_INLINE_IAM_POLICIES,
  SEC018_IMDSV2_REQUIRED,
  SEC019_HARDCODED_SECRETS,
];
