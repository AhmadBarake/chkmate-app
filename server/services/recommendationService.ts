import { PrismaClient, CloudResource, RecommendationType, EffortLevel } from '@prisma/client';

const prisma = new PrismaClient();

interface OptimizationCheck {
  id: string;
  name: string;
  type: RecommendationType;
  run: (resources: CloudResource[]) => Promise<RecommendationResult[]>;
}

interface RecommendationResult {
  resourceId: string;
  title: string;
  description: string;
  impact: { savings?: number; risk?: string; performanceGain?: string };
  effort: EffortLevel;
}

interface VolumeMetadata {
    State: string;
    Size: number;
}

interface InstanceMetadata {
    State?: { Name: string };
}

interface RDSMetadata {
    multiAZ: boolean;
    engine: string;
    status: string;
}

interface S3Metadata {
    versioning: string;
}

interface SGMetadata {
    inboundRules: any[];
}

// ----------------------------------------------------------------------------
// CHECKS
// ----------------------------------------------------------------------------

export const UnattachedEBSCheck: OptimizationCheck = {
  id: 'COST_001',
  name: 'Unattached EBS Volumes',
  type: 'COST',
  run: async (resources) => {
    // Check both potential resource types for EBS
    const volumes = resources.filter(r => r.resourceType === 'ebs' || r.resourceType === 'volume');
    const results: RecommendationResult[] = [];

    for (const volume of volumes) {
        const metadata = volume.metadata as unknown as VolumeMetadata;
        if (metadata && metadata.State === 'available') {
             // Calculate roughly $0.10 per GB (standard gp2/gp3 assumption)
             const size = metadata.Size || 0;
             const monthlyCost = size * 0.10;

             results.push({
                 resourceId: volume.id,
                 title: `Delete Unattached EBS Volume (${size} GB)`,
                 description: `Volume ${volume.resourceId} is available but not attached to any instance. Deleting it will save costs.`,
                 impact: { savings: Math.round(monthlyCost * 100) / 100 },
                 effort: 'LOW'
             });
        }
    }
    return results;
  }
};

export const StoppedInstanceCheck: OptimizationCheck = {
    id: 'COST_002',
    name: 'Stopped EC2 Instances',
    type: 'COST',
    run: async (resources) => {
        const instances = resources.filter(r => r.resourceType === 'ec2');
        const results: RecommendationResult[] = [];

        for (const instance of instances) {
            // Some scanners might put state directly or nested
            const metadata = instance.metadata as any; 
            const state = metadata.state || metadata.State?.Name; 

            if (state === 'stopped') {
                results.push({
                    resourceId: instance.id,
                    title: `Terminate Stopped Instance`,
                    description: `Instance ${instance.resourceId} is in 'stopped' state. Consider terminating if not needed.`,
                    impact: { savings: 15 }, // Rough estimate
                    effort: 'LOW'
                });
            }
        }
        return results;
    }
};

export const SingleAZRDSCheck: OptimizationCheck = {
    id: 'REL_001',
    name: 'Single-AZ RDS Deployment',
    type: 'RELIABILITY',
    run: async (resources) => {
        const instances = resources.filter(r => r.resourceType === 'rds_instance');
        const results: RecommendationResult[] = [];

        for (const instance of instances) {
            const metadata = instance.metadata as unknown as RDSMetadata;
            // Only flag if it's available (running) and explicitly not Multi-AZ
            if (metadata.status === 'available' && metadata.multiAZ === false) {
                 results.push({
                    resourceId: instance.id,
                    title: `Enable Multi-AZ for RDS (${metadata.engine})`,
                    description: `Database ${instance.resourceId} is running in a Single-AZ. Enable Multi-AZ for high availability and automated failover.`,
                    impact: { risk: "high" },
                    effort: 'MEDIUM'
                });
            }
        }
        return results;
    }
};

interface IAMUserMetadata {
    hasConsoleAccess: boolean;
    mfaEnabled: boolean;
}

interface LambdaMetadata {
    runtime: string;
    lastModified: string;
}

const DEPRECATED_RUNTIMES = [
    'nodejs12.x', 'nodejs14.x', 'python3.6', 'python3.7', 'python2.7',
    'dotnetcore2.1', 'dotnetcore3.1', 'ruby2.5', 'ruby2.7', 'go1.x'
];

export const IAMMFACheck: OptimizationCheck = {
    id: 'SEC_001',
    name: 'IAM User without MFA',
    type: 'SECURITY',
    run: async (resources) => {
        const users = resources.filter(r => r.resourceType === 'iam_user');
        const results: RecommendationResult[] = [];

        for (const user of users) {
            const metadata = user.metadata as unknown as IAMUserMetadata;
            // Only flag users with console access but no MFA
            if (metadata.hasConsoleAccess && !metadata.mfaEnabled) {
                results.push({
                    resourceId: user.id,
                    title: `Enable MFA for IAM User`,
                    description: `User ${user.name || user.resourceId} has console access but no MFA enabled. This is a security risk.`,
                    impact: { risk: 'high' },
                    effort: 'LOW'
                });
            }
        }
        return results;
    }
};

export const LambdaRuntimeCheck: OptimizationCheck = {
    id: 'SEC_002',
    name: 'Deprecated Lambda Runtime',
    type: 'SECURITY',
    run: async (resources) => {
        const functions = resources.filter(r => r.resourceType === 'lambda_function');
        const results: RecommendationResult[] = [];

        for (const func of functions) {
            const metadata = func.metadata as unknown as LambdaMetadata;
            if (metadata.runtime && DEPRECATED_RUNTIMES.includes(metadata.runtime)) {
                results.push({
                    resourceId: func.id,
                    title: `Upgrade Lambda Runtime (${metadata.runtime})`,
                    description: `Function ${func.name || func.resourceId} uses ${metadata.runtime} which is deprecated or end-of-life. Upgrade to a supported runtime.`,
                    impact: { risk: 'medium' },
                    effort: 'MEDIUM'
                });
            }
        }
        return results;
    }
};

export const S3VersioningCheck: OptimizationCheck = {
    id: 'SEC_003',
    name: 'S3 Bucket Versioning Disabled',
    type: 'SECURITY',
    run: async (resources) => {
        const buckets = resources.filter(r => r.resourceType === 's3_bucket');
        const results: RecommendationResult[] = [];

        for (const bucket of buckets) {
            const metadata = bucket.metadata as unknown as S3Metadata;
            if (metadata.versioning === 'Disabled') {
                results.push({
                    resourceId: bucket.id,
                    title: `Enable S3 Versioning`,
                    description: `Bucket ${bucket.resourceId} has versioning disabled. Enabling it protects against accidental deletions.`,
                    impact: { risk: 'medium' },
                    effort: 'LOW'
                });
            }
        }
        return results;
    }
};

export const SGOpenSSHCheck: OptimizationCheck = {
    id: 'SEC_004',
    name: 'Security Group with Open SSH',
    type: 'SECURITY',
    run: async (resources) => {
        const sgs = resources.filter(r => r.resourceType === 'security_group');
        const results: RecommendationResult[] = [];

        for (const sg of sgs) {
            const metadata = sg.metadata as unknown as SGMetadata;
            const rules = metadata.inboundRules || [];
            
            const isOpenSSH = rules.some((rule: any) => {
                const isSSH = (rule.FromPort <= 22 && rule.ToPort >= 22) || rule.IpProtocol === '-1';
                const isPublic = (rule.IpRanges || []).some((range: any) => range.CidrIp === '0.0.0.0/0');
                return isSSH && isPublic;
            });

            if (isOpenSSH) {
                results.push({
                    resourceId: sg.id,
                    title: `Restrict Public SSH Access`,
                    description: `Security Group ${sg.name || sg.resourceId} allowed public access (0.0.0.0/0) on port 22. Consider restricting this.`,
                    impact: { risk: 'critical' },
                    effort: 'LOW'
                });
            }
        }
        return results;
    }
};


const CHECKS = [
    UnattachedEBSCheck,
    StoppedInstanceCheck,
    SingleAZRDSCheck,
    IAMMFACheck,
    LambdaRuntimeCheck,
    S3VersioningCheck,
    SGOpenSSHCheck
];

// ----------------------------------------------------------------------------
// SERVICE METHODS
// ----------------------------------------------------------------------------

export async function generateRecommendations(connectionId: string) {
  // 1. Fetch Resources
  const resources = await prisma.cloudResource.findMany({
    where: { connectionId }
  });

  // 2. Run Checks
  const recommendations: Array<{
      connectionId: string;
      resourceId: string;
      type: RecommendationType;
      title: string;
      description: string;
      impact: string;
      effort: EffortLevel;
      status: 'OPEN';
  }> = [];

  for (const check of CHECKS) {
      try {
          const results = await check.run(resources);
          for (const result of results) {
              recommendations.push({
                  connectionId,
                  resourceId: result.resourceId,
                  type: check.type,
                  title: result.title,
                  description: result.description,
                  impact: JSON.stringify(result.impact),
                  effort: result.effort,
                  status: 'OPEN' as const // Force literal type
              });
          }
      } catch (err) {
          console.error(`Failed to run check ${check.name}`, err);
      }
  }

  // 3. Save to DB 
  await prisma.$transaction(async (tx) => {
      // Remove existing OPEN recommendations
      await tx.recommendation.deleteMany({
          where: { 
              connectionId, 
              status: 'OPEN' 
          }
      });

      // Insert new ones
      if (recommendations.length > 0) {
        await tx.recommendation.createMany({
            data: recommendations
        });
      }
  });

  return await getRecommendations(connectionId);
}

export async function getRecommendations(connectionId: string) {
    const recs = await prisma.recommendation.findMany({
        where: { connectionId },
        orderBy: { type: 'asc' }
    });
    
    // Parse impact JSON
    return recs.map(r => ({
        ...r,
        impact: JSON.parse(r.impact)
    }));
}

export async function dismissRecommendation(id: string) {
    return prisma.recommendation.update({
        where: { id },
        data: { 
            status: 'DISMISSED',
            dismissedAt: new Date()
        }
    });
}
