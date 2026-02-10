/**
 * Sandbox - Isolated Terraform Execution Environment
 * Creates temporary workspaces for running terraform plan/apply.
 * Each deployment gets its own isolated directory with cleanup.
 */

import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const TERRAFORM_TIMEOUT = 5 * 60 * 1000; // 5 minutes per command
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB max output

export interface TerraformCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

export interface PlanResult {
  success: boolean;
  output: string;
  planFile?: string;    // Path to binary plan file
  summary: {
    add: number;
    change: number;
    destroy: number;
  };
  error?: string;
}

export interface ApplyResult {
  success: boolean;
  output: string;
  stateContent?: string;
  error?: string;
}

export interface DestroyResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Create an isolated workspace directory for a deployment
 */
export async function createWorkspace(deploymentId: string): Promise<string> {
  const workDir = path.join(os.tmpdir(), 'chkmate-deploy', deploymentId);
  await fs.mkdir(workDir, { recursive: true });
  return workDir;
}

/**
 * Write Terraform files to the workspace
 */
export async function writeTemplateFiles(
  workDir: string,
  templateContent: string,
  credentials: TerraformCredentials
): Promise<void> {
  // Write the main terraform file
  await fs.writeFile(path.join(workDir, 'main.tf'), templateContent, 'utf8');

  // Write a provider override with credentials
  const providerOverride = `
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region     = "${credentials.region}"
  access_key = "${credentials.accessKeyId}"
  secret_key = "${credentials.secretAccessKey}"
  ${credentials.sessionToken ? `token      = "${credentials.sessionToken}"` : ''}

  default_tags {
    tags = {
      ManagedBy = "chkmate"
      DeployedVia = "chkmate-agentic"
    }
  }
}
`;
  await fs.writeFile(path.join(workDir, 'provider_override.tf'), providerOverride, 'utf8');
}

/**
 * Run terraform init in the workspace
 */
export async function terraformInit(workDir: string): Promise<{ success: boolean; output: string; error?: string }> {
  return runTerraform(workDir, ['init', '-no-color', '-input=false']);
}

/**
 * Run terraform plan and produce a saved plan file
 */
export async function terraformPlan(workDir: string): Promise<PlanResult> {
  const planFile = path.join(workDir, 'tfplan');

  const result = await runTerraform(workDir, [
    'plan',
    '-no-color',
    '-input=false',
    '-detailed-exitcode',
    `-out=${planFile}`,
  ]);

  // Parse plan summary from output
  const summary = parsePlanSummary(result.output);

  // Exit code 2 means changes detected (success with diff)
  const success = result.success || result.output.includes('Plan:');

  return {
    success,
    output: result.output,
    planFile: success ? planFile : undefined,
    summary,
    error: success ? undefined : result.error,
  };
}

/**
 * Run terraform apply using a saved plan
 */
export async function terraformApply(workDir: string): Promise<ApplyResult> {
  const planFile = path.join(workDir, 'tfplan');

  const result = await runTerraform(workDir, [
    'apply',
    '-no-color',
    '-input=false',
    '-auto-approve',
    planFile,
  ]);

  // Read the state file if apply succeeded
  let stateContent: string | undefined;
  if (result.success) {
    try {
      const statePath = path.join(workDir, 'terraform.tfstate');
      stateContent = await fs.readFile(statePath, 'utf8');
    } catch {
      // State file may not exist if no resources were created
    }
  }

  return {
    success: result.success,
    output: result.output,
    stateContent,
    error: result.success ? undefined : result.error,
  };
}

/**
 * Run terraform destroy
 */
export async function terraformDestroy(
  workDir: string,
  stateContent?: string
): Promise<DestroyResult> {
  // Write state file if provided
  if (stateContent) {
    const statePath = path.join(workDir, 'terraform.tfstate');
    await fs.writeFile(statePath, stateContent, 'utf8');
  }

  const result = await runTerraform(workDir, [
    'destroy',
    '-no-color',
    '-input=false',
    '-auto-approve',
  ]);

  return {
    success: result.success,
    output: result.output,
    error: result.success ? undefined : result.error,
  };
}

/**
 * Clean up a workspace directory
 */
export async function cleanupWorkspace(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Run a terraform command in the given directory
 */
function runTerraform(
  workDir: string,
  args: string[]
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      TF_IN_AUTOMATION: 'true',
      TF_CLI_ARGS: '-no-color',
      // Prevent terraform from trying to download providers interactively
      TF_INPUT: '0',
    };

    const proc = execFile('terraform', args, {
      cwd: workDir,
      env,
      timeout: TERRAFORM_TIMEOUT,
      maxBuffer: MAX_OUTPUT_SIZE,
    }, (error, stdout, stderr) => {
      const output = (stdout || '') + (stderr ? '\n' + stderr : '');

      if (error) {
        resolve({
          success: false,
          output: output.slice(0, MAX_OUTPUT_SIZE),
          error: error.message,
        });
      } else {
        resolve({
          success: true,
          output: output.slice(0, MAX_OUTPUT_SIZE),
        });
      }
    });
  });
}

/**
 * Parse the plan summary line: "Plan: X to add, Y to change, Z to destroy"
 */
function parsePlanSummary(output: string): { add: number; change: number; destroy: number } {
  const match = output.match(/Plan:\s*(\d+)\s*to add,\s*(\d+)\s*to change,\s*(\d+)\s*to destroy/);
  if (match) {
    return {
      add: parseInt(match[1], 10),
      change: parseInt(match[2], 10),
      destroy: parseInt(match[3], 10),
    };
  }

  // Check for "No changes" case
  if (output.includes('No changes') || output.includes('Infrastructure is up-to-date')) {
    return { add: 0, change: 0, destroy: 0 };
  }

  return { add: 0, change: 0, destroy: 0 };
}

/**
 * Check if terraform binary is available
 */
export async function checkTerraformAvailable(): Promise<{ available: boolean; version?: string }> {
  return new Promise((resolve) => {
    execFile('terraform', ['version', '-json'], { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve({ available: false });
        return;
      }
      try {
        const versionInfo = JSON.parse(stdout);
        resolve({ available: true, version: versionInfo.terraform_version });
      } catch {
        resolve({ available: true, version: stdout.trim().split('\n')[0] });
      }
    });
  });
}
