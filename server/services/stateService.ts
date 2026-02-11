/**
 * State Service
 * Encrypted Terraform state file management.
 * Uses AES-256-GCM for encryption at rest with per-deployment keys.
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Server-side master key for encryption (MUST be set in env for production)
const MASTER_KEY = process.env.STATE_ENCRYPTION_KEY || '';
if (!MASTER_KEY) {
  console.warn('Warning: STATE_ENCRYPTION_KEY is not set. Encryption will use an empty key — set this in production!');
}

/**
 * Derive a per-deployment encryption key from master key + deployment ID
 */
function deriveKey(deploymentId: string): Buffer {
  return crypto.scryptSync(MASTER_KEY, deploymentId, 32);
}

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(data: string, deploymentId: string): string {
  const key = deriveKey(deploymentId);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Store as iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encryptedData: string, deploymentId: string): string {
  const key = deriveKey(deploymentId);
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format: expected iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, ciphertext] = parts;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message || 'unknown error'}`);
  }
}

/**
 * Store encrypted Terraform state for a deployment
 */
export async function storeState(deploymentId: string, stateContent: string): Promise<void> {
  const encryptedState = encrypt(stateContent, deploymentId);

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { stateFile: encryptedState },
  });
}

/**
 * Retrieve and decrypt Terraform state for a deployment
 */
export async function retrieveState(deploymentId: string): Promise<string | null> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    select: { stateFile: true },
  });

  if (!deployment?.stateFile) return null;

  try {
    return decrypt(deployment.stateFile, deploymentId);
  } catch (error: any) {
    console.error(`Failed to decrypt state for deployment ${deploymentId}:`, error.message);
    return null;
  }
}

/**
 * Delete state for a deployment (cleanup)
 */
export async function deleteState(deploymentId: string): Promise<void> {
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { stateFile: null },
  });
}

/**
 * Encrypt a role ARN for storage
 */
export function encryptRoleArn(roleArn: string, credentialId: string): string {
  return encrypt(roleArn, credentialId);
}

/**
 * Decrypt a stored role ARN
 */
export function decryptRoleArn(encryptedArn: string, credentialId: string): string {
  return decrypt(encryptedArn, credentialId);
}
