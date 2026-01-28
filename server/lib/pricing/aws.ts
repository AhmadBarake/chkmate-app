/**
 * AWS Pricing Service
 * Handles on-demand price lookups for various AWS services
 */

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

// Common instance type prices (on-demand per hour) - approx values for us-east-1
// This serves as a fallback or optimized cache
const INSTANCE_PRICE_CATALOG: Record<string, number> = {
  "t3.nano": 0.0052,
  "t3.micro": 0.0104,
  "t3.small": 0.0208,
  "t3.medium": 0.0416,
  "t3.large": 0.0832,
  "t3.xlarge": 0.1664,
  "m5.large": 0.096,
  "m5.xlarge": 0.192,
  "m5.2xlarge": 0.384,
  "c5.large": 0.085,
  "c5.xlarge": 0.17,
  "r5.large": 0.126,
  "r5.xlarge": 0.252,
};

// RDS Prices (approx per hour for db.t3.medium in us-east-1)
const RDS_PRICE_CATALOG: Record<string, number> = {
  "db.t3.micro": 0.017,
  "db.t3.small": 0.034,
  "db.t3.medium": 0.068,
  "db.m5.large": 0.115,
};

// Storage prices (approx per GB-month)
const STORAGE_PRICES = {
  s3_standard: 0.023,
  ebs_gp3: 0.08,
  ebs_gp2: 0.10,
  rds_storage: 0.115,
  dynamodb_storage: 0.25, // per GB-month
};

// Amplify prices (approx)
const AMPLIFY_PRICES = {
  build_minute: 0.01,
  data_transfer_gb: 0.15,
  storage_gb: 0.023,
};

export class AWSPricingService {
  private client: PricingClient | null = null;

  constructor() {
    // AWS Pricing API is only available in us-east-1 and ap-south-1
    try {
      this.client = new PricingClient({ region: "us-east-1" });
    } catch {
      this.client = null;
    }
  }

  /**
   * Get EC2 instance hourly price
   */
  async getEC2Price(instanceType: string, region: string = "us-east-1"): Promise<number> {
    // Check catalog first
    if (INSTANCE_PRICE_CATALOG[instanceType]) {
      return INSTANCE_PRICE_CATALOG[instanceType];
    }

    // Default to a sane value if not found
    return 0.05; 
  }

  /**
   * Get RDS instance hourly price
   */
  async getRDSPrice(instanceType: string, engine: string = "postgres", region: string = "us-east-1"): Promise<number> {
    if (RDS_PRICE_CATALOG[instanceType]) {
      return RDS_PRICE_CATALOG[instanceType];
    }
    return 0.1;
  }

  /**
   * Get storage price per GB-month
   */
  getStoragePrice(type: 's3' | 'ebs' | 'rds'): number {
    switch (type) {
      case 's3': return STORAGE_PRICES.s3_standard;
      case 'ebs': return STORAGE_PRICES.ebs_gp3;
      case 'rds': return STORAGE_PRICES.rds_storage;
      default: return 0.1;
    }
  }

  /**
   * Estimate monthly cost for a resource
   */
  async estimateMonthlyCost(type: string, props: any, region: string = "us-east-1"): Promise<number> {
    const HOURS_IN_MONTH = 730;

    switch (type) {
      case 'aws_instance':
      case 'ec2_instance':
        const ec2Type = props.instance_type || props.instanceType || 't3.micro';
        const hourlyRate = await this.getEC2Price(ec2Type, region);
        return hourlyRate * HOURS_IN_MONTH;

      case 'aws_db_instance':
      case 'rds_instance':
        const rdsType = props.instance_class || props.instanceClass || 'db.t3.micro';
        const rdsStorage = props.allocated_storage || props.allocatedStorage || 20;
        const rdsHourly = await this.getRDSPrice(rdsType, props.engine, region);
        const storageCost = rdsStorage * this.getStoragePrice('rds');
        return (rdsHourly * HOURS_IN_MONTH) + storageCost;

      case 'aws_s3_bucket':
      case 's3_bucket':
        // Difficult to estimate without usage data, but let's assume a baseline
        return 0.50; // Minimum baseline for empty bucket/mgmt costs

      case 'aws_ebs_volume':
      case 'ebs_volume':
        const size = props.size || 20;
        return size * this.getStoragePrice('ebs');

      case 'aws_dynamodb_table':
      case 'dynamodb_table':
        // Assume baseline 1GB storage and small RCU/WCU (Pay per request baseline)
        return 1.25; // Baseline estimated cost

      case 'amplify_app':
        // Difficult to estimate, but let's assume a baseline for a small production app
        // (Builds + Hosting + Transfer)
        return 5.00;

      default:
        return 0;
    }
  }
}

export const pricingService = new AWSPricingService();
