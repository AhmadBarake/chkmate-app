# Chkmate AWS Features Review & Agentic Automation Plan

> **Date**: 2026-02-07
> **Scope**: Cost Optimization, Cloud Analysis & Terraform Generation, Security Audit, + Agentic Automation Mode

---

## TABLE OF CONTENTS

1. [Part 1: Bugs & Critical Fixes](#part-1-bugs--critical-fixes)
2. [Part 2: Enhancement Plan by Feature](#part-2-enhancement-plan-by-feature)
3. [Part 3: Agentic Automation Mode — Full Feature Plan](#part-3-agentic-automation-mode)

---

# PART 1: BUGS & CRITICAL FIXES

These are issues that must be resolved before any new feature work. Ordered by severity.

---

## P0 — Security Vulnerabilities

### BUG-001: Authorization Bypass on Audit Reports
- **File**: `server/index.ts` — `GET /api/audit/:templateId`
- **Issue**: Any authenticated user can fetch audit reports for ANY template by guessing/enumerating template IDs. No ownership verification is performed (unlike `GET /api/templates/:id` which correctly checks `template.project.userId`).
- **Fix**: Add ownership check — query the template, verify `template.project.userId === userId` before returning the report.

### BUG-002: Global Policy Toggle Without Admin Check
- **File**: `server/index.ts` — `PUT /api/policies/:id/toggle`
- **Issue**: Any authenticated user can enable/disable policies for the entire system. One user could disable all security policies, causing clean audit scores for every user. Policies are global, not per-tenant.
- **Fix**: Either scope policies per-user/per-organization with a `userId` column, or restrict this endpoint to admin-only access with role-based access control.

### BUG-003: Connection Resource Injection in Generate Endpoint
- **File**: `server/index.ts:458` — `POST /api/generate`
- **Issue**: `getConnectionResources(connectionId)` is called without `userId` ownership verification. Any user who knows a `connectionId` can inject another user's cloud resources into their generation prompt.
- **Fix**: Add ownership check on the connection before fetching resources.

### BUG-004: DATABASE_URL Logged to Console
- **File**: `server/index.ts:74`
- **Issue**: `console.log('DATABASE_URL:', process.env.DATABASE_URL)` prints database credentials to stdout on every server start. In production, logs are often collected by third-party services.
- **Fix**: Remove this log statement entirely.

### BUG-005: VITE_ Prefixed API Key Fallback
- **File**: `server/index.ts:81`
- **Issue**: `process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY` — the `VITE_` prefix means this variable is exposed in the frontend bundle. If `GEMINI_API_KEY` is unset, the server uses a key that's also visible client-side.
- **Fix**: Remove the `VITE_` fallback on the server. Ensure `GEMINI_API_KEY` is always set in the server environment.

### BUG-006: AWS Credentials Never Cleared from React State
- **File**: `chkmate-cloud/src/pages/CloudScanner.tsx:31-35`
- **Issue**: Manual AWS credentials (`accessKeyId`, `secretAccessKey`) sit in React state indefinitely after scan completion. They are never wiped.
- **Fix**: Clear credential state in the `finally` block after scan completion.

---

## P1 — Data Integrity & Logic Bugs

### BUG-007: Credits Deducted Before Credential Validation
- **File**: `server/index.ts:819-831`
- **Issue**: In the cloud scan endpoint, `deductCredits()` is called BEFORE `validateCredentials()`. If validation fails, the user loses 20 credits for a scan that never ran.
- **Fix**: Move credit deduction to after successful validation.

### BUG-008: Violations Not Linked to Audit Reports
- **File**: `server/services/policyEngine.ts:209-229`
- **Issue**: `Violation.create()` saves violations with `templateId` but no `auditReportId`. This means `getLatestAuditReport()` returns cumulative violations from ALL historical audits, not just the latest one. Violation counts inflate with every re-audit.
- **Fix**: Add `auditReportId` foreign key to the Violation model and pass the report ID when creating violations.

### BUG-009: CloudFormation Template Missing Required IAM Permissions
- **File**: `server/services/cloudService.ts:56-68`
- **Issue**: The CloudFormation template YAML only grants `ec2:Describe*`, `rds:Describe*`, `s3:ListAllMyBuckets`, `s3:GetBucketLocation`, `s3:ListBucket`, and basic IAM read permissions. But the scanner calls `s3:GetBucketVersioning`, `s3:GetPublicAccessBlock`, `s3:GetBucketEncryption`, `iam:GetLoginProfile`, `iam:ListMFADevices`, `lambda:ListFunctions`, `dynamodb:*`, `amplify:*`, and `ce:GetCostAndUsage` — none of which are in the template. Users who deploy the CloudFormation stack get `AccessDenied` errors for most scans.
- **Fix**: Sync the CloudFormation template with the inline JSON policy shown in `CloudConnections.tsx:243-308`, which is correct and comprehensive.

### BUG-010: `syncConnection` Returns Stale Data
- **File**: `server/services/cloudService.ts:190-191`
- **Issue**: After updating the connection and replacing resources in a transaction, the function returns the `connection` object fetched BEFORE the update. `lastSyncAt` will show the old value.
- **Fix**: Return the updated connection from the transaction result.

### BUG-011: No Pagination in AWS Resource Scanner
- **File**: `server/services/awsResourceScanner.ts`
- **Issue**: None of the discovery functions handle API pagination. IAM `ListUsers` returns max 100, Lambda `ListFunctions` max 50, DynamoDB `ListTables` max 100, EC2 `DescribeInstances` is paginated. Enterprise accounts with 100+ resources of any type will have resources silently dropped.
- **Fix**: Implement pagination loops (or use AWS SDK paginators) for all list operations.

### BUG-012: Terraform Parser Fails on Nested Blocks
- **File**: `server/lib/terraformParser.ts:39`
- **Issue**: The regex `resourceRegex` only handles one level of nested braces. Resources with 2+ levels of nesting (e.g., `root_block_device { ebs_block_device { ... } }`) are silently truncated. This cascades into every policy check that inspects `rawBlock`.
- **Fix**: Replace the regex with a recursive balanced-brace parser, or integrate an HCL parsing library.

### BUG-013: Security Group Port Range Check Only Tests `fromPort`
- **File**: `server/services/awsCloudService.ts:208-235`
- **Issue**: Only `fromPort` is checked against the dangerous ports list. A security group rule covering a range like `fromPort=0, toPort=65535` won't flag individual dangerous ports. A rule like `fromPort=20, toPort=30` that covers port 22 (SSH) is also missed.
- **Fix**: Check if any dangerous port falls within the `fromPort..toPort` range.

### BUG-014: IPv6 Ranges Not Checked
- **Files**: `server/services/awsCloudService.ts:213`, `server/services/recommendationService.ts:231`
- **Issue**: Only `IpRanges` for `0.0.0.0/0` is checked. `Ipv6Ranges` for `::/0` is never inspected. Security groups open to the entire IPv6 internet are invisible.
- **Fix**: Also check `Ipv6Ranges` for `::/0` in all security group evaluations.

### BUG-015: RDS Instances Never Placed in Infrastructure Map Hierarchy
- **File**: `chkmate-cloud/src/pages/InfrastructureMap.tsx:280-283`
- **Issue**: The code checks `i.metadata?.dbSubnetGroup?.subnets?.includes(subnet.resourceId)`, but the scanner stores RDS metadata with fields `engine`, `engineVersion`, `instanceClass`, etc. — no `dbSubnetGroup` field exists. RDS instances are always orphaned in the visualization.
- **Fix**: Either add `dbSubnetGroup` to the RDS scanner metadata, or match RDS instances to subnets via a different mechanism.

### BUG-016: Orphan Detection Never Works, Never Renders
- **File**: `chkmate-cloud/src/pages/InfrastructureMap.tsx:292-298`
- **Issue**: The orphan detection filter checks if a resource's `id` is NOT in the vpcs/subnets/instances arrays — but those arrays already contain ALL resources of those types, so the filter returns nothing. Additionally, the `orphanned` variable (note typo) is computed but never rendered in JSX.
- **Fix**: Rewrite orphan detection to check relationship fields (e.g., `metadata.subnetId`), and render the results.

### BUG-017: Null Dereference Crashes in CostControl
- **File**: `chkmate-cloud/src/pages/CostControl.tsx:190, 200, 371`
- **Issue**: `scanResult?.costBreakdown?.totalMonthly.toFixed(2)` — optional chaining stops at `costBreakdown` but NOT at `totalMonthly`. If `totalMonthly` is undefined, `.toFixed(2)` throws TypeError.
- **Fix**: Add optional chaining: `totalMonthly?.toFixed(2)`.

### BUG-018: Dismiss Recommendations Never Persists
- **File**: `chkmate-cloud/src/pages/Recommendations.tsx:113-117`
- **Issue**: Comment literally says `// TODO: add API call`. Dismissals are optimistic-only — refreshing the page brings them all back. The backend `dismissRecommendation` function exists but is never wired to the frontend.
- **Fix**: Add API call to `PATCH /api/cloud/connections/:id/recommendations/:recId/dismiss`.

### BUG-019: Duplicate CORS Middleware
- **File**: `server/index.ts:87-88`
- **Issue**: `app.use(cors())` is applied twice with identical configuration.
- **Fix**: Remove the duplicate line.

### BUG-020: `sessionToken` Not Passed to STS Validation
- **File**: `server/services/awsCloudService.ts:562`
- **Issue**: `validateCredentials` does not include `sessionToken` in the STS client config. Temporary credentials (from STS AssumeRole or SSO) will fail validation.
- **Fix**: Accept and pass `sessionToken` parameter.

---

## P2 — Functional Gaps

### BUG-021: Hardcoded "+12% from last month" in CostControl
- **File**: `chkmate-cloud/src/pages/CostControl.tsx:192-194`
- **Issue**: Static string, not computed from real data. Users see fake trend data.

### BUG-022: Mock Trend Data Presented as Real
- **File**: `chkmate-cloud/src/pages/CostControl.tsx:117-122`
- **Issue**: `mockTrendData` fabricates 4 months of "history" by multiplying current month total by 0.8/0.85/0.92/1.0. This is displayed in charts with no disclaimer.

### BUG-023: Budget Hardcoded to $500
- **File**: `chkmate-cloud/src/pages/CostControl.tsx:363`
- **Issue**: Monthly budget of $500 is baked into JSX with no user configuration.

### BUG-024: "Download Report" and "Configure Schedule" Buttons Non-Functional
- **File**: `chkmate-cloud/src/pages/CloudScanner.tsx:545-555`
- **Issue**: No `onClick` handlers. Buttons are visual-only.

### BUG-025: Missing Credit Deduction for Audits
- **File**: `server/index.ts` — `POST /api/audit`
- **Issue**: The route does NOT call `deductCredits`, but the client-side `CREDIT_COSTS` defines `AUDIT: 5`. Either audits should be free (remove from `CREDIT_COSTS`) or credits should be charged.

### BUG-026: Performance Filter Shows Zero Results
- **File**: `chkmate-cloud/src/pages/Recommendations.tsx:51`
- **Issue**: UI offers `PERFORMANCE` filter tab, but no recommendation check produces `PERFORMANCE` type. This filter always shows empty. Meanwhile, `RELIABILITY` recommendations exist in the backend but have no filter tab in the UI.

### BUG-027: Recommendations Stats Miscounts Critical Risk
- **File**: `chkmate-cloud/src/pages/Recommendations.tsx:126-127`
- **Issue**: `critical` counter only counts `risk === 'high'`, but the `SGOpenSSHCheck` emits `risk: 'critical'`. Critical risks are not counted as critical in the stats.

### BUG-028: Prisma Query Logging Enabled in Production
- **File**: `server/index.ts:77`
- **Issue**: `log: ['query', 'info', 'warn', 'error']` — full query logging can expose sensitive data in production logs.
- **Fix**: Use `['warn', 'error']` in production, full logging only in development.

---

# PART 2: ENHANCEMENT PLAN BY FEATURE

---

## A. Cloud Analysis & Terraform Generation Enhancements

### A1. Expand AWS Resource Scanner (HIGH PRIORITY)
**Current state**: Scans EC2, VPC, Subnet, Security Groups, RDS, S3, IAM, Lambda, DynamoDB, Amplify.
**Target state**: Add discovery for:
- [ ] ELB/ALB/NLB (Elastic Load Balancers)
- [ ] ECS clusters, services, tasks
- [ ] EKS clusters
- [ ] CloudFront distributions
- [ ] Route53 hosted zones and records
- [ ] SNS topics
- [ ] SQS queues
- [ ] ElastiCache clusters (Redis/Memcached)
- [ ] Elastic IPs and NAT Gateways
- [ ] Internet Gateways and Route Tables
- [ ] API Gateway (REST and HTTP APIs)
- [ ] ECR repositories
- [ ] Secrets Manager secrets
- [ ] KMS keys
- [ ] CloudWatch alarms and log groups
- [ ] Step Functions state machines

### A2. Multi-Region Scanning (HIGH PRIORITY)
**Current state**: Single region per scan.
**Target state**: Auto-discover active regions via EC2 `DescribeRegions`, scan all regions in parallel with concurrency limits, unified cross-region view. Global services (IAM, S3, Route53, CloudFront) scanned once.

### A3. Terraform Generation Post-Validation (MEDIUM PRIORITY)
**Current state**: Generated HCL is returned as-is from Gemini with no validation.
**Target state**:
- Parse generated output through `terraformParser.ts` (once fixed) to catch structural issues
- Run the security audit engine on generated templates automatically
- Display audit score alongside generated code in the Builder
- Warn on cost policy violations before saving

### A4. Upgrade Terraform Parser (HIGH PRIORITY)
**Current state**: Regex-based, fails on nested blocks, no support for data sources/modules/locals.
**Target state**: Implement a recursive descent parser or integrate `hcl2-parser` npm package. Support:
- [ ] Arbitrary nesting depth
- [ ] Multi-line values (heredocs, maps, lists)
- [ ] `data` source blocks
- [ ] `module` blocks
- [ ] `locals` blocks
- [ ] Terraform expressions and interpolation
- [ ] `dynamic` blocks
- [ ] `for_each` and `count` meta-arguments

### A5. Improve Context-Aware Generation (MEDIUM PRIORITY)
**Current state**: Existing resources are injected as context into the Gemini prompt.
**Target state**:
- Generate `import` blocks for existing resources automatically
- Reference existing VPCs, subnets, security groups by data source
- Suggest integration points with existing infrastructure
- Avoid naming conflicts with existing resources

### A6. Multi-File Download as ZIP (LOW PRIORITY)
**Current state**: Download button only exports the currently selected file.
**Target state**: "Download All" button creates a zip archive with `main.tf`, `variables.tf`, `outputs.tf`, and `terraform.tfvars` (with placeholder values).

---

## B. Cost Optimization Enhancements

### B1. Implement Real AWS Pricing API Integration (HIGH PRIORITY)
**Current state**: Static lookup table with 12 EC2 types and 4 RDS types. `PricingClient` is created but never used. Region is ignored. Engine type is ignored for RDS.
**Target state**:
- [ ] Use AWS Pricing API (`GetProducts`) with caching (TTL: 24h)
- [ ] Region-aware pricing for all services
- [ ] Engine-aware RDS pricing (MySQL vs PostgreSQL vs SQL Server vs Aurora)
- [ ] Storage-tier-aware S3 pricing (Standard, IA, Glacier, Intelligent-Tiering)
- [ ] Volume-type-aware EBS pricing (gp2, gp3, io1, io2, st1, sc1)
- [ ] Fall back to static catalog only when API unavailable

### B2. Expand Cost Service Coverage (HIGH PRIORITY)
**Current state**: 6 resource types priced (EC2, RDS, S3, EBS, DynamoDB, Amplify).
**Target state**: Add pricing for:
- [ ] ELB/ALB/NLB (base + LCU charges)
- [ ] NAT Gateway ($32/month + data processing)
- [ ] Elastic IP ($3.65/month per public IPv4)
- [ ] CloudFront (data transfer + requests)
- [ ] ECS/Fargate (vCPU-hour + GB-hour)
- [ ] EKS ($73/month per cluster)
- [ ] ElastiCache (node-hour pricing)
- [ ] Route 53 ($0.50/hosted zone + per query)
- [ ] API Gateway (per million calls)
- [ ] SQS/SNS (per million requests)
- [ ] Secrets Manager ($0.40/secret/month)
- [ ] KMS ($1/key/month)
- [ ] CloudWatch (logs ingestion, metrics, dashboards)

### B3. Add Cost Optimization Policies (MEDIUM PRIORITY)
**Current state**: 4 policies (COST001-COST004).
**Target state**: Add:
- [ ] COST005: GP2-to-GP3 migration check (20% cheaper, better baseline)
- [ ] COST006: Old-generation instance detection (m4/c4/r4 → m6i/c6i/r6i)
- [ ] COST007: Reserved Instance / Savings Plan analysis
- [ ] COST008: Idle RDS detection (low CPU/connections)
- [ ] COST009: Idle ELB detection (zero registered targets)
- [ ] COST010: DynamoDB capacity mode optimization (on-demand vs provisioned)
- [ ] COST011: S3 lifecycle policy check (missing IA/Glacier transitions)
- [ ] COST012: CloudWatch log retention check (default "never expire")
- [ ] COST013: Unused Lambda detection (zero invocations in 30 days)
- [ ] COST014: Over-provisioned Lambda (memory vs actual usage from CloudWatch)
- [ ] COST015: Unattached EBS volume detection (from live resources)
- [ ] COST016: Idle Elastic IP detection (from live resources)

### B4. User-Configurable Budget (LOW PRIORITY)
**Current state**: Hardcoded $500 budget in JSX.
**Target state**: Budget stored per-user in database, configurable from CostControl page, with threshold alerts.

### B5. Real Cost Trend Data (MEDIUM PRIORITY)
**Current state**: Mock data fabricated from current month.
**Target state**: Use AWS Cost Explorer API `GetCostAndUsage` to fetch actual 6-month historical spend, cache results (TTL: 6h), render real trend charts.

### B6. Cost Report Export (LOW PRIORITY)
**Target state**: Generate downloadable CSV/PDF cost reports with per-service breakdown, trend analysis, and optimization recommendations.

---

## C. Security Audit Enhancements

### C1. Fix Security Policy Logic (HIGH PRIORITY — see bugs BUG-012 through BUG-014)
**Current state**: String-matching on `rawBlock` produces false positives/negatives.
**Target state**: All policies use parsed properties from the upgraded Terraform parser instead of raw string matching. Security group checks use proper range comparison. IAM policy checks parse actual policy JSON documents.

### C2. Expand Security Policies to CIS AWS Benchmark Coverage (HIGH PRIORITY)
**Current state**: 5 policies (SEC001-SEC005).
**Target state**: Cover CIS AWS Foundations Benchmark v3.0 (50+ controls). Add policies for:

**Logging & Monitoring:**
- [ ] SEC006: CloudTrail enabled in all regions
- [ ] SEC007: CloudTrail log file validation enabled
- [ ] SEC008: CloudTrail logs encrypted with KMS
- [ ] SEC009: S3 access logging enabled
- [ ] SEC010: VPC Flow Logs enabled
- [ ] SEC011: GuardDuty enabled
- [ ] SEC012: AWS Config enabled

**Networking:**
- [ ] SEC013: Default security group restricts all traffic
- [ ] SEC014: VPC subnets should not auto-assign public IPs
- [ ] SEC015: NACLs not overly permissive
- [ ] SEC016: ALB/NLB access logging enabled
- [ ] SEC017: Security group open to all ports detected (0-65535)

**Data Protection:**
- [ ] SEC018: S3 bucket versioning enabled
- [ ] SEC019: S3 bucket server-side encryption
- [ ] SEC020: SNS topic encryption
- [ ] SEC021: SQS queue encryption
- [ ] SEC022: DynamoDB table encryption
- [ ] SEC023: Secrets Manager rotation enabled
- [ ] SEC024: ElastiCache encryption in transit and at rest
- [ ] SEC025: EFS encryption at rest
- [ ] SEC026: RDS encryption at rest (CIS 2.3.1)
- [ ] SEC027: RDS deletion protection enabled

**Identity & Access:**
- [ ] SEC028: No inline IAM policies (prefer managed policies)
- [ ] SEC029: IAM password policy strength
- [ ] SEC030: Cross-account role trust policies validation
- [ ] SEC031: IMDSv2 enforced on EC2 instances

**Secrets Detection:**
- [ ] SEC032: Hardcoded passwords/secrets in Terraform files (pattern matching for `password = "..."`, `secret_key = "..."`, API keys)

### C3. Add Compliance Framework Mapping (MEDIUM PRIORITY)
**Current state**: No framework mapping.
**Target state**: Each policy maps to one or more frameworks:
- CIS AWS Foundations Benchmark v3.0
- AWS Well-Architected Framework (Security Pillar)
- SOC 2 Type II
- NIST 800-53
- PCI DSS v4.0
- HIPAA

Add a `complianceMapping` field to `PolicyDefinition` interface and render framework badges on violation cards.

### C4. Audit Report Export (MEDIUM PRIORITY)
**Target state**: Export audit reports as PDF (compliance evidence), JSON (machine-readable), or CSV (spreadsheet analysis). Include policy descriptions, affected resources, remediation guidance, and framework mappings.

### C5. Historical Audit Trending (LOW PRIORITY)
**Target state**: Track audit scores over time per template/project. Show score progression charts. Alert when score degrades between audits.

### C6. Auto-Fix Implementation (MEDIUM PRIORITY — prerequisite for Agentic Mode)
**Current state**: `autoFixable: true` is a badge with no mechanism to apply fixes.
**Target state**: Each auto-fixable policy includes a `remediation` function that takes the parsed resource and returns the corrected Terraform snippet. The UI shows a "Preview Fix" button that displays a diff, and an "Apply Fix" button that modifies the template content.

---

# PART 3: AGENTIC AUTOMATION MODE

## Vision

"Agentic Automation" is a premium mode where the platform's AI agent acts autonomously on the user's behalf — modifying Terraform templates, applying security fixes, optimizing costs, and optionally deploying changes to their AWS account. This transforms Chkmate from a passive analysis tool into an active infrastructure management agent.

---

## Version 1 Scope

### V1-Feature 1: Agent-Modified Terraform Templates

**Description**: When a user loads/generates a Terraform template and runs an audit or cost analysis, the agent can automatically apply recommended changes to the template on their behalf.

**User Flow**:
1. User navigates to Builder or opens an existing template
2. User toggles "Agentic Automation" mode ON (global toggle in settings or per-session toggle)
3. User runs an audit or cost analysis
4. Instead of just showing violations/recommendations, the agent presents a **Change Plan**:
   - List of proposed modifications with rationale
   - Before/after diff for each change
   - Estimated cost impact (savings or increase)
   - Security score impact (before → after)
5. User reviews the Change Plan and can:
   - **Accept All** — agent applies all changes
   - **Cherry-pick** — user selects which changes to apply
   - **Reject All** — no changes made
6. Agent applies accepted changes to the template, creating a new version
7. User can undo/revert to the previous version via diff viewer

**Technical Implementation**:

```
┌─────────────────────────────────────────────┐
│  Frontend (Builder.tsx + new AgenticPanel)   │
│                                             │
│  [Toggle: Agentic Mode ON/OFF]              │
│  [Run Agent Analysis]                       │
│  [Change Plan View with Diffs]              │
│  [Accept/Reject Controls]                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  POST /api/agent/analyze                    │
│  - Runs audit + cost analysis               │
│  - For each violation/recommendation:       │
│    - Generates remediation Terraform via AI  │
│    - Computes diff against original          │
│    - Calculates cost/security impact         │
│  - Returns ChangePlan object                 │
│                                             │
│  POST /api/agent/apply                      │
│  - Receives accepted change IDs             │
│  - Applies changes to template content      │
│  - Saves new template version               │
│  - Returns updated template                  │
└─────────────────────────────────────────────┘
```

**Database Changes**:
```prisma
model AgentSession {
  id            String   @id @default(uuid())
  userId        String
  templateId    String
  status        String   // PLANNING, REVIEWING, APPLYING, COMPLETED, CANCELLED
  changePlan    Json     // Array of proposed changes
  appliedChanges Json?   // Array of accepted change IDs
  createdAt     DateTime @default(now())
  completedAt   DateTime?

  user     User     @relation(fields: [userId], references: [id])
  template Template @relation(fields: [templateId], references: [id])
}

model TemplateVersion {
  id          String   @id @default(uuid())
  templateId  String
  version     Int
  content     String   // Full template content at this version
  changeLog   String?  // What changed
  createdBy   String   // "user" or "agent"
  createdAt   DateTime @default(now())

  template Template @relation(fields: [templateId], references: [id])
}
```

**Change Plan Object**:
```typescript
interface ChangePlan {
  sessionId: string;
  templateId: string;
  originalScore: { security: number; cost: number };
  projectedScore: { security: number; cost: number };
  changes: AgentChange[];
  totalEstimatedSavings: number;
}

interface AgentChange {
  id: string;
  type: 'SECURITY_FIX' | 'COST_OPTIMIZATION' | 'BEST_PRACTICE';
  policyId?: string;
  recommendationId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resourceRef: string;
  diff: { before: string; after: string };
  impact: {
    securityScoreChange: number;   // e.g., +15
    monthlyCostChange: number;     // e.g., -23.50
  };
  status: 'proposed' | 'accepted' | 'rejected' | 'applied';
}
```

**Credit Cost**: `AGENT_ANALYSIS: 25 credits` (combines audit + cost analysis + AI remediation generation)

---

### V1-Feature 2: Agent-Driven Terraform Deployments

**Description**: Users can provide a second set of AWS credentials (deployment credentials) that allow the agent to run `terraform plan` and `terraform apply` on their AWS account.

**User Flow**:
1. User navigates to Settings → Deployment Credentials
2. User provides deployment IAM role ARN (cross-account role with deployment permissions)
   - We provide a CloudFormation template that creates a role with scoped permissions
   - Role uses external ID for security (same pattern as scanner role)
3. User selects a template to deploy
4. Agent runs `terraform init` + `terraform plan` in a sandboxed environment
5. Plan output is displayed to the user with:
   - Resources to create/modify/destroy
   - Cost estimate for new resources
   - Security audit of the planned state
6. User reviews and approves the plan
7. Agent runs `terraform apply` with the approved plan
8. Deployment status is tracked with real-time progress
9. Terraform state is stored securely (encrypted at rest)

**Technical Implementation**:

```
┌─────────────────────────────────────────────────┐
│  Frontend (new DeploymentPage.tsx)               │
│                                                 │
│  [Deployment Credentials Setup]                  │
│  [Select Template → Plan → Review → Apply]       │
│  [Deployment History & Status]                    │
│  [State File Management]                          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  Deployment Service (server/services/)           │
│                                                 │
│  POST /api/deploy/credentials                    │
│  - Validate deployment role ARN                  │
│  - Store encrypted role ARN + external ID        │
│                                                 │
│  POST /api/deploy/plan                           │
│  - Assume deployment role via STS                │
│  - Write template files to sandboxed workspace   │
│  - Run terraform init + plan                     │
│  - Parse plan output                             │
│  - Run security audit on planned resources       │
│  - Return plan summary                           │
│                                                 │
│  POST /api/deploy/apply                          │
│  - Verify plan hasn't changed                    │
│  - Run terraform apply with saved plan           │
│  - Stream progress via SSE or WebSocket          │
│  - Store state file encrypted                    │
│  - Return deployment result                      │
│                                                 │
│  GET /api/deploy/status/:deploymentId            │
│  - Return current deployment status              │
│                                                 │
│  POST /api/deploy/destroy/:deploymentId          │
│  - Run terraform destroy (with confirmation)     │
│  - Clean up state                                │
└─────────────────────────────────────────────────┘
```

**Database Changes**:
```prisma
model DeploymentCredential {
  id          String   @id @default(uuid())
  userId      String
  provider    String   // "aws"
  roleArn     String   // Encrypted
  externalId  String
  name        String   // e.g., "Production Account"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  user        User         @relation(fields: [userId], references: [id])
  deployments Deployment[]
}

model Deployment {
  id              String   @id @default(uuid())
  userId          String
  templateId      String
  credentialId    String
  status          String   // PLANNING, PLAN_READY, APPLYING, SUCCEEDED, FAILED, DESTROYING, DESTROYED
  planOutput      Json?    // Parsed plan summary
  applyOutput     String?  // Apply logs
  stateFile       String?  // Encrypted Terraform state
  resourceCount   Int      @default(0)
  estimatedCost   Float?
  errorMessage    String?
  createdAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?

  user       User                 @relation(fields: [userId], references: [id])
  template   Template             @relation(fields: [templateId], references: [id])
  credential DeploymentCredential @relation(fields: [credentialId], references: [id])
}
```

**Security Considerations**:
- Deployment credentials are stored encrypted (AES-256) with a server-side key
- Terraform execution runs in isolated Docker containers or sandboxed directories
- Each deployment gets a unique workspace, cleaned up after completion
- State files are encrypted at rest with per-user encryption keys
- All deployment actions are audit-logged
- Deployment role permissions should be scoped (we provide a template with minimum required permissions)
- Rate limit: max 5 concurrent deployments per user
- Timeout: 30 minutes max per deployment
- Auto-destroy option for dev/test environments

**Credit Cost**: `DEPLOY_PLAN: 15 credits`, `DEPLOY_APPLY: 30 credits`

---

## Version 2+ Ideas (For Approval)

### V2-Feature 1: Drift Detection Agent
**Description**: The agent periodically compares the stored Terraform state against the actual AWS resources (using scanner credentials). When drift is detected (manual changes in the console, changes by other tools), the agent:
- Alerts the user with specific resources that drifted
- Proposes Terraform template updates to reconcile the drift
- Can auto-apply reconciliation in Agentic mode

**Value**: Catches "ClickOps" changes that bypass IaC, keeping Terraform as the source of truth.

### V2-Feature 2: Continuous Compliance Agent
**Description**: The agent runs security and cost audits on a schedule (daily/weekly) against connected AWS accounts. When new violations are detected:
- Sends alerts via email/Slack/webhook
- Generates remediation Terraform automatically
- In Agentic mode, can auto-apply fixes for pre-approved policy categories (e.g., "always fix encryption violations")

**User Configuration**:
```
Auto-fix rules:
  ☑ Always fix: S3 public access violations
  ☑ Always fix: Unencrypted storage
  ☐ Require approval: Security group changes
  ☐ Require approval: IAM policy changes
  ☑ Always fix: Untagged resources
```

### V2-Feature 3: Cost Anomaly Detection Agent
**Description**: Using AWS Cost Explorer data, the agent establishes baseline spending patterns and alerts when:
- Daily spend exceeds a threshold
- A specific service's cost spikes unexpectedly
- A new service appears in the bill (could indicate compromised credentials)
- Reserved Instance/Savings Plan utilization drops below threshold

In Agentic mode, the agent can propose and apply cost-saving Terraform changes (right-sizing, switching to Graviton, enabling Intelligent-Tiering).

### V2-Feature 4: Infrastructure Chatbot Agent
**Description**: A conversational interface where users can ask questions about their infrastructure and the agent answers using real data from connected AWS accounts:
- "Why did my costs increase this month?"
- "Which security groups are open to the internet?"
- "Show me all unencrypted RDS instances"
- "Generate a Terraform module that replicates my production VPC in a new region"

The agent has access to scanned resources, cost data, and audit results to provide grounded, accurate answers.

### V2-Feature 5: Multi-Account Agent
**Description**: For agencies and enterprises managing multiple AWS accounts, the agent can:
- Scan and analyze all accounts from a single dashboard
- Apply consistent security baselines across accounts (e.g., "all accounts must have CloudTrail enabled")
- Generate account-level compliance reports
- Deploy standardized infrastructure modules across accounts
- Compare configurations between accounts ("diff production vs staging")

### V2-Feature 6: Terraform Module Generator Agent
**Description**: Based on patterns detected across the user's templates and infrastructure, the agent can:
- Identify repeated resource patterns (e.g., VPC + subnets + NAT Gateway appears in 5 templates)
- Propose extracting them into reusable Terraform modules
- Generate the module with proper variables, outputs, and documentation
- Refactor existing templates to use the new module

---

## Agentic Mode — Architecture & UI Plan

### Global UI Changes

**1. Mode Toggle (Header/Sidebar)**:
- Add a prominent toggle switch in the DashboardLayout sidebar: "Agentic Automation" ON/OFF
- When OFF: app behaves exactly as current (analysis-only, recommendations shown passively)
- When ON: all analysis endpoints return actionable Change Plans with apply capabilities
- Visual indicator: sidebar border glow or accent color change when Agentic mode is active

**2. New Pages**:
- `/settings/deployment-credentials` — Manage deployment IAM roles
- `/deploy` — Deployment dashboard (plan, apply, history)
- `/agent/sessions` — History of all agent sessions (analyses, applied changes, deployments)

**3. Modified Pages**:
- `Builder.tsx` — Add "Agent Analysis" button alongside existing "Run Audit". Shows Change Plan panel with diffs and accept/reject controls
- `CostControl.tsx` — Add "Auto-Optimize" button that generates cost optimization Change Plan
- `Recommendations.tsx` — Add "Apply Recommendation" button on each card (currently missing)
- `AuditPanel.tsx` — Add "Auto-Fix All" button for auto-fixable violations

### Backend Architecture

```
server/
├── services/
│   ├── agentService.ts           # Core agent orchestration
│   │   ├── analyzeAndPlan()      # Run audit + cost analysis → ChangePlan
│   │   ├── applyChanges()        # Apply accepted changes to template
│   │   └── getSession()          # Get agent session status
│   ├── deploymentService.ts      # Terraform deployment orchestration
│   │   ├── planDeployment()      # terraform init + plan
│   │   ├── applyDeployment()     # terraform apply
│   │   ├── destroyDeployment()   # terraform destroy
│   │   └── getDeploymentStatus() # Status polling
│   ├── remediationService.ts     # AI-powered fix generation
│   │   ├── generateFix()         # Generate Terraform fix for a violation
│   │   ├── generateOptimization()# Generate cost optimization change
│   │   └── validateFix()         # Validate generated fix is syntactically correct
│   └── stateService.ts           # Terraform state management
│       ├── storeState()          # Encrypt and store state file
│       ├── retrieveState()       # Decrypt and retrieve state
│       └── deleteState()         # Clean up state
├── lib/
│   └── sandbox.ts                # Sandboxed Terraform execution environment
```

### Deployment Credential IAM Policy Template

The CloudFormation template for deployment credentials should create a role with:
```yaml
# Scoped deployment permissions (not full admin)
- ec2:*
- rds:*
- s3:*
- lambda:*
- dynamodb:*
- iam:CreateRole, iam:AttachRolePolicy, iam:PassRole (scoped)
- elasticloadbalancing:*
- ecs:*
- route53:*
- cloudfront:*
- cloudwatch:*
- logs:*
- secretsmanager:*
- kms:CreateKey, kms:CreateAlias, kms:Encrypt, kms:Decrypt
# With conditions:
- aws:RequestTag/ManagedBy: "chkmate"  # Only manage tagged resources
- aws:ResourceTag/ManagedBy: "chkmate" # Only modify our resources
```

This ensures the deployment role can only manage resources tagged by Chkmate, preventing accidental modification of existing infrastructure.

---

## Implementation Priority & Phasing

### Phase 1: Foundation Fixes (Week 1-2)
- Fix all P0 security vulnerabilities (BUG-001 through BUG-006)
- Fix P1 data integrity bugs (BUG-007 through BUG-020)
- Upgrade Terraform parser (A4)
- Fix security policy logic (C1)

### Phase 2: AWS Feature Hardening (Week 3-4)
- Expand resource scanner (A1)
- Implement pagination (BUG-011)
- Expand security policies to 20+ (C2 partial)
- Implement real pricing API (B1)
- Expand cost service coverage (B2)
- Fix all P2 functional gaps

### Phase 3: Agentic Mode V1 — Template Modification (Week 5-7)
- Implement auto-fix mechanism for policies (C6)
- Build `agentService.ts` + `remediationService.ts`
- Build agent analysis API endpoints
- Build Change Plan UI with diff viewer
- Build agent session tracking
- Implement template versioning
- Add Agentic mode toggle to UI

### Phase 4: Agentic Mode V1 — Deployments (Week 8-10)
- Build `deploymentService.ts` + `stateService.ts` + `sandbox.ts`
- Build deployment credentials management
- Build deployment UI (plan, review, apply, status)
- Implement sandboxed Terraform execution
- Implement encrypted state storage
- Build deployment history and audit log

### Phase 5: Polish & Advanced Features (Week 11-12)
- Multi-region scanning (A2)
- Compliance framework mapping (C3)
- Real cost trend data (B5)
- Cost and audit report export (B6, C4)
- User-configurable budgets (B4)

### Phase 6: Agentic Mode V2 (Future)
- Drift detection agent
- Continuous compliance agent
- Cost anomaly detection
- Infrastructure chatbot
- Multi-account support
- Module generator

---

## Credit Pricing for Agentic Features

| Action | Credits | Justification |
|--------|---------|---------------|
| GENERATION | 10 | Current |
| AUDIT | 5 | Current (needs to be enforced) |
| COST_ANALYSIS | 5 | Current |
| CLOUD_SCAN | 20 | Current |
| RECOMMENDATION | 15 | Current |
| AGENT_ANALYSIS | 25 | Audit + cost + AI remediation generation |
| DEPLOY_PLAN | 15 | Terraform plan in sandbox |
| DEPLOY_APPLY | 30 | Terraform apply (highest risk action) |
| DRIFT_SCAN | 20 | State comparison against live resources |

---

## Open Questions for Discussion

1. **Deployment sandboxing strategy**: Docker containers vs. Lambda vs. dedicated EC2 instances for running Terraform? Docker is simplest but requires Docker-in-Docker or sidecar patterns on ECS.

2. **State file storage**: S3 with server-side encryption vs. database BLOB vs. dedicated Terraform Cloud backend? S3 is most Terraform-native but requires an S3 bucket per user or careful key namespacing.

3. **Multi-tenancy for policies**: Should policies be global (admin-managed) or per-user/per-organization? Per-user adds complexity but is essential for enterprise customers with different compliance requirements.

4. **Agentic mode pricing**: Should Agentic mode be a separate premium tier, or should it be credit-based like everything else? A premium tier could unlock the mode, with individual actions still costing credits.

5. **Terraform version management**: Users may need different Terraform versions. Should we support multiple versions, and if so, how do we manage the binary cache?

6. **Approval workflows**: For team/org accounts, should Agentic deployments require approval from a second team member (4-eyes principle)?

7. **Rollback strategy**: If a deployment fails midway, should the agent auto-rollback, or present the partial state to the user for manual resolution?
