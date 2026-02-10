/**
 * Terraform HCL Parser Utility
 * Recursive balanced-brace parser that handles arbitrary nesting depth,
 * data/module/locals blocks, multi-line values, dynamic blocks, and expressions.
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

export interface TerraformBlock {
  blockType: string;      // "resource", "data", "module", "locals", "variable", "output", "provider", "terraform"
  labels: string[];       // e.g., ["aws_s3_bucket", "main"] for resource
  properties: Record<string, any>;
  startLine: number;
  endLine: number;
  rawBlock: string;
}

export interface ParsedTerraform {
  resources: TerraformResource[];
  dataSources: TerraformResource[];
  modules: TerraformBlock[];
  locals: Record<string, any>;
  variables: Record<string, any>;
  outputs: Record<string, any>;
  providers: string[];
  blocks: TerraformBlock[];
  rawContent: string;
}

/**
 * Main entry point - parse Terraform HCL content
 */
export function parseTerraform(content: string): ParsedTerraform {
  const result: ParsedTerraform = {
    resources: [],
    dataSources: [],
    modules: [],
    locals: {},
    variables: {},
    outputs: {},
    providers: [],
    blocks: [],
    rawContent: content,
  };

  const lines = content.split('\n');
  let pos = 0;

  while (pos < lines.length) {
    // Skip empty lines and comments
    const trimmed = lines[pos].trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      if (trimmed.startsWith('/*')) {
        // Skip multi-line comment
        while (pos < lines.length && !lines[pos].includes('*/')) {
          pos++;
        }
      }
      pos++;
      continue;
    }

    // Match top-level block declarations
    const blockMatch = trimmed.match(/^(resource|data|module|variable|output|provider|terraform|locals)\s*/);
    if (blockMatch) {
      const blockType = blockMatch[1];
      const { block, endPos } = parseTopLevelBlock(lines, pos, blockType);

      if (block) {
        result.blocks.push(block);

        switch (blockType) {
          case 'resource': {
            if (block.labels.length >= 2) {
              result.resources.push({
                type: block.labels[0],
                name: block.labels[1],
                fullName: `${block.labels[0]}.${block.labels[1]}`,
                properties: block.properties,
                startLine: block.startLine,
                endLine: block.endLine,
                rawBlock: block.rawBlock,
              });
            }
            break;
          }
          case 'data': {
            if (block.labels.length >= 2) {
              result.dataSources.push({
                type: block.labels[0],
                name: block.labels[1],
                fullName: `data.${block.labels[0]}.${block.labels[1]}`,
                properties: block.properties,
                startLine: block.startLine,
                endLine: block.endLine,
                rawBlock: block.rawBlock,
              });
            }
            break;
          }
          case 'module': {
            result.modules.push(block);
            break;
          }
          case 'variable': {
            if (block.labels.length >= 1) {
              result.variables[block.labels[0]] = block.properties;
            }
            break;
          }
          case 'output': {
            if (block.labels.length >= 1) {
              result.outputs[block.labels[0]] = block.properties;
            }
            break;
          }
          case 'provider': {
            if (block.labels.length >= 1) {
              result.providers.push(block.labels[0]);
            }
            break;
          }
          case 'locals': {
            Object.assign(result.locals, block.properties);
            break;
          }
        }
      }

      pos = endPos + 1;
      continue;
    }

    pos++;
  }

  return result;
}

/**
 * Parse a top-level block starting at the given line position.
 * Uses balanced-brace counting to handle arbitrary nesting.
 */
function parseTopLevelBlock(
  lines: string[],
  startPos: number,
  blockType: string
): { block: TerraformBlock | null; endPos: number } {
  // Extract labels from the declaration line(s)
  const labels: string[] = [];
  let currentLine = lines[startPos].trim();

  // Remove the block type keyword
  let rest = currentLine.slice(blockType.length).trim();

  // Extract quoted labels: resource "aws_s3_bucket" "main" {
  const labelRegex = /"([^"]+)"/g;
  let labelMatch;
  while ((labelMatch = labelRegex.exec(rest)) !== null) {
    labels.push(labelMatch[1]);
  }

  // Find the opening brace
  let bracePos = startPos;
  while (bracePos < lines.length && !lines[bracePos].includes('{')) {
    bracePos++;
  }

  if (bracePos >= lines.length) {
    return { block: null, endPos: startPos };
  }

  // Use balanced-brace counting to find the end of this block
  const { endPos, content: blockContent } = findBalancedBrace(lines, bracePos);

  // Extract the raw block text
  const rawLines = lines.slice(startPos, endPos + 1);
  const rawBlock = rawLines.join('\n');

  // Parse the inner content (everything between the outermost braces)
  const innerContent = extractInnerContent(lines, bracePos, endPos);
  const properties = parseBlockContent(innerContent);

  return {
    block: {
      blockType,
      labels,
      properties,
      startLine: startPos + 1, // 1-indexed
      endLine: endPos + 1,     // 1-indexed
      rawBlock,
    },
    endPos,
  };
}

/**
 * Find the matching closing brace using balanced counting.
 * Handles nested braces at any depth.
 */
function findBalancedBrace(
  lines: string[],
  startPos: number
): { endPos: number; content: string } {
  let depth = 0;
  let pos = startPos;
  const contentLines: string[] = [];
  let foundOpen = false;

  while (pos < lines.length) {
    const line = lines[pos];
    contentLines.push(line);

    // Process each character, skipping strings and comments
    const chars = line.split('');
    let inString = false;
    let escaped = false;

    for (let i = 0; i < chars.length; i++) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (chars[i] === '\\') {
        escaped = true;
        continue;
      }

      if (chars[i] === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      // Check for line comment
      if (chars[i] === '#') break;
      if (chars[i] === '/' && i + 1 < chars.length && chars[i + 1] === '/') break;

      if (chars[i] === '{') {
        depth++;
        foundOpen = true;
      } else if (chars[i] === '}') {
        depth--;
        if (depth === 0 && foundOpen) {
          return { endPos: pos, content: contentLines.join('\n') };
        }
      }
    }

    pos++;
  }

  // If we never found a balanced close, return to end of file
  return { endPos: lines.length - 1, content: contentLines.join('\n') };
}

/**
 * Extract the content between the outermost braces
 */
function extractInnerContent(lines: string[], braceLineStart: number, braceLineEnd: number): string[] {
  const result: string[] = [];

  for (let i = braceLineStart; i <= braceLineEnd; i++) {
    result.push(lines[i]);
  }

  // Remove the first opening brace and last closing brace
  if (result.length > 0) {
    const firstLine = result[0];
    const braceIdx = firstLine.indexOf('{');
    if (braceIdx >= 0) {
      result[0] = firstLine.slice(braceIdx + 1);
    }
  }

  if (result.length > 0) {
    const lastLine = result[result.length - 1];
    const braceIdx = lastLine.lastIndexOf('}');
    if (braceIdx >= 0) {
      result[result.length - 1] = lastLine.slice(0, braceIdx);
    }
  }

  return result;
}

/**
 * Parse the content inside a block, handling nested blocks and key-value pairs.
 */
function parseBlockContent(lines: string[]): Record<string, any> {
  const properties: Record<string, any> = {};
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      i++;
      continue;
    }

    // Skip multi-line comments
    if (trimmed.startsWith('/*')) {
      while (i < lines.length && !lines[i].includes('*/')) {
        i++;
      }
      i++;
      continue;
    }

    // Check for nested block: `block_name {` or `block_name "label" {`
    const nestedBlockMatch = trimmed.match(/^(\w+)\s+(?:"([^"]+)"\s+)?(?:"([^"]+)"\s+)?\{/);
    if (nestedBlockMatch && !trimmed.includes('=')) {
      const blockName = nestedBlockMatch[1];
      const { endPos } = findBalancedBrace(lines, i);
      const innerContent = extractInnerContent(lines, i, endPos);
      const nestedProps = parseBlockContent(innerContent);

      // Handle dynamic blocks
      if (blockName === 'dynamic') {
        const dynamicName = nestedBlockMatch[2];
        if (dynamicName) {
          properties[dynamicName] = nestedProps.content || nestedProps;
        }
      } else {
        // If the block name already exists, convert to array (multiple ingress blocks, etc.)
        if (blockName in properties) {
          if (!Array.isArray(properties[blockName])) {
            properties[blockName] = [properties[blockName]];
          }
          properties[blockName].push(nestedProps);
        } else {
          properties[blockName] = nestedProps;
        }
      }

      i = endPos + 1;
      continue;
    }

    // Check for key = value
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      // Check if value starts a multi-line structure
      if (rawValue === '{' || rawValue.endsWith('{')) {
        // Inline map/object - parse as nested block
        const { endPos } = findBalancedBrace(lines, i);
        const innerContent = extractInnerContent(lines, i, endPos);
        properties[key] = parseBlockContent(innerContent);
        i = endPos + 1;
        continue;
      }

      if (rawValue === '[' || (rawValue.startsWith('[') && !rawValue.endsWith(']'))) {
        // Multi-line array
        const arrayContent = collectUntilClosing(lines, i, '[', ']');
        properties[key] = parseArrayValue(arrayContent);
        i += arrayContent.split('\n').length;
        continue;
      }

      if (rawValue.startsWith('<<') || rawValue.startsWith('<<-')) {
        // Heredoc
        const heredocMatch = rawValue.match(/^<<-?\s*(\w+)/);
        if (heredocMatch) {
          const delimiter = heredocMatch[1];
          const heredocLines: string[] = [];
          i++;
          while (i < lines.length && !lines[i].trim().startsWith(delimiter)) {
            heredocLines.push(lines[i]);
            i++;
          }
          properties[key] = heredocLines.join('\n');
          i++;
          continue;
        }
      }

      // Single-line value
      properties[key] = parseValue(rawValue);
      i++;
      continue;
    }

    i++;
  }

  return properties;
}

/**
 * Collect lines until we find the balanced closing bracket
 */
function collectUntilClosing(lines: string[], startPos: number, open: string, close: string): string {
  let depth = 0;
  const collected: string[] = [];

  for (let i = startPos; i < lines.length; i++) {
    collected.push(lines[i]);
    for (const ch of lines[i]) {
      if (ch === open) depth++;
      if (ch === close) depth--;
      if (depth === 0) return collected.join('\n');
    }
  }

  return collected.join('\n');
}

/**
 * Parse an array value (possibly multi-line)
 */
function parseArrayValue(raw: string): any[] {
  // Remove outer brackets
  const trimmed = raw.trim();
  let inner = trimmed;

  // Find the content between [ and ]
  const startIdx = inner.indexOf('[');
  const endIdx = inner.lastIndexOf(']');
  if (startIdx >= 0 && endIdx > startIdx) {
    inner = inner.slice(startIdx + 1, endIdx);
  }

  // Split by commas (respecting strings and nested structures)
  const items: string[] = [];
  let current = '';
  let depth = 0;
  let inStr = false;
  let escaped = false;

  for (const ch of inner) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      current += ch;
      continue;
    }
    if (inStr) {
      current += ch;
      continue;
    }
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    if (ch === ']' || ch === '}' || ch === ')') depth--;

    if (ch === ',' && depth === 0) {
      const item = current.trim();
      if (item) items.push(item);
      current = '';
    } else {
      current += ch;
    }
  }

  const lastItem = current.trim();
  if (lastItem) items.push(lastItem);

  return items.map(item => parseValue(item)).filter(v => v !== '' && v !== undefined);
}

/**
 * Parse a single HCL value
 */
function parseValue(rawValue: string): any {
  let trimmed = rawValue.trim();

  // Remove trailing comma
  if (trimmed.endsWith(',')) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  // Remove trailing comment
  const commentIdx = findUnquotedChar(trimmed, '#');
  if (commentIdx >= 0) {
    trimmed = trimmed.slice(0, commentIdx).trim();
  }
  const slashCommentIdx = findUnquotedString(trimmed, '//');
  if (slashCommentIdx >= 0) {
    trimmed = trimmed.slice(0, slashCommentIdx).trim();
  }

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Null
  if (trimmed === 'null') return null;

  // Number (integer)
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  // Number (float)
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // String (quoted)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // Array (single-line)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseArrayValue(trimmed);
  }

  // Map/object (single-line) like { key = "value" }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return {};
    const props: Record<string, any> = {};
    // Simple single-line map parsing
    const pairs = inner.split(',');
    for (const pair of pairs) {
      const pairMatch = pair.trim().match(/^(\w+)\s*=\s*(.+)$/);
      if (pairMatch) {
        props[pairMatch[1]] = parseValue(pairMatch[2]);
      }
    }
    return Object.keys(props).length > 0 ? props : trimmed;
  }

  // Reference or expression (var.xxx, local.xxx, module.xxx, etc.)
  return trimmed;
}

/**
 * Find the position of an unquoted character
 */
function findUnquotedChar(str: string, char: string): number {
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (str[i] === '\\') { escaped = true; continue; }
    if (str[i] === '"') { inStr = !inStr; continue; }
    if (!inStr && str[i] === char) return i;
  }
  return -1;
}

/**
 * Find the position of an unquoted string
 */
function findUnquotedString(str: string, search: string): number {
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < str.length - search.length + 1; i++) {
    if (escaped) { escaped = false; continue; }
    if (str[i] === '\\') { escaped = true; continue; }
    if (str[i] === '"') { inStr = !inStr; continue; }
    if (!inStr && str.slice(i, i + search.length) === search) return i;
  }
  return -1;
}

// ============================================================================
// Utility functions (backwards-compatible API)
// ============================================================================

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
 * Find data sources by type
 */
export function findDataSourcesByType(
  parsed: ParsedTerraform,
  type: string
): TerraformResource[] {
  return parsed.dataSources.filter(r => r.type === type);
}

/**
 * Check if a resource has a specific property
 */
export function hasProperty(
  resource: TerraformResource,
  property: string
): boolean {
  return getProperty(resource, property) !== undefined;
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
    // Handle array access for repeated blocks (e.g., ingress[0])
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (Array.isArray(current)) {
        current = current[parseInt(arrayMatch[2], 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Find all blocks of a given type (resource, data, module, etc.)
 */
export function findBlocksByType(
  parsed: ParsedTerraform,
  blockType: string
): TerraformBlock[] {
  return parsed.blocks.filter(b => b.blockType === blockType);
}
