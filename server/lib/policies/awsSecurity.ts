/**
 * Built-in Security Policies for AWS
 * These policies detect common security misconfigurations in Terraform AWS resources
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

// Export all security policies
export const AWS_SECURITY_POLICIES: PolicyDefinition[] = [
  SEC001_S3_PUBLIC_ACCESS,
  SEC002_SECURITY_GROUP_OPEN,
  SEC003_RDS_PUBLIC,
  SEC004_EBS_ENCRYPTION,
  SEC005_IAM_WILDCARD,
];
