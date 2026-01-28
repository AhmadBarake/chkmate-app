import { ApiError, parseError, isApiError } from './errors';

/**
 * Base API URL - uses relative paths for same-origin requests
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Default request timeout (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Extended timeout for generation requests (2 minutes)
 */
const GENERATION_TIMEOUT = 120000;

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Make an API request with consistent error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = createTimeoutController(timeout);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // Server returned an error response
      const error: ApiError = {
        error: true,
        code: data.code || 'UNKNOWN',
        message: data.message || 'Request failed',
        details: data.details,
        requestId: data.requestId,
        status: res.status,
      };
      throw error;
    }

    return data as T;
  } catch (error) {
    // Re-throw API errors as-is
    if (isApiError(error)) {
      throw error;
    }

    // Parse and throw other errors
    throw parseError(error);
  }
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  templates?: Template[];
}

export async function fetchProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects');
}

export async function createProject(
  name: string,
  description: string,
  userId: string,
  email: string,
  userName?: string | null
): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description, userId, email, userName }),
  });
}

export async function fetchProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`);
}

export async function deleteProject(id: string): Promise<{ success: boolean; deleted: Project }> {
  return apiRequest<{ success: boolean; deleted: Project }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface Template {
  id: string;
  name: string;
  content: string;
  provider: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
}

export async function fetchTemplates(): Promise<Template[]> {
  return apiRequest<Template[]>('/templates');
}

export async function fetchTemplate(id: string): Promise<Template> {
  return apiRequest<Template>(`/templates/${id}`);
}

export async function createTemplate(
  projectId: string,
  name: string,
  content: string,
  provider: string
): Promise<Template> {
  return apiRequest<Template>('/templates', {
    method: 'POST',
    body: JSON.stringify({ projectId, name, content, provider }),
  });
}

export async function updateTemplate(
  id: string,
  data: { name?: string; content?: string; provider?: string }
): Promise<Template> {
  return apiRequest<Template>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; deleted: Template }> {
  return apiRequest<{ success: boolean; deleted: Template }>(`/templates/${id}`, {
    method: 'DELETE',
  });
}

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

export async function fetchTemplateDiff(id: string, content: string): Promise<DiffResult> {
  return apiRequest<DiffResult>(`/templates/${id}/diff`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ============================================================================
// GENERATION
// ============================================================================

export interface GeneratedFile {
  [filename: string]: string;
}

export interface CostBreakdown {
  resource: string;
  cost: number;
}

export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
}

export interface GenerationResult {
  files: GeneratedFile;
  cost: {
    total: number;
    breakdown: CostBreakdown[];
  };
  diagram: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  };
}

export async function generateTemplate(
  prompt: string,
  provider: string,
  connectionId?: string
): Promise<GenerationResult> {
  return apiRequest<GenerationResult>(
    '/generate',
    {
      method: 'POST',
      body: JSON.stringify({ prompt, provider, connectionId }),
    },
    GENERATION_TIMEOUT // Use extended timeout for generation
  );
}

// ============================================================================
// HEALTH
// ============================================================================

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/health');
}

// ============================================================================
// AUDIT & POLICIES
// ============================================================================

export type PolicyCategory = 'SECURITY' | 'COST' | 'RELIABILITY' | 'PERFORMANCE' | 'COMPLIANCE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Policy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  provider: string;
  category: PolicyCategory;
  severity: Severity;
  isBuiltIn: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ViolationResult {
  resourceRef: string;
  resourceType: string;
  line?: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  metadata?: Record<string, any>;
}

export interface AuditViolation {
  policyCode: string;
  policyName: string;
  category: PolicyCategory;
  severity: Severity;
  results: ViolationResult[];
}

export interface AuditSummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  passedChecks: number;
  score: number;
}

export interface AuditResult {
  templateId: string;
  violations: AuditViolation[];
  costBreakdown?: {
    totalMonthly: number;
    byService: Record<string, number>;
  };
  summary: AuditSummary;
  timestamp: string;
}

export async function runAudit(
  content: string,
  provider: string,
  templateId?: string
): Promise<AuditResult> {
  return apiRequest<AuditResult>('/audit', {
    method: 'POST',
    body: JSON.stringify({ content, provider, templateId }),
  });
}

export async function getAuditReport(templateId: string): Promise<AuditResult> {
  return apiRequest<AuditResult>(`/audit/${templateId}`);
}

export async function fetchPolicies(): Promise<Policy[]> {
  return apiRequest<Policy[]>('/policies');
}

export async function togglePolicyStatus(
  id: string,
  isActive: boolean
): Promise<Policy> {
  return apiRequest<Policy>(`/policies/${id}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

// ============================================================================
// CREDITS
// ============================================================================

export const CREDIT_COSTS = {
  GENERATION: 10,
  AUDIT: 5,
  COST_ANALYSIS: 5,
  CLOUD_SCAN: 20,
  RECOMMENDATION: 15,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditBalance {
  balance: number;
  costs: typeof CREDIT_COSTS;
  packs: {
    STARTER: { credits: number; price: number };
    PRO: { credits: number; price: number };
    GROWTH: { credits: number; price: number };
    SCALE: { credits: number; price: number };
  };
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface CreditUsageStats {
  currentBalance: number;
  lifetimeUsed: number;
  last30Days: {
    type: string;
    totalUsed: number;
    count: number;
  }[];
}

export interface CreditCheck {
  hasCredits: boolean;
  cost: number;
  balance: number;
}

export async function getCreditBalance(): Promise<CreditBalance> {
  return apiRequest<CreditBalance>('/credits/balance');
}

export async function getCreditHistory(limit?: number): Promise<CreditTransaction[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest<CreditTransaction[]>(`/credits/history${query}`);
}

export async function getCreditUsage(): Promise<CreditUsageStats> {
  return apiRequest<CreditUsageStats>('/credits/usage');
}

export async function checkCredits(action: CreditAction): Promise<CreditCheck> {
  return apiRequest<CreditCheck>('/credits/check', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function rechargeCredits(packId: string): Promise<{ sessionId: string; url: string }> {
  return apiRequest<{ sessionId: string; url: string }>('/credits/checkout', {
    method: 'POST',
    body: JSON.stringify({ packId }),
  });
}

// ============================================================================
// CLOUD SCANNER
// ============================================================================

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface SecurityIssue {
  resourceType: string;
  resourceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  recommendation: string;
  region?: string;
}

export interface CostOpportunity {
  resourceType: string;
  resourceId: string;
  currentCost: number;
  potentialSavings: number;
  recommendation: string;
}

export interface CloudScanResult {
  scannedRegion?: string;
  securityIssues: SecurityIssue[];
  costOpportunities: CostOpportunity[];
  costBreakdown?: {
    totalMonthly: number;
    byService: Record<string, number>;
  };
  costTrend?: Array<{ name: string; cost: number }>;
  errors?: string[]; // Scan errors (e.g. AccessDenied)
  summary: {
    totalResources: number;
    criticalIssues: number;
    highIssues: number;
    estimatedMonthlySavings: number;
  };
  timestamp: string;
  creditsRemaining?: number;
}

export async function validateCloudCredentials(credentials: AWSCredentials): Promise<{ isValid: boolean }> {
  return apiRequest<{ isValid: boolean }>('/cloud/validate', {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  });
}

export async function scanCloudAccount(credentials: AWSCredentials): Promise<CloudScanResult> {
  return apiRequest<CloudScanResult>('/cloud/scan', {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  });
}

export async function scanSavedConnection(connectionId: string, region?: string): Promise<CloudScanResult> {
  return apiRequest<CloudScanResult>(`/cloud/connections/${connectionId}/scan-report`, {
    method: 'POST',
    body: JSON.stringify({ region }),
  });
}
// ============================================================================
// CLOUD CONNECTIONS (MANAGED)
// ============================================================================

export interface CloudConnection {
  id: string;
  provider: string; // 'aws', 'azure', 'gcp'
  name: string;
  awsRoleArn?: string;
  status: 'PENDING' | 'ACTIVE' | 'FAILED' | 'DISCONNECTED';
  lastSyncAt?: string;
  createdAt: string;
  _count?: { resources: number };
}

export interface CloudResource {
  id: string;
  connectionId: string;
  resourceType: string;
  resourceId: string;
  name?: string;
  region: string;
  metadata: any;
  lastSyncedAt: string;
}

export async function fetchConnections(): Promise<CloudConnection[]> {
  return apiRequest<CloudConnection[]>('/cloud/connections');
}

export async function fetchConnectionResources(connectionId: string): Promise<CloudResource[]> {
  return apiRequest<CloudResource[]>(`/cloud/connections/${connectionId}/resources`);
}

// ----------------------------------------------------------------------------
// RECOMMENDATION API
// ----------------------------------------------------------------------------

export interface Recommendation {
  id: string;
  connectionId: string;
  type: 'COST' | 'SECURITY' | 'PERFORMANCE' | 'RELIABILITY';
  title: string;
  description: string;
  impact: {
      savings?: number;
      risk?: string;
      performanceGain?: string;
  };
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'APPLIED' | 'DISMISSED';
  resourceId?: string;
  createdAt: string;
}

export async function generateRecommendations(connectionId: string): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/cloud/connections/${connectionId}/recommendations`, {
        method: 'POST'
    });
}

export async function fetchRecommendations(connectionId: string): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/cloud/connections/${connectionId}/recommendations`);
}

export async function getAWSSetupDetails(): Promise<{ externalId: string; setupUrl: string; hostAccountId: string; templateYaml: string }> {
  return apiRequest<{ externalId: string; setupUrl: string; hostAccountId: string; templateYaml: string }>('/cloud/aws/setup', {
    method: 'POST',
  });
}

export async function connectAWS(data: {
  name: string;
  roleArn: string;
  externalId: string;
}): Promise<CloudConnection> {
  return apiRequest<CloudConnection>('/cloud/aws/connect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function syncConnection(id: string, region?: string): Promise<CloudConnection> {
  return apiRequest<CloudConnection>(`/cloud/connections/${id}/sync`, {
    method: 'POST',
    body: JSON.stringify({ region }),
  });
}

export async function deleteConnection(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/cloud/connections/${id}`, {
    method: 'DELETE',
  });
}
