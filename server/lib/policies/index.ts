/**
 * Policy Index - Aggregates all built-in policies
 */

import { PolicyDefinition } from './types.js';
import { AWS_SECURITY_POLICIES } from './awsSecurity.js';
import { AWS_COST_POLICIES } from './awsCost.js';

// All built-in policies
export const BUILT_IN_POLICIES: PolicyDefinition[] = [
  ...AWS_SECURITY_POLICIES,
  ...AWS_COST_POLICIES,
];

// Get policies by provider
export function getPoliciesByProvider(provider: string): PolicyDefinition[] {
  return BUILT_IN_POLICIES.filter(
    p => p.provider === provider || p.provider === 'all'
  );
}

// Get policies by category
export function getPoliciesByCategory(category: string): PolicyDefinition[] {
  return BUILT_IN_POLICIES.filter(p => p.category === category);
}

// Get policy by code
export function getPolicyByCode(code: string): PolicyDefinition | undefined {
  return BUILT_IN_POLICIES.find(p => p.code === code);
}

// Export types
export * from './types.js';
