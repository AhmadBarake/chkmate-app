/**
 * Cost Analysis Service
 * Calculates estimated costs for both HCL templates and live resources.
 * Includes all resources (even zero-cost ones) with descriptive labels,
 * rounds totals, and isolates per-resource failures so one bad resource
 * does not break the entire analysis.
 */

import { TerraformResource } from "../lib/terraformParser.js";
import { pricingService } from "../lib/pricing/aws.js";

export interface CostBreakdown {
  totalMonthly: number;
  byService: Record<string, number>;
  resources: Array<{
    name: string;
    type: string;
    monthlyCost: number;
    description: string;
  }>;
}

export class CostService {
  /**
   * Analyze cost for an HCL template
   */
  async analyzeTemplateCost(
    resources: TerraformResource[],
    region: string = "us-east-1"
  ): Promise<CostBreakdown> {
    const breakdown: CostBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: [],
    };

    for (const resource of resources) {
      try {
        const cost = await pricingService.estimateMonthlyCost(
          resource.type,
          resource.properties,
          region
        );

        const serviceName = this.getServiceName(resource.type);
        const roundedCost = Math.round(cost * 100) / 100;

        breakdown.totalMonthly += roundedCost;
        breakdown.byService[serviceName] =
          Math.round(((breakdown.byService[serviceName] || 0) + roundedCost) * 100) / 100;

        breakdown.resources.push({
          name: resource.name,
          type: resource.type,
          monthlyCost: roundedCost,
          description:
            roundedCost === 0
              ? `${this.getResourceDescription(resource)} (Free tier / request-based)`
              : this.getResourceDescription(resource),
        });
      } catch {
        // If a single resource fails, record it with $0 and continue
        breakdown.resources.push({
          name: resource.name,
          type: resource.type,
          monthlyCost: 0,
          description: "Unable to estimate cost",
        });
      }
    }

    breakdown.totalMonthly = Math.round(breakdown.totalMonthly * 100) / 100;
    return breakdown;
  }

  /**
   * Analyze cost for live cloud resources
   */
  async analyzeLiveResources(
    resources: any[],
    region: string = "us-east-1"
  ): Promise<CostBreakdown> {
    const breakdown: CostBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: [],
    };

    for (const resource of resources) {
      try {
        const metadata = resource.metadata || {};
        const resRegion = resource.region || region;

        const cost = await pricingService.estimateMonthlyCost(
          resource.resourceType,
          metadata,
          resRegion
        );

        const serviceName = this.getServiceName(resource.resourceType);
        const roundedCost = Math.round(cost * 100) / 100;

        breakdown.totalMonthly += roundedCost;
        breakdown.byService[serviceName] =
          Math.round(((breakdown.byService[serviceName] || 0) + roundedCost) * 100) / 100;

        // Build a meaningful description from metadata (instance type, etc.)
        const description = this.getLiveResourceDescription(
          resource.resourceType,
          metadata,
          resRegion
        );

        breakdown.resources.push({
          name: resource.name || resource.resourceId,
          type: resource.resourceType,
          monthlyCost: roundedCost,
          description:
            roundedCost === 0
              ? `${description} (Free tier / request-based)`
              : description,
        });
      } catch {
        breakdown.resources.push({
          name: resource.name || resource.resourceId,
          type: resource.resourceType,
          monthlyCost: 0,
          description: "Unable to estimate cost",
        });
      }
    }

    breakdown.totalMonthly = Math.round(breakdown.totalMonthly * 100) / 100;
    return breakdown;
  }

  // ---------------------------------------------------------------------------
  // Service name mapping
  // ---------------------------------------------------------------------------
  private getServiceName(type: string): string {
    if (type === "aws_instance" || type === "ec2_instance") return "EC2";
    if (type === "aws_db_instance" || type === "rds_instance") return "RDS";
    if (type.includes("s3")) return "S3";
    if (type.includes("dynamodb")) return "DynamoDB";
    if (type.includes("lambda")) return "Lambda";
    if (type.includes("amplify")) return "Amplify";

    // Networking
    if (type === "aws_lb" || type === "aws_alb" || type === "aws_nlb") return "ELB";
    if (type === "aws_nat_gateway") return "VPC";
    if (type === "aws_eip") return "EC2";
    if (type === "aws_cloudfront_distribution") return "CloudFront";

    // Containers
    if (type.includes("ecs")) return "ECS";
    if (type.includes("eks")) return "EKS";

    // Cache
    if (type.includes("elasticache")) return "ElastiCache";

    // DNS
    if (type.includes("route53")) return "Route 53";

    // API Gateway
    if (type.includes("api_gateway") || type.includes("apigateway")) return "API Gateway";

    // Messaging
    if (type === "aws_sqs_queue") return "SQS";
    if (type === "aws_sns_topic") return "SNS";

    // Security / Secrets
    if (type === "aws_kms_key") return "KMS";
    if (type === "aws_secretsmanager_secret") return "Secrets Manager";

    // Monitoring
    if (type.includes("cloudwatch")) return "CloudWatch";

    // Storage
    if (type.includes("ebs")) return "EBS";

    return "Other";
  }

  // ---------------------------------------------------------------------------
  // Resource description for HCL template resources
  // ---------------------------------------------------------------------------
  private getResourceDescription(res: TerraformResource): string {
    const p = res.properties || {};

    switch (res.type) {
      case "aws_instance":
      case "ec2_instance":
        return p.instance_type || p.instanceType || "t3.micro";

      case "aws_db_instance":
      case "rds_instance": {
        const cls = p.instance_class || p.instanceClass || "db.t3.micro";
        const engine = p.engine || "postgres";
        return `${cls} (${engine})`;
      }

      case "aws_s3_bucket":
      case "s3_bucket":
        return "S3 Bucket";

      case "aws_ebs_volume":
      case "ebs_volume": {
        const volType = p.volume_type || p.volumeType || "gp3";
        const size = p.size || 20;
        return `${volType} ${size} GB`;
      }

      case "aws_dynamodb_table":
      case "dynamodb_table": {
        const mode = p.billing_mode || p.billingMode || "PROVISIONED";
        return `DynamoDB Table (${mode})`;
      }

      case "aws_lb":
      case "aws_alb":
      case "aws_nlb": {
        const lbType = p.load_balancer_type || "application";
        return `${lbType === "network" ? "NLB" : "ALB"} Load Balancer`;
      }

      case "aws_nat_gateway":
        return "NAT Gateway";

      case "aws_eip":
        return "Elastic IP";

      case "aws_cloudfront_distribution":
        return "CloudFront Distribution";

      case "aws_ecs_service": {
        const count = p.desired_count || p.desiredCount || 1;
        return `ECS Service (${count} task${count > 1 ? "s" : ""})`;
      }
      case "aws_ecs_cluster":
        return "ECS Cluster";

      case "aws_eks_cluster":
        return "EKS Cluster";

      case "aws_elasticache_cluster": {
        const nodeType = p.node_type || p.nodeType || "cache.t3.medium";
        const numNodes = p.num_cache_nodes || p.numCacheNodes || 1;
        return `ElastiCache ${nodeType} x${numNodes}`;
      }
      case "aws_elasticache_replication_group": {
        const nodeType = p.node_type || p.nodeType || "cache.t3.medium";
        return `ElastiCache Replication Group (${nodeType})`;
      }

      case "aws_route53_zone":
        return "Route 53 Hosted Zone";

      case "aws_api_gateway_rest_api":
        return "API Gateway REST API";
      case "aws_apigatewayv2_api":
        return "API Gateway v2 API";

      case "aws_sqs_queue":
        return "SQS Queue";
      case "aws_sns_topic":
        return "SNS Topic";

      case "aws_kms_key":
        return "KMS Key";

      case "aws_secretsmanager_secret":
        return "Secrets Manager Secret";

      case "aws_cloudwatch_log_group": {
        const retention = p.retention_in_days;
        return retention
          ? `CloudWatch Log Group (${retention}d retention)`
          : "CloudWatch Log Group (no expiry)";
      }

      case "aws_lambda_function":
        return "Lambda Function";

      case "amplify_app":
        return "Amplify App";

      default:
        return res.type;
    }
  }

  // ---------------------------------------------------------------------------
  // Resource description for live (discovered) resources
  // ---------------------------------------------------------------------------
  private getLiveResourceDescription(
    resourceType: string,
    metadata: Record<string, any>,
    _region: string
  ): string {
    switch (resourceType) {
      case "aws_instance":
      case "ec2_instance":
        return metadata.instance_type || metadata.instanceType || "EC2 Instance";

      case "aws_db_instance":
      case "rds_instance": {
        const cls = metadata.instance_class || metadata.instanceClass || "db.t3.micro";
        const engine = metadata.engine || "postgres";
        return `${cls} (${engine})`;
      }

      case "aws_s3_bucket":
      case "s3_bucket":
        return "S3 Bucket";

      case "aws_ebs_volume":
      case "ebs_volume": {
        const volType = metadata.volume_type || metadata.volumeType || "gp3";
        const size = metadata.size || "?";
        return `${volType} ${size} GB`;
      }

      case "aws_dynamodb_table":
      case "dynamodb_table":
        return "DynamoDB Table";

      case "aws_lb":
      case "aws_alb":
      case "aws_nlb": {
        const lbType = metadata.load_balancer_type || "application";
        return `${lbType === "network" ? "NLB" : "ALB"} Load Balancer`;
      }

      case "aws_nat_gateway":
        return "NAT Gateway";

      case "aws_eip":
        return "Elastic IP";

      case "aws_cloudfront_distribution":
        return "CloudFront Distribution";

      case "aws_ecs_service":
        return "ECS Service";
      case "aws_ecs_cluster":
        return "ECS Cluster";

      case "aws_eks_cluster":
        return "EKS Cluster";

      case "aws_elasticache_cluster": {
        const nodeType = metadata.node_type || metadata.nodeType || "cache.t3.medium";
        return `ElastiCache (${nodeType})`;
      }
      case "aws_elasticache_replication_group":
        return "ElastiCache Replication Group";

      case "aws_route53_zone":
        return "Route 53 Hosted Zone";

      case "aws_api_gateway_rest_api":
      case "aws_apigatewayv2_api":
        return "API Gateway";

      case "aws_sqs_queue":
        return "SQS Queue";
      case "aws_sns_topic":
        return "SNS Topic";

      case "aws_kms_key":
        return "KMS Key";

      case "aws_secretsmanager_secret":
        return "Secrets Manager Secret";

      case "aws_cloudwatch_log_group":
        return "CloudWatch Log Group";

      case "aws_lambda_function":
        return "Lambda Function";

      case "amplify_app":
        return "Amplify App";

      default:
        return resourceType;
    }
  }
}

export const costService = new CostService();
