import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import error handling utilities
import {
  AppError,
  ValidationError,
  NotFoundError,
  GenerationError,
  ExternalServiceError,
} from './lib/errors.js';
import { errorHandler, asyncHandler, notFoundHandler } from './middleware/errorHandler.js';
import { clerkMiddleware, requireAuth } from './middleware/auth.js';

// Import policy engine
import {
  seedBuiltInPolicies,
  auditTemplate,
  saveAuditReport,
  getLatestAuditReport,
  listPolicies,
  togglePolicy,
} from './services/policyEngine.js';

// Import credit service
import {
  getCreditBalance,
  getTransactionHistory,
  getUsageStats,
  deductCredits,
  addCredits,
  hasEnoughCredits,
  CREDIT_COSTS,
  CREDIT_PACKS,
  type CreditAction,
} from './services/creditService.js';

// Import AWS cloud service
import {
  scanAWSAccount,
  validateCredentials,
  type AWSCredentials,
} from './services/awsCloudService.js';

// Import cloud connection service
import {
  createAWSConnection,
  generateAWSSetupDetails,
  listConnections,
  syncConnection,
  deleteConnection,
  getConnectionResources,
  scanSavedConnection,
  verifyConnectionOwnership,
} from './services/cloudService.js';
import { compareTemplates } from './lib/diff.js';
import { verifyPaddleWebhook } from './services/paddleService.js';

// Import agent service
import {
  analyzeAndPlan,
  applyChanges,
  cancelSession,
  getSession,
  listSessions,
  getTemplateVersions,
  restoreTemplateVersion,
  toggleAgenticMode,
  getAgenticMode,
} from './services/agentService.js';

const app = express();
const PORT = process.env.PORT || 3002;

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
});

// Gemini setup
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set.');
}
const genAI = new GoogleGenerativeAI(apiKey);

app.use(cors());

// Use JSON parser for all routes EXCEPT webhook which needs raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/paddle') {
    next(); // Skip json parsing for webhook
  } else {
    express.json()(req, res, next);
  }
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Clerk Auth Middleware
app.use(clerkMiddleware as any);

// Placeholder auth removed. Using imported requireAuth from middleware/auth.js

// ============================================================================
// PROJECTS ROUTES
// ============================================================================

app.get(
  '/api/projects',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  })
);

app.post(
  '/api/projects',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, description, userId, email, userName } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    // req.userId is guaranteed to be set by requireAuth
    const internalUserId = (req as any).userId;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: internalUserId,
      },
    });

    res.status(201).json(project);
  })
);

app.get(
  '/api/projects/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { 
        templates: {
          include: {
            auditReports: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        } 
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Verify ownership
    if (project.userId !== userId) {
      throw new NotFoundError('Project');
    }

    res.json(project);
  })
);

app.delete(
  '/api/projects/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundError('Project');
    }

    // Verify ownership
    if (existingProject.userId !== userId) {
      throw new NotFoundError('Project');
    }

    // Delete related templates first (cascade)
    await prisma.template.deleteMany({
      where: { projectId: id },
    });

    const project = await prisma.project.delete({
      where: { id },
    });

    res.json({ success: true, deleted: project });
  })
);

// ============================================================================
// TEMPLATES ROUTES
// ============================================================================

app.get(
  '/api/templates',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const templates = await prisma.template.findMany({
      where: {
        project: { userId }
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        project: true,
        auditReports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });
    res.json(templates);
  })
);

app.get(
  '/api/templates/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    const template = await prisma.template.findUnique({
      where: { id },
      include: { 
        project: true,
        auditReports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });

    if (!template) {
      throw new NotFoundError('Template');
    }

    // Verify ownership via project
    if (template.project.userId !== userId) {
      throw new NotFoundError('Template');
    }

    res.json(template);
  })
);

app.post(
  '/api/templates',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, content, provider, projectId } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (!content) {
      throw new ValidationError('Template content is required');
    }

    if (!provider) {
      throw new ValidationError('Provider is required');
    }

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    const userId = (req as any).userId;

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Verify ownership
    if (project.userId !== userId) {
      throw new NotFoundError('Project');
    }

    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        content,
        provider,
        projectId,
      },
    });

    res.status(201).json(template);
  })
);

app.put(
  '/api/templates/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { name, content, provider } = req.body;
    const userId = (req as any).userId;

    // Check if template exists with project info
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTemplate) {
      throw new NotFoundError('Template');
    }

    // Verify ownership via project
    if (existingTemplate.project.userId !== userId) {
      throw new NotFoundError('Template');
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(content && { content }),
        ...(provider && { provider }),
      },
    });

    res.json(template);
  })
);

app.delete(
  '/api/templates/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const userId = (req as any).userId;

    // Check if template exists with project info
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTemplate) {
      throw new NotFoundError('Template');
    }

    // Verify ownership via project
    if (existingTemplate.project.userId !== userId) {
      throw new NotFoundError('Template');
    }

    const template = await prisma.template.delete({
      where: { id },
    });

    res.json({ success: true, deleted: template });
  })
);

// Get Diff for a template
app.post(
  '/api/templates/:id/diff',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { content } = req.body;

    if (!content) {
      throw new ValidationError('Content is required for comparison');
    }

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template');
    }

    const diff = await compareTemplates(template.content, content, template.provider, template.id);
    res.json(diff);
  })
);

// ============================================================================
// GENERATION ROUTE
// ============================================================================

app.post(
  '/api/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { prompt, provider, connectionId } = req.body;
    const userId = (req as any).userId; // Check requireAuth for how this is set

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ValidationError('Architecture description is required');
    }

    if (!provider || !['aws', 'azure', 'gcp', 'kubernetes'].includes(provider.toLowerCase())) {
      throw new ValidationError('Valid provider is required (aws, azure, gcp, kubernetes)');
    }

    if (prompt.length > 5000) {
      throw new ValidationError('Architecture description is too long (max 5000 characters)');
    }

    // Check and deduct credits
    const creditResult = await deductCredits(userId, 'GENERATION');
    if (!creditResult.success) {
      throw new ValidationError(creditResult.error || 'Insufficient credits');
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        // Context Injection
        let contextInstruction = '';
        if (connectionId) {
             try {
                const resources = await getConnectionResources(connectionId, userId);
                if (resources && resources.length > 0) {
                    const resourceSummary = resources.map((r: any) => 
                       `- ${r.resourceType}: ${r.name || r.resourceId} (${r.region}) ${JSON.stringify(r.metadata)}`
                    ).join('\n');
   
                    contextInstruction = `
   CONTEXT - EXISTING CLOUD RESOURCES:
   The following resources already exist in the user's ${provider} account. 
   You MUST prioritize using these existing resources (via data sources or imports) instead of creating new ones where appropriate to save costs and avoid conflicts.
   
   ${resourceSummary}
   
   If you use an existing resource, mention it in your reasoning.
                    `;
                }
             } catch (err) {
                 console.error('Failed to inject context:', err);
                 // Continue without context
             }
        }

      const systemPrompt = `
        You are an expert Terraform Infrastructure Architect.
        Your task is to generate Terraform configuration for the ${provider} provider based on the user's description.
        ${contextInstruction}
        Return ONLY a JSON object with this structure (no markdown code blocks):
        {
          "files": {
            "main.tf": "...",
            "variables.tf": "...",
            "outputs.tf": "..."
          },
          "cost": {
             "total": number,
             "breakdown": [{ "resource": "string", "cost": number }]
          },
          "diagram": {
             "nodes": [{ "id": "string", "type": "string", "label": "string", "position": { "x": number, "y": number } }],
             "edges": [{ "id": "string", "source": "string", "target": "string" }]
          }
        }

        Ensure the code is valid HCL (as strings). Estimate costs roughly based on current pricing. Creates nodes and edges for a ReactFlow diagram to visualize updates.
        `;

      const result = await model.generateContent([systemPrompt, `User Request: ${prompt}`]);

      const responseText = result.response.text();

      // Clean up markdown if any
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      let data;
      try {
        data = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse AI response:', cleaned.substring(0, 500));
        throw new GenerationError('AI returned invalid response. Please try again.');
      }

      // Validate response structure
      if (!data.files || !data.files['main.tf']) {
        throw new GenerationError('AI response missing required Terraform files.');
      }

      // Add remaining credits to response
      res.json({
        ...data,
        creditsRemaining: creditResult.remainingBalance,
      });
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Gemini API errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
        throw new ExternalServiceError('AI Service');
      }

      if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
        throw new GenerationError(
          'Request was blocked by safety filters. Please rephrase your architecture description.'
        );
      }

      console.error('Gemini Error:', error);
      throw new GenerationError();
    }
  })
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================================
// AUDIT & POLICY ROUTES
// ============================================================================

// Run audit on template content (inline)
app.post(
  '/api/audit',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { content, provider, templateId } = req.body;

    if (!content || typeof content !== 'string') {
      throw new ValidationError('Terraform content is required');
    }

    if (!provider) {
      throw new ValidationError('Provider is required (aws, azure, gcp)');
    }

    const result = await auditTemplate(content, provider, templateId);

    // Save to database if templateId provided
    if (templateId) {
      await saveAuditReport(templateId, result);
    }

    res.json(result);
  })
);

// Get audit report for a template
app.get(
  '/api/audit/:templateId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { templateId } = req.params as { templateId: string };
    const userId = (req as any).userId;

    // Verify ownership via template -> project -> userId
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { project: true },
    });

    if (!template || template.project.userId !== userId) {
      throw new NotFoundError('Audit report');
    }

    const report = await getLatestAuditReport(templateId);

    if (!report) {
      throw new NotFoundError('Audit report');
    }

    res.json(report);
  })
);

// List all policies
app.get(
  '/api/policies',
  requireAuth,
  asyncHandler(async (req, res) => {
    const policies = await listPolicies();
    res.json(policies);
  })
);

// Toggle policy active status
app.put(
  '/api/policies/:id/toggle',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }

    const policy = await togglePolicy(id, isActive);
    res.json(policy);
  })
);

// ============================================================================
// CREDITS ROUTES
// ============================================================================

// Get credit balance
app.get(
  '/api/credits/balance',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId; // Now guaranteed to be UUID by requireAuth
    const balance = await getCreditBalance(userId);
    res.json({ balance, costs: CREDIT_COSTS, packs: CREDIT_PACKS });
  })
);

// Get transaction history
app.get(
  '/api/credits/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await getTransactionHistory(userId, limit);
    res.json(transactions);
  })
);

// Get usage statistics
app.get(
  '/api/credits/usage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const stats = await getUsageStats(userId);
    res.json(stats);
  })
);

// Check if user has enough credits for action
app.post(
  '/api/credits/check',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { action } = req.body;

    if (!action || !CREDIT_COSTS[action as CreditAction]) {
      throw new ValidationError('Valid action is required');
    }

    const hasCredits = await hasEnoughCredits(userId, action as CreditAction);
    const cost = CREDIT_COSTS[action as CreditAction];
    const balance = await getCreditBalance(userId);

    res.json({ hasCredits, cost, balance });
  })
);

// Paddle Webhook Handler
app.post(
  '/api/webhooks/paddle',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['paddle-signature'] as string;
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing Paddle signature or webhook secret');
      return res.status(400).send('Webhook Error: Missing config');
    }

    const isValid = await verifyPaddleWebhook(signature, req.body.toString(), webhookSecret);
    
    if (!isValid) {
        console.error('Paddle Webhook Signature Verification Failed');
        return res.status(400).send('Webhook Error: Invalid signature');
    }

    const event = JSON.parse(req.body.toString());
    
    // Handle the event
    if (event.event_type === 'transaction.completed') {
      const transaction = event.data;
      const customData = transaction.custom_data; // Paddle stores metadata here
      
      // Determine pack based on items or custom data
      // For simplicity, we can pass packId in custom_data from frontend
      const userId = customData?.userId;
      const packId = customData?.packId; 
      // OR map from transaction.items[0].price.id if we sync price IDs strict
      
      if (userId && packId) {
        console.log(`Processing successful Paddle payment for user ${userId}, pack ${packId}`);
        
        const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
        const credits = pack ? pack.credits : 0;

        if (credits > 0) {
            try {
                await addCredits(
                    userId,
                    credits,
                    transaction.id,
                    `Purchase: ${packId} Pack (Paddle)`
                );
                console.log('Credits added successfully via Paddle webhook');
            } catch (err) {
                console.error('Failed to fulfill order via webhook:', err);
            }
        } else {
             console.warn('Unknown pack or 0 credits for packId:', packId);
        }
      } else {
          console.warn('Paddle webhook received but missing required metadata (userId/packId)', customData);
      }
    }

    res.json({ received: true });
  })
);

/*
// Recharge credits (Mock) - COMMENTED OUT FOR STRIPE INTEGRATION
app.post(
  '/api/credits/recharge',
  requireAuth,
  asyncHandler(async (req, res) => {
    // ... existing mock implementation ...
  })
);
*/

// ============================================================================
// CLOUD INTEGRATION ROUTES
// ============================================================================

// Validate AWS credentials
app.post(
  '/api/cloud/validate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { credentials } = req.body;

    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
      throw new ValidationError('Invalid credentials format');
    }

    // Sanitize - trim whitespace which is a common copy-paste error
    const sanitizedCredentials = {
      accessKeyId: credentials.accessKeyId.trim(),
      secretAccessKey: credentials.secretAccessKey.trim(),
      region: credentials.region.trim(),
    };

    // We DO NOT log credentials here or anywhere else
    const isValid = await validateCredentials(sanitizedCredentials);
    res.json({ isValid });
  })
);

// Run full cloud scan
app.post(
  '/api/cloud/scan',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { credentials } = req.body;
    const userId = (req as any).userId; // Now guaranteed to be UUID by requireAuth

    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
      throw new ValidationError('Invalid credentials format');
    }

    const sanitizedCredentials = {
      accessKeyId: credentials.accessKeyId.trim(),
      secretAccessKey: credentials.secretAccessKey.trim(),
      region: credentials.region.trim(),
    };

    // Validate credentials BEFORE deducting credits
    const isValid = await validateCredentials(sanitizedCredentials);
    if (!isValid) {
      throw new ValidationError('Invalid AWS credentials or insufficient permissions');
    }

    // Deduct credits only after validation succeeds
    const creditResult = await deductCredits(userId, 'CLOUD_SCAN');
    if (!creditResult.success) {
      throw new ValidationError(creditResult.error || 'Insufficient credits');
    }

    try {
      const scanResult = await scanAWSAccount(sanitizedCredentials);

      res.json({
        ...scanResult,
        creditsRemaining: creditResult.remainingBalance
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Cloud scan failed:', error);
      throw new ExternalServiceError('Failed to scan cloud account. Please check permissions.');
    }
  })
);


// Cloud Connections Management (Phase 2)

// GET setup details (Generate External ID for IAM Role)
app.post(
  '/api/cloud/aws/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const result = await generateAWSSetupDetails(userId);
    res.json(result);
  })
);

// Connect AWS Account (Role Assumption)
app.post(
  '/api/cloud/aws/connect',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { name, roleArn, externalId } = req.body;

    if (!name || !roleArn || !externalId) {
      throw new ValidationError('Missing required fields: name, roleArn, externalId');
    }
    
    // Validate ARN format: arn:aws:iam::<12-digit-account-id>:role/<role-name>
    if (!/^arn:aws:iam::\d{12}:role\/[\w+=,.@\-/]+$/.test(roleArn)) {
       throw new ValidationError('Invalid Role ARN format. Expected: arn:aws:iam::<account-id>:role/<role-name>');
    }

    const connection = await createAWSConnection(userId, name, roleArn, externalId);
    res.json(connection);
  })
);

// List Connections
app.get(
  '/api/cloud/connections',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const connections = await listConnections(userId);
    res.json(connections);
  })
);

// Sync Connection (Trigger Scan)
app.post(
  '/api/cloud/connections/:id/sync',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    // Note: Syncing consumes credits in the future, for now free or included in sub
    const { region } = req.body || {};
    const connection = await syncConnection((req.params as { id: string }).id, region, userId);
    res.json(connection);
  })
);

// Scan Connection Report (Ephemeral Security/Cost Scan)
app.post(
  '/api/cloud/connections/:id/scan-report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    // Deduct credits for scan
    const creditResult = await deductCredits(userId, 'CLOUD_SCAN');
    if (!creditResult.success) {
      throw new ValidationError(creditResult.error || 'Insufficient credits');
    }

    const { region } = req.body || {};
    const report = await scanSavedConnection((req.params as { id: string }).id, region, userId);
    res.json({
      ...report,
      creditsRemaining: creditResult.remainingBalance
    });
  })
);

// Get Resources for Connection
app.get(
  '/api/cloud/connections/:id/resources',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const resources = await getConnectionResources((req.params as { id: string }).id, userId);
    res.json(resources);
  })
);



// Generate Recommendations
app.post(
  '/api/cloud/connections/:id/recommendations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    // Verify ownership before generating recommendations
    await verifyConnectionOwnership((req.params as { id: string }).id, userId);
    const { generateRecommendations } = await import('./services/recommendationService');
    const recs = await generateRecommendations((req.params as { id: string }).id);
    res.json(recs);
  })
);

// Get Recommendations
app.get(
  '/api/cloud/connections/:id/recommendations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    // Verify ownership before fetching recommendations
    await verifyConnectionOwnership((req.params as { id: string }).id, userId);
    const { getRecommendations } = await import('./services/recommendationService');
    const recs = await getRecommendations((req.params as { id: string }).id);
    res.json(recs);
  })
);

// Dismiss a Recommendation
app.patch(
  '/api/cloud/connections/:id/recommendations/:recId/dismiss',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    await verifyConnectionOwnership((req.params as { id: string }).id, userId);
    const { dismissRecommendation } = await import('./services/recommendationService');
    const rec = await dismissRecommendation((req.params as { id: string; recId: string }).recId);
    res.json(rec);
  })
);

// Delete Connection
app.delete(
  '/api/cloud/connections/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    await deleteConnection((req.params as { id: string }).id, userId);
    res.json({ success: true });
  })
);

// ============================================================================
// AGENTIC AUTOMATION ENDPOINTS
// ============================================================================

// Get agentic mode status
app.get(
  '/api/agent/mode',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const enabled = await getAgenticMode(userId);
    res.json({ enabled });
  })
);

// Toggle agentic mode
app.post(
  '/api/agent/mode',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      throw new ValidationError('enabled must be a boolean');
    }
    const result = await toggleAgenticMode(userId, enabled);
    res.json({ enabled: result });
  })
);

// Run agent analysis and generate change plan
app.post(
  '/api/agent/analyze',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { templateId, content, provider } = req.body;

    if (!templateId || !content || !provider) {
      throw new ValidationError('templateId, content, and provider are required');
    }

    // Verify template ownership
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { project: { select: { userId: true } } },
    });

    if (!template || template.project.userId !== userId) {
      throw new NotFoundError('Template not found');
    }

    // Check credits
    const hasCredits = await hasEnoughCredits(userId, 'AGENT_ANALYSIS' as CreditAction);
    if (!hasCredits) {
      throw new AppError('Insufficient credits for agent analysis', 402);
    }

    // Deduct credits
    await deductCredits(userId, 'AGENT_ANALYSIS' as CreditAction, templateId);

    const changePlan = await analyzeAndPlan(userId, templateId, content, provider);
    res.json(changePlan);
  })
);

// Apply accepted changes from a change plan
app.post(
  '/api/agent/apply',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { sessionId, acceptedChangeIds } = req.body;

    if (!sessionId || !Array.isArray(acceptedChangeIds) || acceptedChangeIds.length === 0) {
      throw new ValidationError('sessionId and non-empty acceptedChangeIds array are required');
    }

    const result = await applyChanges(userId, sessionId, acceptedChangeIds);
    res.json(result);
  })
);

// Get agent session details
app.get(
  '/api/agent/sessions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const session = await getSession(userId, (req.params as { id: string }).id);
    res.json(session);
  })
);

// List agent sessions
app.get(
  '/api/agent/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const templateId = req.query.templateId as string | undefined;
    const sessions = await listSessions(userId, templateId);
    res.json(sessions);
  })
);

// Cancel an agent session
app.post(
  '/api/agent/sessions/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    await cancelSession(userId, (req.params as { id: string }).id);
    res.json({ success: true });
  })
);

// Get template version history
app.get(
  '/api/templates/:id/versions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const templateId = (req.params as { id: string }).id;
    const userId = (req as any).userId;

    // Verify ownership
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { project: { select: { userId: true } } },
    });

    if (!template || template.project.userId !== userId) {
      throw new NotFoundError('Template not found');
    }

    const versions = await getTemplateVersions(templateId);
    res.json(versions);
  })
);

// Restore a template version
app.post(
  '/api/templates/:id/versions/:versionId/restore',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { id: templateId, versionId } = req.params as { id: string; versionId: string };
    const content = await restoreTemplateVersion(userId, templateId, versionId);
    res.json({ content });
  })
);

// ============================================================================
// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Seed built-in policies
    console.log('Seeding built-in policies...');
    await seedBuiltInPolicies();
    console.log('Policies seeded successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
