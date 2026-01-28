/**
 * Policy Engine Service
 * Core engine that runs policies against Terraform templates
 */

import { PrismaClient, PolicyCategory, Severity } from '@prisma/client';
import { parseTerraform } from '../lib/terraformParser.js';
import {
  BUILT_IN_POLICIES,
  getPoliciesByProvider,
  PolicyContext,
  PolicyDefinition,
  PolicyResult,
  AuditResult,
} from '../lib/policies/index.js';
import { costService } from './costService.js';

const prisma = new PrismaClient();

/**
 * Seed built-in policies to the database
 */
export async function seedBuiltInPolicies(): Promise<void> {
  for (const policy of BUILT_IN_POLICIES) {
    await prisma.policy.upsert({
      where: { code: policy.code },
      update: {
        name: policy.name,
        description: policy.description,
        provider: policy.provider,
        category: policy.category as PolicyCategory,
        severity: policy.severity as Severity,
        ruleLogic: { type: 'built-in' },
        isBuiltIn: true,
      },
      create: {
        code: policy.code,
        name: policy.name,
        description: policy.description,
        provider: policy.provider,
        category: policy.category as PolicyCategory,
        severity: policy.severity as Severity,
        ruleLogic: { type: 'built-in' },
        isBuiltIn: true,
        isActive: true,
      },
    });
  }
}

/**
 * Get active policies from database for a specific provider
 */
export async function getActivePolicies(provider: string): Promise<PolicyDefinition[]> {
  const dbPolicies = await prisma.policy.findMany({
    where: {
      isActive: true,
      OR: [
        { provider: provider },
        { provider: 'all' },
      ],
    },
  });

  // Map DB policies to built-in policy definitions
  const activePolicyCodes = new Set(dbPolicies.map(p => p.code));
  
  return BUILT_IN_POLICIES.filter(p => activePolicyCodes.has(p.code));
}

/**
 * Run all active policies against a Terraform template
 */
export async function auditTemplate(
  content: string,
  provider: string,
  templateId?: string
): Promise<AuditResult> {
  // Parse the Terraform content
  const parsed = parseTerraform(content);

  // Get active policies for this provider
  const policies = await getActivePolicies(provider);

  // Create policy context
  const context: PolicyContext = {
    parsed,
    provider,
    rawContent: content,
    templateId,
  };

  // Run each policy and collect violations
  const violations: AuditResult['violations'] = [];
  let passedChecks = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const policy of policies) {
    try {
      const results = policy.check(context);

      if (results.length > 0) {
        violations.push({
          policyCode: policy.code,
          policyName: policy.name,
          category: policy.category,
          severity: policy.severity,
          results,
        });

        // Count by severity
        for (const result of results) {
          switch (policy.severity) {
            case 'CRITICAL':
              criticalCount++;
              break;
            case 'HIGH':
              highCount++;
              break;
            case 'MEDIUM':
              mediumCount++;
              break;
            case 'LOW':
              lowCount++;
              break;
            case 'INFO':
              infoCount++;
              break;
          }
        }
      } else {
        passedChecks++;
      }
    } catch (error) {
      console.error(`Error running policy ${policy.code}:`, error);
    }
  }

  const totalIssues = criticalCount + highCount + mediumCount + lowCount + infoCount;

  // Calculate score (0-100)
  // Critical issues heavily penalize, lower severity issues have less impact
  const maxScore = 100;
  const penalties = {
    critical: 25,
    high: 15,
    medium: 5,
    low: 2,
    info: 0,
  };

  let score = maxScore;
  score -= criticalCount * penalties.critical;
  score -= highCount * penalties.high;
  score -= mediumCount * penalties.medium;
  score -= lowCount * penalties.low;
  score = Math.max(0, Math.min(100, score));

  // Calculate estimated monthly cost
  const costBreakdown = await costService.analyzeTemplateCost(parsed.resources, provider === 'aws' ? 'us-east-1' : undefined);

  return {
    templateId: templateId || 'inline',
    violations,
    costBreakdown: {
      totalMonthly: costBreakdown.totalMonthly,
      byService: costBreakdown.byService,
    },
    summary: {
      totalIssues,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      passedChecks,
      score,
    },
    timestamp: new Date(),
  };
}

/**
 * Save audit result to database
 */
export async function saveAuditReport(
  templateId: string,
  result: AuditResult
): Promise<string> {
  // Create the audit report
  const report = await prisma.auditReport.create({
    data: {
      templateId,
      totalIssues: result.summary.totalIssues,
      criticalCount: result.summary.criticalCount,
      highCount: result.summary.highCount,
      mediumCount: result.summary.mediumCount,
      lowCount: result.summary.lowCount,
      passedChecks: result.summary.passedChecks,
      score: result.summary.score,
    },
  });

  // Save violations
  for (const violation of result.violations) {
    const dbPolicy = await prisma.policy.findUnique({
      where: { code: violation.policyCode },
    });

    if (dbPolicy) {
      for (const v of violation.results) {
        await prisma.violation.create({
          data: {
            templateId,
            policyId: dbPolicy.id,
            resourceRef: v.resourceRef,
            resourceType: v.resourceType,
            line: v.line,
            message: v.message,
            suggestion: v.suggestion,
            autoFixable: v.autoFixable,
          },
        });
      }
    }
  }

  return report.id;
}

/**
 * Get the latest audit report for a template
 */
export async function getLatestAuditReport(templateId: string) {
  const report = await prisma.auditReport.findFirst({
    where: { templateId },
    orderBy: { createdAt: 'desc' },
  });

  if (!report) return null;

  const violations = await prisma.violation.findMany({
    where: { templateId },
    include: { policy: true },
    orderBy: [
      { policy: { severity: 'asc' } },
      { createdAt: 'desc' },
    ],
  });

  return {
    ...report,
    violations,
  };
}

/**
 * List all policies with their status
 */
export async function listPolicies() {
  return prisma.policy.findMany({
    orderBy: [
      { category: 'asc' },
      { severity: 'asc' },
      { code: 'asc' },
    ],
  });
}

/**
 * Toggle a policy's active status
 */
export async function togglePolicy(policyId: string, isActive: boolean) {
  return prisma.policy.update({
    where: { id: policyId },
    data: { isActive },
  });
}
