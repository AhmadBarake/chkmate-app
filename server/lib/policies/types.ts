/**
 * Policy Types and Interfaces
 */

import { ParsedTerraform } from '../terraformParser.js';

export type PolicyCategory = 'SECURITY' | 'COST' | 'RELIABILITY' | 'PERFORMANCE' | 'COMPLIANCE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface PolicyContext {
  parsed: ParsedTerraform;
  provider: string;
  rawContent: string;
  templateId?: string;
  projectId?: string;
}

export interface PolicyResult {
  resourceRef: string;       // e.g., "aws_s3_bucket.main"
  resourceType: string;      // e.g., "aws_s3_bucket"
  line?: number;             // Line number in the template
  message: string;           // Human-readable issue description
  suggestion?: string;       // How to fix the issue
  autoFixable: boolean;      // Whether we can auto-fix this
  metadata?: Record<string, any>; // Additional context (costs, alternatives, etc.)
}

export interface PolicyDefinition {
  code: string;              // e.g., "SEC001"
  name: string;              // e.g., "S3 Bucket Public Access Blocked"
  description: string;       // Detailed description
  provider: string;          // "aws", "azure", "gcp", or "all"
  category: PolicyCategory;
  severity: Severity;
  check: (context: PolicyContext) => PolicyResult[];
}

export interface AuditResult {
  templateId: string;
  violations: {
    policyCode: string;
    policyName: string;
    category: PolicyCategory;
    severity: Severity;
    results: PolicyResult[];
  }[];
  costBreakdown?: {
    totalMonthly: number;
    byService: Record<string, number>;
  };
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    passedChecks: number;
    score: number;
  };
  timestamp: Date;
}
