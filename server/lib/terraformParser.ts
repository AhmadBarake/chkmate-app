/**
 * Terraform HCL Parser Utility
 * Parses Terraform configuration files to extract resources and their properties
 */

export interface TerraformResource {
  type: string;           // e.g., "aws_s3_bucket"
  name: string;           // e.g., "main"
  fullName: string;       // e.g., "aws_s3_bucket.main"
  properties: Record<string, any>;
  startLine?: number;
  endLine?: number;
  rawBlock: string;
}

export interface ParsedTerraform {
  resources: TerraformResource[];
  variables: Record<string, any>;
  outputs: Record<string, any>;
  providers: string[];
  rawContent: string;
}

/**
 * Simple HCL parser for Terraform files
 * Note: This is a simplified parser for common patterns. 
 * For production, consider using a proper HCL parser library.
 */
export function parseTerraform(content: string): ParsedTerraform {
  const result: ParsedTerraform = {
    resources: [],
    variables: {},
    outputs: {},
    providers: [],
    rawContent: content,
  };

  // Extract resources using regex
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;

  while ((match = resourceRegex.exec(content)) !== null) {
    const [fullMatch, resourceType, resourceName, blockContent] = match;
    const startLine = content.substring(0, match.index).split('\n').length;
    const endLine = startLine + fullMatch.split('\n').length - 1;

    result.resources.push({
      type: resourceType,
      name: resourceName,
      fullName: `${resourceType}.${resourceName}`,
      properties: parseBlockProperties(blockContent),
      startLine,
      endLine,
      rawBlock: fullMatch,
    });
  }

  // Extract providers
  const providerRegex = /provider\s+"([^"]+)"/g;
  while ((match = providerRegex.exec(content)) !== null) {
    result.providers.push(match[1]);
  }

  // Extract variables
  const variableRegex = /variable\s+"([^"]+)"\s*\{([^}]*)\}/gs;
  while ((match = variableRegex.exec(content)) !== null) {
    result.variables[match[1]] = parseBlockProperties(match[2]);
  }

  // Extract outputs
  const outputRegex = /output\s+"([^"]+)"\s*\{([^}]*)\}/gs;
  while ((match = outputRegex.exec(content)) !== null) {
    result.outputs[match[1]] = parseBlockProperties(match[2]);
  }

  return result;
}

/**
 * Parse block properties from HCL content
 */
function parseBlockProperties(blockContent: string): Record<string, any> {
  const properties: Record<string, any> = {};
  const lines = blockContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    // Match key = value patterns
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const [, key, rawValue] = kvMatch;
      properties[key] = parseValue(rawValue);
    }

    // Match nested blocks like "block_name { ... }"
    const nestedBlockMatch = trimmed.match(/^(\w+)\s*\{/);
    if (nestedBlockMatch) {
      const blockName = nestedBlockMatch[1];
      // Mark that this block exists (simplified)
      properties[blockName] = properties[blockName] || true;
    }
  }

  return properties;
}

/**
 * Parse a value from HCL
 */
function parseValue(rawValue: string): any {
  const trimmed = rawValue.trim();

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // String (quoted)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // Array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      // Simple array parsing
      const inner = trimmed.slice(1, -1);
      return inner.split(',').map(v => parseValue(v.trim())).filter(v => v !== '');
    } catch {
      return trimmed;
    }
  }

  // Reference or expression
  return trimmed;
}

/**
 * Find resources by type
 */
export function findResourcesByType(
  parsed: ParsedTerraform,
  type: string
): TerraformResource[] {
  return parsed.resources.filter(r => r.type === type);
}

/**
 * Check if a resource has a specific property
 */
export function hasProperty(
  resource: TerraformResource,
  property: string
): boolean {
  return property in resource.properties;
}

/**
 * Get property value, supporting nested paths like "versioning.enabled"
 */
export function getProperty(
  resource: TerraformResource,
  path: string
): any {
  const parts = path.split('.');
  let current: any = resource.properties;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}
