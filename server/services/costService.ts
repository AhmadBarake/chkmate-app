/**
 * Cost Analysis Service
 * Calculates estimated costs for both HCL templates and live resources
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
  async analyzeTemplateCost(resources: TerraformResource[], region: string = "us-east-1"): Promise<CostBreakdown> {
    const breakdown: CostBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: []
    };

    for (const resource of resources) {
      const cost = await pricingService.estimateMonthlyCost(resource.type, resource.properties, region);
      
      if (cost > 0) {
        const serviceName = this.getServiceName(resource.type);
        breakdown.totalMonthly += cost;
        breakdown.byService[serviceName] = (breakdown.byService[serviceName] || 0) + cost;
        
        breakdown.resources.push({
          name: resource.name,
          type: resource.type,
          monthlyCost: cost,
          description: this.getResourceDescription(resource)
        });
      }
    }

    return breakdown;
  }

  /**
   * Analyze cost for live cloud resources
   */
  async analyzeLiveResources(resources: any[], region: string = "us-east-1"): Promise<CostBreakdown> {
    const breakdown: CostBreakdown = {
      totalMonthly: 0,
      byService: {},
      resources: []
    };

    for (const resource of resources) {
      const cost = await pricingService.estimateMonthlyCost(resource.resourceType, resource.metadata || {}, resource.region || region);
      
      if (cost > 0) {
        const serviceName = this.getServiceName(resource.resourceType);
        breakdown.totalMonthly += cost;
        breakdown.byService[serviceName] = (breakdown.byService[serviceName] || 0) + cost;
        
        breakdown.resources.push({
          name: resource.name || resource.resourceId,
          type: resource.resourceType,
          monthlyCost: cost,
          description: resource.region || region
        });
      }
    }

    return breakdown;
  }

  private getServiceName(type: string): string {
    if (type.includes('s3')) return 'S3';
    if (type.includes('ec2') || type === 'aws_instance') return 'EC2';
    if (type.includes('rds') || type.includes('db_instance')) return 'RDS';
    if (type.includes('lambda')) return 'Lambda';
    if (type.includes('dynamodb')) return 'DynamoDB';
    if (type.includes('amplify')) return 'Amplify';
    return 'Other';
  }

  private getResourceDescription(res: TerraformResource): string {
    if (res.type === 'aws_instance') {
      return res.properties.instance_type || 't3.micro';
    }
    if (res.type === 'aws_db_instance') {
      return res.properties.instance_class || 'db.t3.micro';
    }
    if (res.type === 'aws_dynamodb_table' || res.type === 'dynamodb_table') {
      return 'DynamoDB Table';
    }
    if (res.type === 'amplify_app') {
      return 'Amplify App';
    }
    return '';
  }
}

export const costService = new CostService();
