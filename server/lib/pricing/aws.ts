/**
 * AWS Pricing Service
 * Handles on-demand price lookups for various AWS services.
 * Uses a comprehensive static catalog with region multipliers,
 * an in-memory TTL cache, and the AWS Pricing API as a fallback.
 */

import { PricingClient, GetProductsCommand } from "@aws-sdk/client-pricing";

// ---------------------------------------------------------------------------
// Region multipliers (us-east-1 = 1.0 baseline)
// ---------------------------------------------------------------------------
const REGION_MULTIPLIERS: Record<string, number> = {
  "us-east-1": 1.0,
  "us-east-2": 1.0,
  "us-west-1": 1.05,
  "us-west-2": 1.02,
  "ca-central-1": 1.04,
  "eu-west-1": 1.05,
  "eu-west-2": 1.07,
  "eu-west-3": 1.08,
  "eu-central-1": 1.06,
  "eu-north-1": 1.05,
  "ap-southeast-1": 1.10,
  "ap-southeast-2": 1.12,
  "ap-northeast-1": 1.15,
  "ap-northeast-2": 1.12,
  "ap-northeast-3": 1.15,
  "ap-south-1": 1.08,
  "sa-east-1": 1.20,
  "me-south-1": 1.12,
  "af-south-1": 1.14,
};

function getRegionMultiplier(region: string): number {
  return REGION_MULTIPLIERS[region] ?? 1.0;
}

// ---------------------------------------------------------------------------
// EC2 instance hourly prices (on-demand, us-east-1)
// ---------------------------------------------------------------------------
const INSTANCE_PRICE_CATALOG: Record<string, number> = {
  // --- t3 ---
  "t3.nano": 0.0052,
  "t3.micro": 0.0104,
  "t3.small": 0.0208,
  "t3.medium": 0.0416,
  "t3.large": 0.0832,
  "t3.xlarge": 0.1664,
  "t3.2xlarge": 0.3328,

  // --- t3a ---
  "t3a.nano": 0.0047,
  "t3a.micro": 0.0094,
  "t3a.small": 0.0188,
  "t3a.medium": 0.0376,
  "t3a.large": 0.0752,
  "t3a.xlarge": 0.1504,
  "t3a.2xlarge": 0.3008,

  // --- t4g (Graviton) ---
  "t4g.nano": 0.0042,
  "t4g.micro": 0.0084,
  "t4g.small": 0.0168,
  "t4g.medium": 0.0336,
  "t4g.large": 0.0672,
  "t4g.xlarge": 0.1344,
  "t4g.2xlarge": 0.2688,

  // --- m5 ---
  "m5.large": 0.096,
  "m5.xlarge": 0.192,
  "m5.2xlarge": 0.384,

  // --- m6i ---
  "m6i.micro": 0.0096,
  "m6i.small": 0.0192,
  "m6i.medium": 0.0384,
  "m6i.large": 0.096,
  "m6i.xlarge": 0.192,
  "m6i.2xlarge": 0.384,

  // --- m6g (Graviton) ---
  "m6g.micro": 0.0077,
  "m6g.small": 0.0154,
  "m6g.medium": 0.0308,
  "m6g.large": 0.077,
  "m6g.xlarge": 0.154,
  "m6g.2xlarge": 0.308,

  // --- m7g (Graviton3) ---
  "m7g.micro": 0.0081,
  "m7g.small": 0.0163,
  "m7g.medium": 0.0325,
  "m7g.large": 0.0816,
  "m7g.xlarge": 0.1632,
  "m7g.2xlarge": 0.3264,

  // --- c5 ---
  "c5.large": 0.085,
  "c5.xlarge": 0.17,
  "c5.2xlarge": 0.34,

  // --- c6i ---
  "c6i.micro": 0.0085,
  "c6i.small": 0.017,
  "c6i.medium": 0.034,
  "c6i.large": 0.085,
  "c6i.xlarge": 0.17,
  "c6i.2xlarge": 0.34,

  // --- c6g (Graviton) ---
  "c6g.micro": 0.0068,
  "c6g.small": 0.0136,
  "c6g.medium": 0.0272,
  "c6g.large": 0.068,
  "c6g.xlarge": 0.136,
  "c6g.2xlarge": 0.272,

  // --- c7g (Graviton3) ---
  "c7g.micro": 0.0072,
  "c7g.small": 0.0145,
  "c7g.medium": 0.029,
  "c7g.large": 0.0725,
  "c7g.xlarge": 0.145,
  "c7g.2xlarge": 0.29,

  // --- r5 ---
  "r5.large": 0.126,
  "r5.xlarge": 0.252,
  "r5.2xlarge": 0.504,

  // --- r6i ---
  "r6i.micro": 0.0126,
  "r6i.small": 0.0252,
  "r6i.medium": 0.0504,
  "r6i.large": 0.126,
  "r6i.xlarge": 0.252,
  "r6i.2xlarge": 0.504,

  // --- r6g (Graviton) ---
  "r6g.micro": 0.0101,
  "r6g.small": 0.0201,
  "r6g.medium": 0.0403,
  "r6g.large": 0.1008,
  "r6g.xlarge": 0.2016,
  "r6g.2xlarge": 0.4032,
};

// ---------------------------------------------------------------------------
// RDS instance hourly prices (on-demand, us-east-1)
// Engine multipliers are applied on top: mysql baseline 1.0
// ---------------------------------------------------------------------------
const RDS_PRICE_CATALOG: Record<string, number> = {
  // --- db.t3 ---
  "db.t3.micro": 0.017,
  "db.t3.small": 0.034,
  "db.t3.medium": 0.068,
  "db.t3.large": 0.136,
  "db.t3.xlarge": 0.272,
  "db.t3.2xlarge": 0.544,

  // --- db.t4g (Graviton) ---
  "db.t4g.micro": 0.016,
  "db.t4g.small": 0.032,
  "db.t4g.medium": 0.065,
  "db.t4g.large": 0.129,
  "db.t4g.xlarge": 0.258,
  "db.t4g.2xlarge": 0.516,

  // --- db.m5 ---
  "db.m5.large": 0.115,
  "db.m5.xlarge": 0.230,
  "db.m5.2xlarge": 0.460,

  // --- db.m6g (Graviton) ---
  "db.m6g.large": 0.105,
  "db.m6g.xlarge": 0.210,
  "db.m6g.2xlarge": 0.420,

  // --- db.r5 ---
  "db.r5.large": 0.145,
  "db.r5.xlarge": 0.290,
  "db.r5.2xlarge": 0.580,

  // --- db.r6g (Graviton) ---
  "db.r6g.large": 0.130,
  "db.r6g.xlarge": 0.260,
  "db.r6g.2xlarge": 0.520,
};

// Engine multiplier applied on top of the base (mysql) price
const RDS_ENGINE_MULTIPLIERS: Record<string, number> = {
  mysql: 1.0,
  mariadb: 1.0,
  postgres: 1.08,
  "aurora-mysql": 1.15,
  "aurora-postgresql": 1.18,
  "oracle-ee": 2.8,
  "oracle-se2": 1.6,
  "sqlserver-ee": 3.2,
  "sqlserver-se": 1.9,
  "sqlserver-ex": 1.0,
  "sqlserver-web": 1.2,
};

function getRDSEngineMultiplier(engine: string): number {
  const normalized = (engine || "mysql").toLowerCase().trim();
  return RDS_ENGINE_MULTIPLIERS[normalized] ?? 1.0;
}

// ---------------------------------------------------------------------------
// Storage prices (per GB-month, us-east-1)
// ---------------------------------------------------------------------------
const STORAGE_PRICES = {
  s3_standard: 0.023,
  ebs_gp3: 0.08,
  ebs_gp2: 0.10,
  ebs_io1: 0.125,
  ebs_io2: 0.125,
  ebs_st1: 0.045,
  ebs_sc1: 0.015,
  ebs_standard: 0.05,
  rds_storage: 0.115,
  dynamodb_storage: 0.25,
};

// Amplify prices
const AMPLIFY_PRICES = {
  build_minute: 0.01,
  data_transfer_gb: 0.15,
  storage_gb: 0.023,
};

// ElastiCache node-hour prices (us-east-1)
const ELASTICACHE_PRICE_CATALOG: Record<string, number> = {
  "cache.t3.micro": 0.017,
  "cache.t3.small": 0.034,
  "cache.t3.medium": 0.068,
  "cache.t4g.micro": 0.016,
  "cache.t4g.small": 0.032,
  "cache.t4g.medium": 0.065,
  "cache.m5.large": 0.124,
  "cache.m5.xlarge": 0.248,
  "cache.m6g.large": 0.113,
  "cache.m6g.xlarge": 0.226,
  "cache.r5.large": 0.166,
  "cache.r5.xlarge": 0.332,
  "cache.r6g.large": 0.150,
  "cache.r6g.xlarge": 0.300,
};

// ---------------------------------------------------------------------------
// In-memory TTL cache
// ---------------------------------------------------------------------------
interface CacheEntry {
  value: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

class PriceCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): number | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: number, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Remove expired entries (call periodically if desired) */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// AWS Pricing Service
// ---------------------------------------------------------------------------
export class AWSPricingService {
  private client: PricingClient | null = null;
  private cache = new PriceCache();

  constructor() {
    // AWS Pricing API is only available in us-east-1 and ap-south-1
    try {
      this.client = new PricingClient({ region: "us-east-1" });
    } catch {
      this.client = null;
    }
  }

  // -------------------------------------------------------------------------
  // EC2 price lookup
  // -------------------------------------------------------------------------
  async getEC2Price(instanceType: string, region: string = "us-east-1"): Promise<number> {
    const cacheKey = `ec2:${instanceType}:${region}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const multiplier = getRegionMultiplier(region);

    // Check static catalog
    if (INSTANCE_PRICE_CATALOG[instanceType] !== undefined) {
      const price = INSTANCE_PRICE_CATALOG[instanceType] * multiplier;
      this.cache.set(cacheKey, price);
      return price;
    }

    // Fallback: AWS Pricing API
    const apiPrice = await this.fetchEC2PriceFromAPI(instanceType, region);
    if (apiPrice !== null) {
      this.cache.set(cacheKey, apiPrice);
      return apiPrice;
    }

    // Last resort: heuristic based on instance family/size
    const fallback = this.estimateEC2PriceHeuristic(instanceType) * multiplier;
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  private async fetchEC2PriceFromAPI(instanceType: string, region: string): Promise<number | null> {
    if (!this.client) return null;

    try {
      const command = new GetProductsCommand({
        ServiceCode: "AmazonEC2",
        Filters: [
          { Type: "TERM_MATCH", Field: "instanceType", Value: instanceType },
          { Type: "TERM_MATCH", Field: "location", Value: this.regionToLocationName(region) },
          { Type: "TERM_MATCH", Field: "operatingSystem", Value: "Linux" },
          { Type: "TERM_MATCH", Field: "tenancy", Value: "Shared" },
          { Type: "TERM_MATCH", Field: "preInstalledSw", Value: "NA" },
          { Type: "TERM_MATCH", Field: "capacitystatus", Value: "Used" },
        ],
        MaxResults: 1,
      });

      const response = await this.client.send(command);
      if (response.PriceList && response.PriceList.length > 0) {
        const priceData = JSON.parse(response.PriceList[0] as string);
        const onDemand = priceData.terms?.OnDemand;
        if (onDemand) {
          const firstKey = Object.keys(onDemand)[0];
          const priceDimensions = onDemand[firstKey]?.priceDimensions;
          if (priceDimensions) {
            const dimKey = Object.keys(priceDimensions)[0];
            const pricePerUnit = parseFloat(
              priceDimensions[dimKey]?.pricePerUnit?.USD ?? "0"
            );
            if (pricePerUnit > 0) return pricePerUnit;
          }
        }
      }
    } catch {
      // API unavailable or error -- fall through
    }

    return null;
  }

  private estimateEC2PriceHeuristic(instanceType: string): number {
    // Try to derive a rough hourly rate from the size suffix
    const sizeMultipliers: Record<string, number> = {
      nano: 0.25,
      micro: 0.5,
      small: 1,
      medium: 2,
      large: 4,
      xlarge: 8,
      "2xlarge": 16,
      "4xlarge": 32,
      "8xlarge": 64,
      "12xlarge": 96,
      "16xlarge": 128,
      "24xlarge": 192,
    };

    const parts = instanceType.split(".");
    const sizeName = parts[1] || "large";
    const sizeMul = sizeMultipliers[sizeName] ?? 4;

    // Base unit price ~$0.012 per unit
    return 0.012 * sizeMul;
  }

  // -------------------------------------------------------------------------
  // RDS price lookup
  // -------------------------------------------------------------------------
  async getRDSPrice(
    instanceType: string,
    engine: string = "postgres",
    region: string = "us-east-1"
  ): Promise<number> {
    const cacheKey = `rds:${instanceType}:${engine}:${region}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const regionMul = getRegionMultiplier(region);
    const engineMul = getRDSEngineMultiplier(engine);

    // Check static catalog
    if (RDS_PRICE_CATALOG[instanceType] !== undefined) {
      const price = RDS_PRICE_CATALOG[instanceType] * regionMul * engineMul;
      this.cache.set(cacheKey, price);
      return price;
    }

    // Fallback: AWS Pricing API
    const apiPrice = await this.fetchRDSPriceFromAPI(instanceType, engine, region);
    if (apiPrice !== null) {
      this.cache.set(cacheKey, apiPrice);
      return apiPrice;
    }

    // Heuristic fallback
    const fallback = 0.10 * regionMul * engineMul;
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  private async fetchRDSPriceFromAPI(
    instanceType: string,
    engine: string,
    region: string
  ): Promise<number | null> {
    if (!this.client) return null;

    try {
      const command = new GetProductsCommand({
        ServiceCode: "AmazonRDS",
        Filters: [
          { Type: "TERM_MATCH", Field: "instanceType", Value: instanceType },
          { Type: "TERM_MATCH", Field: "location", Value: this.regionToLocationName(region) },
          { Type: "TERM_MATCH", Field: "databaseEngine", Value: this.normalizeRDSEngineForAPI(engine) },
          { Type: "TERM_MATCH", Field: "deploymentOption", Value: "Single-AZ" },
        ],
        MaxResults: 1,
      });

      const response = await this.client.send(command);
      if (response.PriceList && response.PriceList.length > 0) {
        const priceData = JSON.parse(response.PriceList[0] as string);
        const onDemand = priceData.terms?.OnDemand;
        if (onDemand) {
          const firstKey = Object.keys(onDemand)[0];
          const priceDimensions = onDemand[firstKey]?.priceDimensions;
          if (priceDimensions) {
            const dimKey = Object.keys(priceDimensions)[0];
            const pricePerUnit = parseFloat(
              priceDimensions[dimKey]?.pricePerUnit?.USD ?? "0"
            );
            if (pricePerUnit > 0) return pricePerUnit;
          }
        }
      }
    } catch {
      // API unavailable -- fall through
    }

    return null;
  }

  private normalizeRDSEngineForAPI(engine: string): string {
    const map: Record<string, string> = {
      postgres: "PostgreSQL",
      mysql: "MySQL",
      mariadb: "MariaDB",
      "aurora-mysql": "Aurora MySQL",
      "aurora-postgresql": "Aurora PostgreSQL",
      "oracle-ee": "Oracle",
      "oracle-se2": "Oracle",
      "sqlserver-ee": "SQL Server",
      "sqlserver-se": "SQL Server",
      "sqlserver-ex": "SQL Server",
      "sqlserver-web": "SQL Server",
    };
    return map[(engine || "").toLowerCase()] ?? engine;
  }

  private regionToLocationName(region: string): string {
    const map: Record<string, string> = {
      "us-east-1": "US East (N. Virginia)",
      "us-east-2": "US East (Ohio)",
      "us-west-1": "US West (N. California)",
      "us-west-2": "US West (Oregon)",
      "ca-central-1": "Canada (Central)",
      "eu-west-1": "EU (Ireland)",
      "eu-west-2": "EU (London)",
      "eu-west-3": "EU (Paris)",
      "eu-central-1": "EU (Frankfurt)",
      "eu-north-1": "EU (Stockholm)",
      "ap-southeast-1": "Asia Pacific (Singapore)",
      "ap-southeast-2": "Asia Pacific (Sydney)",
      "ap-northeast-1": "Asia Pacific (Tokyo)",
      "ap-northeast-2": "Asia Pacific (Seoul)",
      "ap-northeast-3": "Asia Pacific (Osaka)",
      "ap-south-1": "Asia Pacific (Mumbai)",
      "sa-east-1": "South America (Sao Paulo)",
      "me-south-1": "Middle East (Bahrain)",
      "af-south-1": "Africa (Cape Town)",
    };
    return map[region] ?? "US East (N. Virginia)";
  }

  // -------------------------------------------------------------------------
  // ElastiCache price lookup
  // -------------------------------------------------------------------------
  async getElastiCachePrice(nodeType: string, region: string = "us-east-1"): Promise<number> {
    const cacheKey = `elasticache:${nodeType}:${region}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const multiplier = getRegionMultiplier(region);

    if (ELASTICACHE_PRICE_CATALOG[nodeType] !== undefined) {
      const price = ELASTICACHE_PRICE_CATALOG[nodeType] * multiplier;
      this.cache.set(cacheKey, price);
      return price;
    }

    // Fallback: similar to a comparable EC2 instance
    const fallback = 0.068 * multiplier;
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  // -------------------------------------------------------------------------
  // Storage price helper
  // -------------------------------------------------------------------------
  getStoragePrice(type: "s3" | "ebs" | "rds", volumeType?: string): number {
    switch (type) {
      case "s3":
        return STORAGE_PRICES.s3_standard;
      case "ebs": {
        if (volumeType) {
          const key = `ebs_${volumeType}` as keyof typeof STORAGE_PRICES;
          if (STORAGE_PRICES[key] !== undefined) return STORAGE_PRICES[key];
        }
        return STORAGE_PRICES.ebs_gp3;
      }
      case "rds":
        return STORAGE_PRICES.rds_storage;
      default:
        return 0.1;
    }
  }

  // -------------------------------------------------------------------------
  // Monthly cost estimator for any resource type
  // -------------------------------------------------------------------------
  async estimateMonthlyCost(
    type: string,
    props: any,
    region: string = "us-east-1"
  ): Promise<number> {
    const HOURS_IN_MONTH = 730;

    // Safely default props to an empty object
    const p = props ?? {};

    try {
      switch (type) {
        // ------------------------------------------------------------------
        // EC2
        // ------------------------------------------------------------------
        case "aws_instance":
        case "ec2_instance": {
          const ec2Type = p.instance_type || p.instanceType || "t3.micro";
          const hourlyRate = await this.getEC2Price(ec2Type, region);
          return hourlyRate * HOURS_IN_MONTH;
        }

        // ------------------------------------------------------------------
        // RDS
        // ------------------------------------------------------------------
        case "aws_db_instance":
        case "rds_instance": {
          const rdsType = p.instance_class || p.instanceClass || "db.t3.micro";
          const rdsEngine = p.engine || "postgres";
          const rdsStorage = p.allocated_storage || p.allocatedStorage || 20;
          const rdsHourly = await this.getRDSPrice(rdsType, rdsEngine, region);
          const storageCost = rdsStorage * this.getStoragePrice("rds");
          return rdsHourly * HOURS_IN_MONTH + storageCost;
        }

        // ------------------------------------------------------------------
        // S3
        // ------------------------------------------------------------------
        case "aws_s3_bucket":
        case "s3_bucket":
          return 0.50; // Baseline for empty bucket / management

        // ------------------------------------------------------------------
        // EBS - differentiate volume types
        // ------------------------------------------------------------------
        case "aws_ebs_volume":
        case "ebs_volume": {
          const size = p.size || 20;
          const volType = p.volume_type || p.volumeType || "gp3";
          let cost = size * this.getStoragePrice("ebs", volType);

          // io1/io2: add IOPS cost ($0.065 per provisioned IOPS-month)
          if ((volType === "io1" || volType === "io2") && p.iops) {
            cost += p.iops * 0.065;
          }

          return cost;
        }

        // ------------------------------------------------------------------
        // DynamoDB
        // ------------------------------------------------------------------
        case "aws_dynamodb_table":
        case "dynamodb_table": {
          // PAY_PER_REQUEST has no baseline; PROVISIONED charges for RCU/WCU
          const billingMode = p.billing_mode || p.billingMode || "PROVISIONED";
          if (billingMode === "PAY_PER_REQUEST") {
            return 1.25; // Small baseline estimate
          }
          // PROVISIONED: $0.00065 per WCU, $0.00013 per RCU per hour
          const wcu = p.write_capacity || 5;
          const rcu = p.read_capacity || 5;
          return (wcu * 0.00065 + rcu * 0.00013) * HOURS_IN_MONTH + STORAGE_PRICES.dynamodb_storage;
        }

        // ------------------------------------------------------------------
        // ALB / NLB / ELB
        // ------------------------------------------------------------------
        case "aws_lb":
        case "aws_alb":
        case "aws_nlb": {
          // Base cost: ~$0.0225/hr = ~$16.43/month + LCU estimate
          const lbType = p.load_balancer_type || "application";
          const baseHourly = lbType === "network" ? 0.0225 : 0.0225;
          const baseCost = baseHourly * HOURS_IN_MONTH;
          // Add a small LCU / NLCU baseline estimate (~$5/month for light traffic)
          return baseCost + 5.0;
        }

        // ------------------------------------------------------------------
        // NAT Gateway
        // ------------------------------------------------------------------
        case "aws_nat_gateway": {
          // $0.045/hr = ~$32.85/month base + data processing ($0.045/GB)
          const baseCost = 0.045 * HOURS_IN_MONTH;
          // Add a baseline data processing estimate (10 GB/month)
          return baseCost + 10 * 0.045;
        }

        // ------------------------------------------------------------------
        // Elastic IP
        // ------------------------------------------------------------------
        case "aws_eip": {
          // $0.005/hr when associated = ~$3.65/month
          return 3.65;
        }

        // ------------------------------------------------------------------
        // CloudFront
        // ------------------------------------------------------------------
        case "aws_cloudfront_distribution": {
          // Data-transfer dependent; return a light-usage baseline estimate
          // Includes baseline request costs + small data transfer
          return 1.0;
        }

        // ------------------------------------------------------------------
        // ECS
        // ------------------------------------------------------------------
        case "aws_ecs_service": {
          // Estimate based on desired_count and assumed Fargate pricing
          const taskCount = p.desired_count || p.desiredCount || 1;
          // Assume 0.25 vCPU / 0.5 GB per task ~ $0.01234/hr per task
          const perTaskHourly = 0.25 * 0.04048 + 0.5 * 0.004445;
          return taskCount * perTaskHourly * HOURS_IN_MONTH;
        }
        case "aws_ecs_cluster": {
          // Cluster itself is free; cost comes from tasks/services
          return 0;
        }

        // ------------------------------------------------------------------
        // EKS
        // ------------------------------------------------------------------
        case "aws_eks_cluster": {
          // $0.10/hr = $73/month per cluster
          return 0.10 * HOURS_IN_MONTH;
        }

        // ------------------------------------------------------------------
        // ElastiCache
        // ------------------------------------------------------------------
        case "aws_elasticache_cluster": {
          const nodeType = p.node_type || p.nodeType || "cache.t3.medium";
          const numNodes = p.num_cache_nodes || p.numCacheNodes || 1;
          const hourly = await this.getElastiCachePrice(nodeType, region);
          return hourly * HOURS_IN_MONTH * numNodes;
        }
        case "aws_elasticache_replication_group": {
          const nodeType = p.node_type || p.nodeType || "cache.t3.medium";
          const numReplicas = (p.number_cache_clusters || p.num_cache_clusters || 2);
          const hourly = await this.getElastiCachePrice(nodeType, region);
          return hourly * HOURS_IN_MONTH * numReplicas;
        }

        // ------------------------------------------------------------------
        // Route 53
        // ------------------------------------------------------------------
        case "aws_route53_zone": {
          return 0.50; // $0.50/month per hosted zone
        }

        // ------------------------------------------------------------------
        // API Gateway
        // ------------------------------------------------------------------
        case "aws_api_gateway_rest_api":
        case "aws_apigatewayv2_api": {
          // Request-based; return a small baseline for REST API cache/overhead
          return 3.50; // ~$3.50/month baseline (first 333M requests free tier)
        }

        // ------------------------------------------------------------------
        // SQS / SNS -- request-based, minimal
        // ------------------------------------------------------------------
        case "aws_sqs_queue":
        case "aws_sns_topic": {
          return 0;
        }

        // ------------------------------------------------------------------
        // KMS
        // ------------------------------------------------------------------
        case "aws_kms_key": {
          return 1.0; // $1/month per CMK
        }

        // ------------------------------------------------------------------
        // Secrets Manager
        // ------------------------------------------------------------------
        case "aws_secretsmanager_secret": {
          return 0.40; // $0.40/month per secret
        }

        // ------------------------------------------------------------------
        // CloudWatch Log Group
        // ------------------------------------------------------------------
        case "aws_cloudwatch_log_group": {
          // Ingestion-based; return a small baseline estimate
          // $0.50 per GB ingested; assume light usage (1 GB/month)
          return 0.50;
        }

        // ------------------------------------------------------------------
        // Amplify
        // ------------------------------------------------------------------
        case "amplify_app": {
          return 5.0;
        }

        // ------------------------------------------------------------------
        // Lambda (request+duration based, typically minimal)
        // ------------------------------------------------------------------
        case "aws_lambda_function": {
          return 0;
        }

        default:
          return 0;
      }
    } catch {
      // If any individual estimation fails, return 0 rather than crashing
      return 0;
    }
  }
}

export const pricingService = new AWSPricingService();
