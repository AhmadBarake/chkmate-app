import { createTwoFilesPatch } from 'diff';
import { auditTemplate } from '../services/policyEngine.js';
import { costService } from '../services/costService.js';
import { parseTerraform } from './terraformParser.js';

export interface DiffResult {
    patch: string;
    costDelta: number;
    securityDelta: {
        newViolations: any[];
        fixedViolations: any[];
        totalIssuesChange: number;
        scoreChange: number;
    };
}

/**
 * Compare two Terraform templates and calculate cost/security deltas
 */
export async function compareTemplates(
    oldContent: string,
    newContent: string,
    provider: string,
    oldId?: string,
    newId?: string
): Promise<DiffResult> {
    // 1. Generate visual patch
    const patch = createTwoFilesPatch('Current Version', 'New Version', oldContent, newContent);

    // 2. Security Delta Analysis
    const oldAudit = await auditTemplate(oldContent, provider, oldId);
    const newAudit = await auditTemplate(newContent, provider, newId);

    // Create sets of "policyCode:resourceRef" for comparison
    const getViolationKeys = (audit: any) => {
        const keys = new Set<string>();
        for (const violation of audit.violations) {
            for (const result of violation.results) {
                keys.add(`${violation.policyCode}:${result.resourceRef}`);
            }
        }
        return keys;
    };

    const oldVioKeys = getViolationKeys(oldAudit);
    const newVioKeys = getViolationKeys(newAudit);

    const newViolations: any[] = [];
    for (const v of newAudit.violations) {
        const filteredResults = v.results.filter((r: any) => !oldVioKeys.has(`${v.policyCode}:${r.resourceRef}`));
        if (filteredResults.length > 0) {
            newViolations.push({ ...v, results: filteredResults });
        }
    }

    const fixedViolations: any[] = [];
    for (const v of oldAudit.violations) {
        const filteredResults = v.results.filter((r: any) => !newVioKeys.has(`${v.policyCode}:${r.resourceRef}`));
        if (filteredResults.length > 0) {
            fixedViolations.push({ ...v, results: filteredResults });
        }
    }

    // 3. Cost Delta Analysis
    const oldResources = parseTerraform(oldContent).resources;
    const newResources = parseTerraform(newContent).resources;

    const oldCost = await costService.analyzeTemplateCost(oldResources, 'us-east-1');
    const newCost = await costService.analyzeTemplateCost(newResources, 'us-east-1');

    return {
        patch,
        costDelta: newCost.totalMonthly - oldCost.totalMonthly,
        securityDelta: {
            newViolations,
            fixedViolations,
            totalIssuesChange: newAudit.summary.totalIssues - oldAudit.summary.totalIssues,
            scoreChange: newAudit.summary.score - oldAudit.summary.score
        }
    };
}
