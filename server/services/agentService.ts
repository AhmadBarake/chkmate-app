/**
 * Agent Service
 * Core orchestration for the Agentic Automation mode.
 * Coordinates audit analysis, remediation generation, change plan creation,
 * and template modification.
 */

import { PrismaClient } from '@prisma/client';
import { auditTemplate } from './policyEngine.js';
import {
  generateBatchFixes,
  validateFix,
  applyFix,
  Remediation,
} from './remediationService.js';
import { AuditResult } from '../lib/policies/types.js';

const prisma = new PrismaClient();

export interface ChangePlan {
  sessionId: string;
  templateId: string;
  originalScore: { security: number; cost: number };
  projectedScore: { security: number; cost: number };
  changes: AgentChange[];
  totalEstimatedSavings: number;
  auditResult: AuditResult;
}

export interface AgentChange {
  id: string;
  type: 'SECURITY_FIX' | 'COST_OPTIMIZATION' | 'BEST_PRACTICE';
  policyCode: string;
  title: string;
  description: string;
  severity: string;
  resourceRef: string;
  diff: { before: string; after: string };
  impact: {
    securityScoreChange: number;
    monthlyCostChange: number;
  };
  status: 'proposed' | 'accepted' | 'rejected' | 'applied';
}

/**
 * Run full agent analysis: audit + cost analysis + remediation generation.
 * Creates a ChangePlan with all proposed fixes.
 */
export async function analyzeAndPlan(
  userId: string,
  templateId: string,
  content: string,
  provider: string
): Promise<ChangePlan> {
  // Create the agent session
  const session = await prisma.agentSession.create({
    data: {
      userId,
      templateId,
      status: 'PLANNING',
    },
  });

  try {
    // Run the full audit
    const auditResult = await auditTemplate(content, provider, templateId);

    const originalSecurityScore = auditResult.summary.score;
    const originalCostEstimate = auditResult.costBreakdown?.totalMonthly || 0;

    // Generate fixes for all auto-fixable violations
    const remediations = await generateBatchFixes(
      content,
      auditResult.violations.map(v => ({
        policyCode: v.policyCode,
        policyName: v.policyName,
        severity: v.severity,
        category: v.category,
        results: v.results,
      }))
    );

    // Convert remediations to agent changes
    const changes: AgentChange[] = remediations.map(rem => ({
      id: rem.id,
      type: mapCategoryToChangeType(rem.category),
      policyCode: rem.policyCode,
      title: rem.title,
      description: rem.description,
      severity: rem.severity,
      resourceRef: rem.resourceRef,
      diff: rem.diff,
      impact: rem.impact,
      status: 'proposed' as const,
    }));

    // Calculate projected scores
    const totalSecurityImprovement = changes.reduce(
      (sum, c) => sum + c.impact.securityScoreChange, 0
    );
    const totalCostSavings = changes.reduce(
      (sum, c) => sum + Math.abs(c.impact.monthlyCostChange), 0
    );

    const projectedSecurityScore = Math.min(100, originalSecurityScore + totalSecurityImprovement);
    const projectedCost = Math.max(0, originalCostEstimate - totalCostSavings);

    const changePlan: ChangePlan = {
      sessionId: session.id,
      templateId,
      originalScore: { security: originalSecurityScore, cost: originalCostEstimate },
      projectedScore: { security: projectedSecurityScore, cost: projectedCost },
      changes,
      totalEstimatedSavings: totalCostSavings,
      auditResult,
    };

    // Update session with the plan
    await prisma.agentSession.update({
      where: { id: session.id },
      data: {
        status: 'REVIEWING',
        changePlan: changes as any,
        originalScore: { security: originalSecurityScore, cost: originalCostEstimate },
        projectedScore: { security: projectedSecurityScore, cost: projectedCost },
        totalSavings: totalCostSavings,
      },
    });

    return changePlan;
  } catch (error) {
    // Mark session as cancelled on error
    await prisma.agentSession.update({
      where: { id: session.id },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });
    throw error;
  }
}

/**
 * Apply accepted changes to a template.
 * Creates a new template version with the changes applied.
 */
export async function applyChanges(
  userId: string,
  sessionId: string,
  acceptedChangeIds: string[]
): Promise<{ updatedContent: string; versionId: string; appliedCount: number }> {
  // Get the session
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: { template: true },
  });

  if (!session) {
    throw new Error('Agent session not found');
  }

  if (session.userId !== userId) {
    throw new Error('Unauthorized: session belongs to another user');
  }

  if (session.status !== 'REVIEWING') {
    throw new Error(`Cannot apply changes: session is in ${session.status} state`);
  }

  // Update session to applying
  await prisma.agentSession.update({
    where: { id: sessionId },
    data: { status: 'APPLYING' },
  });

  try {
    const changes = (session.changePlan as unknown as AgentChange[]) || [];
    const acceptedChanges = changes.filter(c => acceptedChangeIds.includes(c.id));

    if (acceptedChanges.length === 0) {
      throw new Error('No valid changes to apply');
    }

    // Save the current content as a version before modifying
    const latestVersion = await prisma.templateVersion.findFirst({
      where: { templateId: session.templateId },
      orderBy: { version: 'desc' },
    });

    const currentVersionNum = latestVersion ? latestVersion.version : 0;

    // Save pre-change version if this is the first time
    if (currentVersionNum === 0) {
      await prisma.templateVersion.create({
        data: {
          templateId: session.templateId,
          version: 1,
          content: session.template.content,
          changeLog: 'Original template (pre-agent)',
          createdBy: 'user',
        },
      });
    }

    // Apply changes sequentially, validating each
    let currentContent = session.template.content;
    let appliedCount = 0;
    const appliedIds: string[] = [];

    for (const change of acceptedChanges) {
      const validation = validateFix(currentContent, change.diff);
      if (validation.valid) {
        currentContent = applyFix(currentContent, change.diff);
        appliedCount++;
        appliedIds.push(change.id);
      } else {
        console.warn(`Skipping change ${change.id}: ${validation.error}`);
      }
    }

    if (appliedCount === 0) {
      throw new Error('No changes could be applied (all failed validation)');
    }

    // Create new version with agent changes
    const newVersion = await prisma.templateVersion.create({
      data: {
        templateId: session.templateId,
        version: (currentVersionNum || 1) + 1,
        content: currentContent,
        changeLog: `Agent applied ${appliedCount} changes: ${appliedIds.map(id => {
          const change = acceptedChanges.find(c => c.id === id);
          return change?.policyCode;
        }).join(', ')}`,
        createdBy: 'agent',
      },
    });

    // Update the template content
    await prisma.template.update({
      where: { id: session.templateId },
      data: {
        content: currentContent,
        updatedAt: new Date(),
      },
    });

    // Mark session as completed
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        appliedChanges: appliedIds,
        completedAt: new Date(),
      },
    });

    return {
      updatedContent: currentContent,
      versionId: newVersion.id,
      appliedCount,
    };
  } catch (error) {
    // Revert session status on error
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { status: 'REVIEWING' },
    });
    throw error;
  }
}

/**
 * Cancel an agent session
 */
export async function cancelSession(userId: string, sessionId: string): Promise<void> {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or unauthorized');
  }

  await prisma.agentSession.update({
    where: { id: sessionId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });
}

/**
 * Get an agent session with its change plan
 */
export async function getSession(userId: string, sessionId: string) {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      template: {
        select: { id: true, name: true, provider: true },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or unauthorized');
  }

  return session;
}

/**
 * List agent sessions for a user
 */
export async function listSessions(userId: string, templateId?: string) {
  return prisma.agentSession.findMany({
    where: {
      userId,
      ...(templateId ? { templateId } : {}),
    },
    include: {
      template: {
        select: { id: true, name: true, provider: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Get template version history
 */
export async function getTemplateVersions(templateId: string) {
  return prisma.templateVersion.findMany({
    where: { templateId },
    orderBy: { version: 'desc' },
  });
}

/**
 * Restore a template to a specific version
 */
export async function restoreTemplateVersion(
  userId: string,
  templateId: string,
  versionId: string
): Promise<string> {
  // Verify ownership
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { project: { select: { userId: true } } },
  });

  if (!template || template.project.userId !== userId) {
    throw new Error('Template not found or unauthorized');
  }

  // Get the version to restore
  const version = await prisma.templateVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.templateId !== templateId) {
    throw new Error('Version not found for this template');
  }

  // Save current state as a new version before restoring
  const latestVersion = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { version: 'desc' },
  });

  await prisma.templateVersion.create({
    data: {
      templateId,
      version: (latestVersion?.version || 0) + 1,
      content: template.content,
      changeLog: `Pre-restore snapshot (before reverting to version ${version.version})`,
      createdBy: 'user',
    },
  });

  // Restore the template content
  await prisma.template.update({
    where: { id: templateId },
    data: { content: version.content, updatedAt: new Date() },
  });

  return version.content;
}

/**
 * Toggle agentic mode for a user
 */
export async function toggleAgenticMode(userId: string, enabled: boolean): Promise<boolean> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { agenticMode: enabled },
  });
  return user.agenticMode;
}

/**
 * Get agentic mode status for a user
 */
export async function getAgenticMode(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agenticMode: true },
  });
  return user?.agenticMode ?? false;
}

function mapCategoryToChangeType(category: string): AgentChange['type'] {
  switch (category) {
    case 'SECURITY': return 'SECURITY_FIX';
    case 'COST': return 'COST_OPTIMIZATION';
    default: return 'BEST_PRACTICE';
  }
}
