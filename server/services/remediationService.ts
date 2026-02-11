/**
 * Remediation Service
 * AI-powered fix generation for Terraform template violations.
 * Generates HCL code patches to resolve security and cost policy violations.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseTerraform } from '../lib/terraformParser.js';
import { PolicyResult } from '../lib/policies/types.js';

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set. AI-powered remediation will not work.');
}
const genAI = new GoogleGenerativeAI(apiKey);

export interface RemediationRequest {
  templateContent: string;
  policyCode: string;
  policyName: string;
  severity: string;
  category: string;
  violation: PolicyResult;
}

export interface Remediation {
  id: string;
  policyCode: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  resourceRef: string;
  diff: {
    before: string;
    after: string;
  };
  impact: {
    securityScoreChange: number;
    monthlyCostChange: number;
  };
  status: 'proposed' | 'accepted' | 'rejected' | 'applied';
}

// Predefined fix templates for common auto-fixable violations
const STATIC_FIXES: Record<string, (violation: PolicyResult, templateContent: string) => { before: string; after: string } | null> = {
  SEC001: (violation, content) => {
    // S3 public access block - add new resource after the bucket
    const parts = violation.resourceRef.split('.');
    const bucketName = parts.length > 1 ? parts[1] : parts[0];
    const before = '';
    const after = `
resource "aws_s3_bucket_public_access_block" "${bucketName}_public_access" {
  bucket = aws_s3_bucket.${bucketName}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`;
    return { before, after: after.trim() };
  },

  SEC004: (violation, content) => {
    // EBS encryption - add encryption = true to the resource
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    // Insert encryption = true before the closing brace
    const closingBraceIdx = before.lastIndexOf('}');
    const after = before.slice(0, closingBraceIdx) + '  encrypted = true\n' + before.slice(closingBraceIdx);
    return { before, after };
  },

  SEC005: (violation, content) => {
    // IAM wildcard actions - suggest restricting
    // This needs AI assistance as the specific actions depend on context
    return null;
  },

  SEC012: (violation, content) => {
    // RDS encryption at rest
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    const closingBraceIdx = before.lastIndexOf('}');
    const after = before.slice(0, closingBraceIdx) + '  storage_encrypted = true\n' + before.slice(closingBraceIdx);
    return { before, after };
  },

  SEC013: (violation, content) => {
    // RDS deletion protection
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    const closingBraceIdx = before.lastIndexOf('}');
    const after = before.slice(0, closingBraceIdx) + '  deletion_protection = true\n' + before.slice(closingBraceIdx);
    return { before, after };
  },

  SEC014: (violation, content) => {
    // DynamoDB encryption
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    const closingBraceIdx = before.lastIndexOf('}');
    const after = before.slice(0, closingBraceIdx) +
      '\n  server_side_encryption {\n    enabled = true\n  }\n' +
      before.slice(closingBraceIdx);
    return { before, after };
  },

  SEC018: (violation, content) => {
    // IMDSv2 enforcement
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    const closingBraceIdx = before.lastIndexOf('}');
    const after = before.slice(0, closingBraceIdx) +
      '\n  metadata_options {\n    http_tokens = "required"\n    http_endpoint = "enabled"\n  }\n' +
      before.slice(closingBraceIdx);
    return { before, after };
  },

  COST005: (violation, content) => {
    // GP2 to GP3 migration
    const resourceRef = violation.resourceRef;
    const parsed = parseTerraform(content);
    const resource = parsed.resources.find(r => r.fullName === resourceRef);
    if (!resource) return null;

    const before = resource.rawBlock;
    const after = before.replace(/volume_type\s*=\s*"gp2"/, 'volume_type = "gp3"');
    if (before === after) return null;
    return { before, after };
  },
};

/**
 * Generate a fix for a single violation, using static templates where possible
 * and falling back to AI generation for complex cases.
 */
export async function generateFix(request: RemediationRequest): Promise<Remediation> {
  const { templateContent, policyCode, policyName, severity, category, violation } = request;

  // Try static fix first
  const staticFix = STATIC_FIXES[policyCode]?.(violation, templateContent);

  let diff: { before: string; after: string };
  let description: string;

  if (staticFix) {
    diff = staticFix;
    description = violation.suggestion || `Apply automated fix for ${policyName}`;
  } else {
    // Fall back to AI-generated fix
    const aiResult = await generateAIFix(templateContent, violation, policyCode, policyName);
    diff = aiResult.diff;
    description = aiResult.description;
  }

  // Estimate impact
  const impact = estimateImpact(policyCode, severity, category, violation);

  return {
    id: `fix-${policyCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    policyCode,
    title: `Fix: ${policyName}`,
    description,
    severity,
    category,
    resourceRef: violation.resourceRef,
    diff,
    impact,
    status: 'proposed',
  };
}

/**
 * Generate a fix using the Gemini AI model
 */
async function generateAIFix(
  templateContent: string,
  violation: PolicyResult,
  policyCode: string,
  policyName: string
): Promise<{ diff: { before: string; after: string }; description: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

  const prompt = `You are a Terraform security and cost optimization expert. Given the following Terraform template and policy violation, generate the minimal code change needed to fix the violation.

POLICY: ${policyCode} - ${policyName}
VIOLATION: ${violation.message}
RESOURCE: ${violation.resourceRef}
SUGGESTION: ${violation.suggestion || 'None provided'}

TEMPLATE:
\`\`\`hcl
${templateContent}
\`\`\`

Respond in this exact JSON format only, no markdown or extra text:
{
  "before": "the exact lines of code to replace (or empty string if adding new code)",
  "after": "the corrected/new code",
  "description": "brief explanation of what was changed and why"
}

Rules:
- Make the MINIMUM change necessary
- The "before" field must be an exact substring of the template (or empty if adding new resource)
- Preserve existing formatting and indentation
- Do not modify unrelated resources
- Ensure the fix resolves the specific violation`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      diff: {
        before: parsed.before || '',
        after: parsed.after || '',
      },
      description: parsed.description || `AI-generated fix for ${policyName}`,
    };
  } catch (error) {
    console.error(`AI fix generation failed for ${policyCode}:`, error);
    // Return the suggestion as a manual fix
    return {
      diff: {
        before: '',
        after: `# TODO: ${violation.suggestion || violation.message}`,
      },
      description: violation.suggestion || `Manual fix required for ${policyName}`,
    };
  }
}

/**
 * Validate that a generated fix produces syntactically valid Terraform
 */
export function validateFix(
  originalContent: string,
  diff: { before: string; after: string }
): { valid: boolean; error?: string; resultContent: string } {
  try {
    let resultContent: string;

    if (diff.before === '') {
      // Adding new code - append to the end
      resultContent = originalContent + '\n\n' + diff.after;
    } else {
      // Replacing existing code
      if (!originalContent.includes(diff.before)) {
        return { valid: false, error: 'Before content not found in template', resultContent: originalContent };
      }
      resultContent = originalContent.replace(diff.before, diff.after);
    }

    // Try to parse the result to check basic structural validity
    const parsed = parseTerraform(resultContent);

    // Basic checks: should have at least as many resources as before
    const originalParsed = parseTerraform(originalContent);
    if (parsed.resources.length < originalParsed.resources.length) {
      return { valid: false, error: 'Fix removed resources from the template', resultContent };
    }

    return { valid: true, resultContent };
  } catch (error) {
    return {
      valid: false,
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      resultContent: originalContent,
    };
  }
}

/**
 * Apply a validated fix to template content
 */
export function applyFix(
  templateContent: string,
  diff: { before: string; after: string }
): string {
  if (diff.before === '') {
    return templateContent + '\n\n' + diff.after;
  }
  return templateContent.replace(diff.before, diff.after);
}

/**
 * Generate fixes for multiple violations in batch
 */
export async function generateBatchFixes(
  templateContent: string,
  violations: Array<{
    policyCode: string;
    policyName: string;
    severity: string;
    category: string;
    results: PolicyResult[];
  }>
): Promise<Remediation[]> {
  const remediations: Remediation[] = [];

  for (const violation of violations) {
    for (const result of violation.results) {
      if (!result.autoFixable) continue;

      try {
        const remediation = await generateFix({
          templateContent,
          policyCode: violation.policyCode,
          policyName: violation.policyName,
          severity: violation.severity,
          category: violation.category,
          violation: result,
        });
        remediations.push(remediation);
      } catch (error) {
        console.error(`Failed to generate fix for ${violation.policyCode} on ${result.resourceRef}:`, error);
      }
    }
  }

  return remediations;
}

/**
 * Estimate the security and cost impact of a fix
 */
function estimateImpact(
  policyCode: string,
  severity: string,
  category: string,
  violation: PolicyResult
): { securityScoreChange: number; monthlyCostChange: number } {
  let securityScoreChange = 0;
  let monthlyCostChange = 0;

  if (category === 'SECURITY') {
    switch (severity) {
      case 'CRITICAL': securityScoreChange = 25; break;
      case 'HIGH': securityScoreChange = 15; break;
      case 'MEDIUM': securityScoreChange = 5; break;
      case 'LOW': securityScoreChange = 2; break;
    }
  }

  if (category === 'COST') {
    // Extract savings from violation metadata if available
    const savings = violation.metadata?.estimatedSavings || violation.metadata?.monthlySavings || 0;
    monthlyCostChange = -savings;
  }

  return { securityScoreChange, monthlyCostChange };
}
