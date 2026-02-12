import { ApiError, parseError, isApiError } from './errors';

/**
 * Base API URL - uses relative paths for same-origin requests
 */
/**
 * Base API URL - uses relative paths for same-origin requests
 * Ensures /api prefix is present when using absolute URLs
 */
const resolveApiBase = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  if (url.endsWith('/api')) return url;
  return url.endsWith('/') ? `${url}api` : `${url}/api`;
};

const API_BASE = resolveApiBase();

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
  timeout: number = DEFAULT_TIMEOUT,
  token?: string | null
): Promise<T> {
  const controller = createTimeoutController(timeout);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
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

export async function fetchProjects(token?: string | null): Promise<Project[]> {
  return apiRequest<Project[]>('/projects', {}, DEFAULT_TIMEOUT, token);
}

export async function createProject(
  name: string,
  description: string,
  userId: string,
  email: string,
  userName?: string | null,
  token?: string | null
): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description, userId, email, userName }),
  }, DEFAULT_TIMEOUT, token);
}

export async function fetchProject(id: string, token?: string | null): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {}, DEFAULT_TIMEOUT, token);
}

export async function deleteProject(id: string, token?: string | null): Promise<{ success: boolean; deleted: Project }> {
  return apiRequest<{ success: boolean; deleted: Project }>(`/projects/${id}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
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

export async function fetchTemplates(token?: string | null): Promise<Template[]> {
  return apiRequest<Template[]>('/templates', {}, DEFAULT_TIMEOUT, token);
}

export async function fetchTemplate(id: string, token?: string | null): Promise<Template> {
  return apiRequest<Template>(`/templates/${id}`, {}, DEFAULT_TIMEOUT, token);
}

export async function createTemplate(
  projectId: string,
  name: string,
  content: string,
  provider: string,
  token?: string | null
): Promise<Template> {
  return apiRequest<Template>('/templates', {
    method: 'POST',
    body: JSON.stringify({ projectId, name, content, provider }),
  }, DEFAULT_TIMEOUT, token);
}

export async function updateTemplate(
  id: string,
  data: { name?: string; content?: string; provider?: string },
  token?: string | null
): Promise<Template> {
  return apiRequest<Template>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, DEFAULT_TIMEOUT, token);
}

export async function deleteTemplate(id: string, token?: string | null): Promise<{ success: boolean; deleted: Template }> {
  return apiRequest<{ success: boolean; deleted: Template }>(`/templates/${id}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
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

export async function fetchTemplateDiff(id: string, content: string, token?: string | null): Promise<DiffResult> {
  return apiRequest<DiffResult>(`/templates/${id}/diff`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }, DEFAULT_TIMEOUT, token);
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
  connectionId?: string,
  token?: string | null
): Promise<GenerationResult> {
  return apiRequest<GenerationResult>(
    '/generate',
    {
      method: 'POST',
      body: JSON.stringify({ prompt, provider, connectionId }),
    },
    GENERATION_TIMEOUT, // Use extended timeout for generation
    token
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
  templateId?: string,
  token?: string | null
): Promise<AuditResult> {
  return apiRequest<AuditResult>('/audit', {
    method: 'POST',
    body: JSON.stringify({ content, provider, templateId }),
  }, DEFAULT_TIMEOUT, token);
}

export async function getAuditReport(templateId: string, token?: string | null): Promise<AuditResult> {
  return apiRequest<AuditResult>(`/audit/${templateId}`, {}, DEFAULT_TIMEOUT, token);
}

export async function fetchPolicies(token?: string | null): Promise<Policy[]> {
  return apiRequest<Policy[]>('/policies', {}, DEFAULT_TIMEOUT, token);
}

export async function togglePolicyStatus(
  id: string,
  isActive: boolean,
  token?: string | null
): Promise<Policy> {
  return apiRequest<Policy>(`/policies/${id}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }, DEFAULT_TIMEOUT, token);
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
  AGENT_ANALYSIS: 25,
  DEPLOY_PLAN: 15,
  DEPLOY_APPLY: 30,
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

export async function getCreditBalance(token?: string | null): Promise<CreditBalance> {
  return apiRequest<CreditBalance>('/credits/balance', {}, DEFAULT_TIMEOUT, token);
}

export async function getCreditHistory(limit?: number, token?: string | null): Promise<CreditTransaction[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest<CreditTransaction[]>(`/credits/history${query}`, {}, DEFAULT_TIMEOUT, token);
}

export async function getCreditUsage(token?: string | null): Promise<CreditUsageStats> {
  return apiRequest<CreditUsageStats>('/credits/usage', {}, DEFAULT_TIMEOUT, token);
}

export async function checkCredits(action: CreditAction, token?: string | null): Promise<CreditCheck> {
  return apiRequest<CreditCheck>('/credits/check', {
    method: 'POST',
    body: JSON.stringify({ action }),
  }, DEFAULT_TIMEOUT, token);
}

export async function rechargeCredits(packId: string, token?: string | null): Promise<{ sessionId: string; url: string }> {
  return apiRequest<{ sessionId: string; url: string }>('/credits/checkout', {
    method: 'POST',
    body: JSON.stringify({ packId }),
  }, DEFAULT_TIMEOUT, token);
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

export interface IAMDetails {
  users: Array<{ userName: string; createDate?: string; passwordLastUsed?: string }>;
  roles: Array<{ roleName: string; createDate?: string }>;
  policies: Array<{ policyName: string; attachmentCount?: number }>;
}

export interface LambdaIssue extends SecurityIssue {
    functionName: string;
    runtime: string;
}

export interface DynamoDBIssue extends SecurityIssue {
    tableName: string;
}

export interface ELBIssue extends SecurityIssue {
    loadBalancerName: string;
}

export interface EKSIssue extends SecurityIssue {
    clusterName: string;
}

export interface CloudScanResult {
  scannedRegion?: string;
  securityIssues: SecurityIssue[];
  costOpportunities: CostOpportunity[];
  
  // New Detailed Fields
  iamDetails?: IAMDetails;
  lambdaIssues?: LambdaIssue[];
  dynamoDBIssues?: DynamoDBIssue[];
  elbIssues?: ELBIssue[];
  eksIssues?: EKSIssue[];
  costForecast?: number;

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

export async function validateCloudCredentials(credentials: AWSCredentials, token?: string | null): Promise<{ isValid: boolean }> {
  return apiRequest<{ isValid: boolean }>('/cloud/validate', {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  }, DEFAULT_TIMEOUT, token);
}

export async function scanCloudAccount(credentials: AWSCredentials, token?: string | null): Promise<CloudScanResult> {
  return apiRequest<CloudScanResult>('/cloud/scan', {
    method: 'POST',
    body: JSON.stringify({ credentials }),
  }, DEFAULT_TIMEOUT, token);
}

export async function scanSavedConnection(connectionId: string, region?: string, token?: string | null): Promise<CloudScanResult> {
  return apiRequest<CloudScanResult>(`/cloud/connections/${connectionId}/scan-report`, {
    method: 'POST',
    body: JSON.stringify({ region }),
  }, DEFAULT_TIMEOUT, token);
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

export async function fetchConnections(token?: string | null): Promise<CloudConnection[]> {
  return apiRequest<CloudConnection[]>('/cloud/connections', {}, DEFAULT_TIMEOUT, token);
}

export async function fetchConnectionResources(connectionId: string, token?: string | null): Promise<CloudResource[]> {
  return apiRequest<CloudResource[]>(`/cloud/connections/${connectionId}/resources`, {}, DEFAULT_TIMEOUT, token);
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

export async function generateRecommendations(connectionId: string, token?: string | null): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/cloud/connections/${connectionId}/recommendations`, {
        method: 'POST'
    }, DEFAULT_TIMEOUT, token);
}

export async function fetchRecommendations(connectionId: string, token?: string | null): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/cloud/connections/${connectionId}/recommendations`, {}, DEFAULT_TIMEOUT, token);
}

export async function dismissRecommendation(connectionId: string, recId: string, token?: string | null): Promise<Recommendation> {
    return apiRequest<Recommendation>(`/cloud/connections/${connectionId}/recommendations/${recId}/dismiss`, {
        method: 'PATCH',
    }, DEFAULT_TIMEOUT, token);
}

export async function getAWSSetupDetails(token?: string | null): Promise<{ externalId: string; setupUrl: string; hostAccountId: string; templateYaml: string }> {
  return apiRequest<{ externalId: string; setupUrl: string; hostAccountId: string; templateYaml: string }>('/cloud/aws/setup', {
    method: 'POST',
  }, DEFAULT_TIMEOUT, token);
}

export async function connectAWS(data: {
  name: string;
  roleArn: string;
  externalId: string;
}, token?: string | null): Promise<CloudConnection> {
  return apiRequest<CloudConnection>('/cloud/aws/connect', {
    method: 'POST',
    body: JSON.stringify(data),
  }, DEFAULT_TIMEOUT, token);
}

export async function syncConnection(id: string, region?: string, token?: string | null): Promise<CloudConnection> {
  return apiRequest<CloudConnection>(`/cloud/connections/${id}/sync`, {
    method: 'POST',
    body: JSON.stringify({ region }),
  }, DEFAULT_TIMEOUT, token);
}

export async function deleteConnection(id: string, token?: string | null): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/cloud/connections/${id}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
}

// ============================================================================
// AGENTIC AUTOMATION
// ============================================================================

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

export interface ChangePlan {
  sessionId: string;
  templateId: string;
  originalScore: { security: number; cost: number };
  projectedScore: { security: number; cost: number };
  changes: AgentChange[];
  totalEstimatedSavings: number;
  auditResult: AuditResult;
}

export interface AgentSession {
  id: string;
  userId: string;
  templateId: string;
  status: 'PLANNING' | 'REVIEWING' | 'APPLYING' | 'COMPLETED' | 'CANCELLED';
  changePlan: AgentChange[] | null;
  appliedChanges: string[] | null;
  originalScore: { security: number; cost: number } | null;
  projectedScore: { security: number; cost: number } | null;
  totalSavings: number;
  createdAt: string;
  completedAt: string | null;
  template?: { id: string; name: string; provider: string };
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  changeLog: string | null;
  createdBy: string;
  createdAt: string;
}

export async function getAgenticMode(token?: string | null): Promise<{ enabled: boolean }> {
  return apiRequest<{ enabled: boolean }>('/agent/mode', {}, DEFAULT_TIMEOUT, token);
}

export async function setAgenticMode(enabled: boolean, token?: string | null): Promise<{ enabled: boolean }> {
  return apiRequest<{ enabled: boolean }>('/agent/mode', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  }, DEFAULT_TIMEOUT, token);
}

export async function runAgentAnalysis(
  templateId: string,
  content: string,
  provider: string,
  token?: string | null
): Promise<ChangePlan> {
  return apiRequest<ChangePlan>('/agent/analyze', {
    method: 'POST',
    body: JSON.stringify({ templateId, content, provider }),
  }, GENERATION_TIMEOUT, token);
}

export async function applyAgentChanges(
  sessionId: string,
  acceptedChangeIds: string[],
  token?: string | null
): Promise<{ updatedContent: string; versionId: string; appliedCount: number }> {
  return apiRequest<{ updatedContent: string; versionId: string; appliedCount: number }>('/agent/apply', {
    method: 'POST',
    body: JSON.stringify({ sessionId, acceptedChangeIds }),
  }, DEFAULT_TIMEOUT, token);
}

export async function fetchAgentSessions(templateId?: string, token?: string | null): Promise<AgentSession[]> {
  const query = templateId ? `?templateId=${templateId}` : '';
  return apiRequest<AgentSession[]>(`/agent/sessions${query}`, {}, DEFAULT_TIMEOUT, token);
}

export async function fetchAgentSession(sessionId: string, token?: string | null): Promise<AgentSession> {
  return apiRequest<AgentSession>(`/agent/sessions/${sessionId}`, {}, DEFAULT_TIMEOUT, token);
}

export async function cancelAgentSession(sessionId: string, token?: string | null): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/agent/sessions/${sessionId}/cancel`, {
    method: 'POST',
  }, DEFAULT_TIMEOUT, token);
}

export async function fetchTemplateVersions(templateId: string, token?: string | null): Promise<TemplateVersion[]> {
  return apiRequest<TemplateVersion[]>(`/templates/${templateId}/versions`, {}, DEFAULT_TIMEOUT, token);
}

export async function restoreTemplateVersion(
  templateId: string,
  versionId: string,
  token?: string | null
): Promise<{ content: string }> {
  return apiRequest<{ content: string }>(`/templates/${templateId}/versions/${versionId}/restore`, {
    method: 'POST',
  }, DEFAULT_TIMEOUT, token);
}

// ============================================================================
// DEPLOYMENTS
// ============================================================================

export interface DeploymentCredential {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: { deployments: number };
}

export interface DeploymentPlanResult {
  deploymentId: string;
  planOutput: {
    summary: { add: number; change: number; destroy: number };
    output: string;
  };
  summary: { add: number; change: number; destroy: number };
  estimatedCost: number | null;
  auditScore: number;
}

export interface DeploymentRecord {
  id: string;
  userId: string;
  templateId: string;
  credentialId: string;
  status: 'PLANNING' | 'PLAN_READY' | 'APPLYING' | 'SUCCEEDED' | 'FAILED' | 'DESTROYING' | 'DESTROYED';
  planOutput: any;
  applyOutput: string | null;
  resourceCount: number;
  estimatedCost: number | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  template?: { id: string; name: string; provider: string };
  credential?: { id: string; name: string };
}

export async function getDeploymentSetup(token?: string | null): Promise<{ externalId: string; templateYaml: string }> {
  return apiRequest<{ externalId: string; templateYaml: string }>('/deploy/setup', {
    method: 'POST',
  }, DEFAULT_TIMEOUT, token);
}

export async function createDeploymentCredential(
  name: string,
  roleArn: string,
  token?: string | null
): Promise<DeploymentCredential> {
  return apiRequest<DeploymentCredential>('/deploy/credentials', {
    method: 'POST',
    body: JSON.stringify({ name, roleArn }),
  }, DEFAULT_TIMEOUT, token);
}

export async function fetchDeploymentCredentials(token?: string | null): Promise<DeploymentCredential[]> {
  return apiRequest<DeploymentCredential[]>('/deploy/credentials', {}, DEFAULT_TIMEOUT, token);
}

export async function deleteDeploymentCredential(credentialId: string, token?: string | null): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/deploy/credentials/${credentialId}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
}

export async function runDeploymentPlan(
  templateId: string,
  credentialId: string,
  region?: string,
  token?: string | null
): Promise<DeploymentPlanResult> {
  return apiRequest<DeploymentPlanResult>('/deploy/plan', {
    method: 'POST',
    body: JSON.stringify({ templateId, credentialId, region }),
  }, GENERATION_TIMEOUT, token);
}

export async function runDeploymentApply(deploymentId: string, token?: string | null): Promise<{ success: boolean; output: string; resourceCount: number }> {
  return apiRequest<{ success: boolean; output: string; resourceCount: number }>(`/deploy/apply/${deploymentId}`, {
    method: 'POST',
  }, GENERATION_TIMEOUT, token);
}

export async function runDeploymentDestroy(deploymentId: string, token?: string | null): Promise<{ success: boolean; output: string }> {
  return apiRequest<{ success: boolean; output: string }>(`/deploy/destroy/${deploymentId}`, {
    method: 'POST',
  }, GENERATION_TIMEOUT, token);
}

export async function fetchDeployment(deploymentId: string, token?: string | null): Promise<DeploymentRecord> {
  return apiRequest<DeploymentRecord>(`/deploy/${deploymentId}`, {}, DEFAULT_TIMEOUT, token);
}

export async function fetchDeployments(templateId?: string, token?: string | null): Promise<DeploymentRecord[]> {
  const query = templateId ? `?templateId=${templateId}` : '';
  return apiRequest<DeploymentRecord[]>(`/deploy${query}`, {}, DEFAULT_TIMEOUT, token);
}

// ============================================================================
// GITHUB INTEGRATION
// ============================================================================

export interface GitHubConnectionInfo {
  id: string;
  githubUsername: string;
  avatarUrl: string | null;
  createdAt: string;
  _count: { repositories: number };
}

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  htmlUrl: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  sha: string;
}

export interface TemplateRepoLinkInfo {
  id: string;
  templateId: string;
  repoId: string;
  repoFullName?: string;
  branch: string;
  filePath: string;
  syncDirection: 'PUSH' | 'PULL' | 'BIDIRECTIONAL';
  autoSync: boolean;
  autoDeploy: boolean;
  lastPushAt: string | null;
  lastPullAt: string | null;
  repo?: {
    id: string;
    fullName: string;
    repoOwner: string;
    repoName: string;
    defaultBranch: string;
    isPrivate: boolean;
    lastCommitSha: string | null;
    lastSyncedAt: string | null;
  };
}

export interface GitHubPushResult {
  commitSha: string;
  commitUrl: string;
}

export interface GitHubCreatedRepo {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
  htmlUrl: string;
}

// Connect GitHub account
export async function connectGitHubAccount(accessToken: string, token?: string | null): Promise<{ id: string; githubUsername: string; avatarUrl: string | null }> {
  return apiRequest('/github/connect', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  }, DEFAULT_TIMEOUT, token);
}

// List GitHub connections
export async function fetchGitHubConnections(token?: string | null): Promise<GitHubConnectionInfo[]> {
  return apiRequest<GitHubConnectionInfo[]>('/github/connections', {}, DEFAULT_TIMEOUT, token);
}

// Disconnect GitHub
export async function disconnectGitHubAccount(connectionId: string, token?: string | null): Promise<{ success: boolean }> {
  return apiRequest(`/github/connections/${connectionId}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
}

// List repos from connected account
export async function fetchGitHubRepos(connectionId: string, token?: string | null): Promise<GitHubRepoInfo[]> {
  return apiRequest<GitHubRepoInfo[]>(`/github/connections/${connectionId}/repos`, {}, DEFAULT_TIMEOUT, token);
}

// Create new repo
export async function createGitHubRepo(
  connectionId: string,
  name: string,
  description: string,
  isPrivate: boolean,
  token?: string | null,
): Promise<GitHubCreatedRepo> {
  return apiRequest<GitHubCreatedRepo>(`/github/connections/${connectionId}/repos`, {
    method: 'POST',
    body: JSON.stringify({ name, description, isPrivate }),
  }, DEFAULT_TIMEOUT, token);
}

// List branches
export async function fetchRepoBranches(connectionId: string, owner: string, repo: string, token?: string | null): Promise<GitHubBranch[]> {
  return apiRequest<GitHubBranch[]>(`/github/connections/${connectionId}/repos/${owner}/${repo}/branches`, {}, DEFAULT_TIMEOUT, token);
}

// List files
export async function fetchRepoFiles(connectionId: string, owner: string, repo: string, path?: string, branch?: string, token?: string | null): Promise<GitHubFile[]> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (branch) params.set('branch', branch);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<GitHubFile[]>(`/github/connections/${connectionId}/repos/${owner}/${repo}/files${query}`, {}, DEFAULT_TIMEOUT, token);
}

// Link template to repo
export async function linkTemplateToGitHub(
  templateId: string,
  connectionId: string,
  repoFullName: string,
  branch?: string,
  filePath?: string,
  syncDirection?: string,
  token?: string | null,
): Promise<TemplateRepoLinkInfo> {
  return apiRequest<TemplateRepoLinkInfo>(`/templates/${templateId}/github/link`, {
    method: 'POST',
    body: JSON.stringify({ connectionId, repoFullName, branch, filePath, syncDirection }),
  }, DEFAULT_TIMEOUT, token);
}

// Get template repo links
export async function fetchTemplateRepoLinks(templateId: string, token?: string | null): Promise<TemplateRepoLinkInfo[]> {
  return apiRequest<TemplateRepoLinkInfo[]>(`/templates/${templateId}/github/links`, {}, DEFAULT_TIMEOUT, token);
}

// Unlink
export async function unlinkTemplateFromGitHub(templateId: string, linkId: string, token?: string | null): Promise<{ success: boolean }> {
  return apiRequest(`/templates/${templateId}/github/link/${linkId}`, {
    method: 'DELETE',
  }, DEFAULT_TIMEOUT, token);
}

// Push template to GitHub
export async function pushTemplateToGitHub(templateId: string, repoLinkId: string, commitMessage?: string, token?: string | null): Promise<GitHubPushResult> {
  return apiRequest<GitHubPushResult>(`/templates/${templateId}/github/push`, {
    method: 'POST',
    body: JSON.stringify({ repoLinkId, commitMessage }),
  }, DEFAULT_TIMEOUT, token);
}

// Pull from GitHub
export async function pullTemplateFromGitHub(templateId: string, repoLinkId: string, token?: string | null): Promise<{ content: string; sha: string }> {
  return apiRequest(`/templates/${templateId}/github/pull`, {
    method: 'POST',
    body: JSON.stringify({ repoLinkId }),
  }, DEFAULT_TIMEOUT, token);
}

// Quick push (link + push in one action)
export async function quickPushTemplateToGitHub(
  templateId: string,
  connectionId: string,
  repoFullName: string,
  branch?: string,
  filePath?: string,
  commitMessage?: string,
  token?: string | null,
): Promise<TemplateRepoLinkInfo & GitHubPushResult> {
  return apiRequest(`/templates/${templateId}/github/quick-push`, {
    method: 'POST',
    body: JSON.stringify({ connectionId, repoFullName, branch, filePath, commitMessage }),
  }, DEFAULT_TIMEOUT, token);
}

// ============================================================================
// WAITLIST (Public — no auth)
// ============================================================================

export async function submitWaitlistEmail(
  email: string,
  source: 'WAITLIST' | 'NEWSLETTER',
  referrer?: string,
): Promise<{ success: boolean; id: string }> {
  return apiRequest('/waitlist', {
    method: 'POST',
    body: JSON.stringify({ email, source, referrer }),
  });
}
