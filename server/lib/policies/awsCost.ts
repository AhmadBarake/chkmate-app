/**
 * Built-in Cost Optimization Policies for AWS
 * These policies detect cost optimization opportunities in Terraform AWS resources
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

function hasProperty(resource: any, property: string): boolean {
  return resource.rawBlock.includes(property);
}

// Export all cost policies
export const AWS_COST_POLICIES: PolicyDefinition[] = [
  COST001_NAT_GATEWAY,
  COST002_OVERSIZED_INSTANCE,
  COST003_MULTI_AZ_NONPROD,
  COST004_UNATTACHED_EIP,
];
