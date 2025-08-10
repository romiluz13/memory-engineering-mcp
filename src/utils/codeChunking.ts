import { readFile } from 'fs/promises';
import { extname } from 'path';
import type { CodeChunk } from '../types/memory-v5.js';

// Extract meaningful chunks from a file using simple pattern-based approach
export async function chunkFile(
  filePath: string,
  projectId: string,
  codebaseMapId: string
): Promise<Omit<CodeChunk, '_id' | 'contentVector' | 'createdAt' | 'updatedAt'>[]> {
  const content = await readFile(filePath, 'utf-8');
  const lastModified = new Date();

  // Use pattern-based chunking for all file types
  // This is simpler and more reliable than AST parsing
  return chunkByPatterns(content, filePath, projectId, codebaseMapId, lastModified);
}

// Smart semantic boundary detection for complete chunks
function findSemanticBoundary(lines: string[], startIdx: number, maxLines: number = 200): number {
  let braceCount = 0;
  let parenCount = 0;
  let inBlock = false;
  const baseIndent = lines[startIdx]?.match(/^(\s*)/)?.[1].length || 0;
  
  for (let i = startIdx; i < Math.min(lines.length, startIdx + maxLines); i++) {
    const line = lines[i];
    const currentIndent = line.match(/^(\s*)/)?.[1].length || 0;
    
    // Track braces and parentheses
    for (const char of line) {
      if (char === '{') { braceCount++; inBlock = true; }
      else if (char === '}') { braceCount--; }
      else if (char === '(') { parenCount++; }
      else if (char === ')') { parenCount--; }
    }
    
    // Function/class ended when:
    // 1. Braces are balanced and we were in a block
    // 2. Indentation returns to base level or less
    // 3. Next function/class starts
    if (inBlock && braceCount === 0 && parenCount === 0) {
      return i + 1; // Found complete semantic unit!
    }
    
    // Python/indentation-based: check indent level
    if (i > startIdx + 5 && currentIndent <= baseIndent && line.trim().length > 0) {
      // Back to original indent = function ended
      return i;
    }
    
    // Safety: if we see another function/class definition
    if (i > startIdx + 10) {
      const isNewBlock = /^(export\s+)?(async\s+)?(function|class|interface|def|func|fn)\s+/.test(line.trim());
      if (isNewBlock) return i;
    }
  }
  
  // Fallback: take up to maxLines
  return Math.min(startIdx + maxLines, lines.length);
}

// Extract imports and top-level context
function extractContext(lines: string[], upToLine: number): string {
  const contextLines: string[] = [];
  const importPattern = /^(import|from|require|use|using|include)/;
  
  for (let i = 0; i < Math.min(upToLine, lines.length); i++) {
    const line = lines[i].trim();
    if (importPattern.test(line) || line.startsWith('//') || line.startsWith('/*')) {
      contextLines.push(lines[i]);
    }
  }
  
  return contextLines.join('\n');
}

// Generic pattern-based chunking for all languages
function chunkByPatterns(
  content: string,
  filePath: string,
  projectId: string,
  codebaseMapId: string,
  lastModified: Date
): Omit<CodeChunk, '_id' | 'contentVector' | 'createdAt' | 'updatedAt'>[] {
  const chunks: Omit<CodeChunk, '_id' | 'contentVector' | 'createdAt' | 'updatedAt'>[] = [];
  const lines = content.split('\n');
  
  // Extract file-level context (imports, comments)
  const fileContext = extractContext(lines, 50);
  
  // Common patterns for functions/methods across languages
  const functionPatterns = [
    /function\s+(\w+)/,          // JavaScript/TypeScript
    /(\w+)\s*:\s*function/,       // Object methods
    /(\w+)\s*=\s*function/,       // Variable functions
    /(\w+)\s*=\s*\([^)]*\)\s*=>/,// Arrow functions
    /export\s+function\s+(\w+)/,  // Export functions
    /async\s+function\s+(\w+)/,   // Async functions
    /def\s+(\w+)/,                // Python
    /func\s+(\w+)/,               // Go
    /fn\s+(\w+)/,                 // Rust
    /public\s+\w+\s+(\w+)\s*\(/,  // Java/C#
    /private\s+\w+\s+(\w+)\s*\(/, // Java/C#
  ];
  
  // Class patterns
  const classPatterns = [
    /class\s+(\w+)/,              // Most languages
    /export\s+class\s+(\w+)/,     // TypeScript/JavaScript
    /interface\s+(\w+)/,          // TypeScript/Java/C#
    /struct\s+(\w+)/,             // C/Go/Rust
    /enum\s+(\w+)/,               // Various languages
    /type\s+(\w+)\s*=/,           // TypeScript type aliases
  ];
  
  // Find functions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1];
        const startLine = i + 1;
        const endLine = findSemanticBoundary(lines, i); // SMART boundary detection!
        
        chunks.push({
          projectId,
          codebaseMapId: codebaseMapId as any,
          filePath,
          lastModified,
          chunk: {
            type: 'function',
            name,
            signature: line.trim(),
            content: lines.slice(i, endLine).join('\n'),
            context: fileContext, // Include imports and top-level context!
            startLine,
            endLine
          },
          searchableText: `${name} function ${extname(filePath)}`,
          metadata: {
            dependencies: [],
            exports: [name],
            patterns: detectPatterns(name, lines.slice(i, endLine).join('\n')),
            size: endLine - startLine
          }
        });
        break;
      }
    }
    
    // Find classes
    for (const pattern of classPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1];
        const startLine = i + 1;
        const endLine = findSemanticBoundary(lines, i, 300); // SMART boundary for classes (up to 300 lines)
        
        chunks.push({
          projectId,
          codebaseMapId: codebaseMapId as any,
          filePath,
          lastModified,
          chunk: {
            type: 'class',
            name,
            signature: line.trim(),
            content: lines.slice(i, endLine).join('\n'),
            context: fileContext, // Include imports and top-level context!
            startLine,
            endLine
          },
          searchableText: `${name} class ${extname(filePath)}`,
          metadata: {
            dependencies: [],
            exports: [name],
            patterns: detectPatterns(name, lines.slice(i, endLine).join('\n')),
            size: endLine - startLine
          }
        });
        break;
      }
    }
  }
  
  // If no specific chunks found, create a file-level chunk
  if (chunks.length === 0) {
    chunks.push({
      projectId,
      codebaseMapId: codebaseMapId as any,
      filePath,
      lastModified,
      chunk: {
        type: 'module',
        name: filePath.split('/').pop() || filePath,
        signature: '',
        content: content.substring(0, 2000), // First 2000 chars
        context: '',
        startLine: 1,
        endLine: lines.length
      },
      searchableText: `${filePath} file content`,
      metadata: {
        dependencies: [],
        exports: [],
        patterns: [],
        size: lines.length
      }
    });
  }
  
  return chunks;
}

function detectPatterns(name: string, content?: string): string[] {
  const patterns: string[] = [];
  const lowerName = name.toLowerCase();
  const lowerContent = content?.toLowerCase() || '';
  
  // Detect common patterns from name
  if (lowerName.includes('handler') || lowerName.includes('handle')) patterns.push('event-handler');
  if (lowerName.includes('middleware')) patterns.push('middleware');
  if (lowerName.includes('controller')) patterns.push('controller');
  if (lowerName.includes('service')) patterns.push('service');
  if (lowerName.includes('repository') || lowerName.includes('repo')) patterns.push('repository');
  if (lowerName.includes('error') || lowerName.includes('exception')) patterns.push('error-handler');
  if (lowerName.includes('auth') || lowerName.includes('login')) patterns.push('authentication');
  if (lowerName.includes('test') || lowerName.includes('spec')) patterns.push('test');
  if (lowerName.includes('util') || lowerName.includes('utils')) patterns.push('utility');
  if (lowerName.includes('helper')) patterns.push('helper');
  if (lowerName.includes('model') || lowerName.includes('schema')) patterns.push('model');
  if (lowerName.includes('route') || lowerName.includes('router')) patterns.push('router');
  if (lowerName.includes('api')) patterns.push('api');
  if (lowerName.includes('db') || lowerName.includes('database')) patterns.push('database');
  if (lowerName.includes('cache')) patterns.push('cache');
  if (lowerName.includes('queue')) patterns.push('queue');
  if (lowerName.includes('logger') || lowerName.includes('log')) patterns.push('logging');
  if (lowerName.includes('config')) patterns.push('configuration');
  if (lowerName.includes('validator') || lowerName.includes('validate')) patterns.push('validation');
  
  // Detect patterns from content
  if (content && content.length > 0) {
    // Error handling patterns
    if (lowerContent.includes('try') && lowerContent.includes('catch')) patterns.push('error-handling');
    if (lowerContent.includes('throw') || lowerContent.includes('error')) patterns.push('error-handling');
    
    // Async patterns
    if (lowerContent.includes('async') || lowerContent.includes('await')) patterns.push('async');
    if (lowerContent.includes('promise')) patterns.push('promise');
    
    // Common patterns
    if (lowerContent.includes('export') || lowerContent.includes('module.exports')) patterns.push('module');
    if (lowerContent.includes('import') || lowerContent.includes('require')) patterns.push('dependency');
    if (lowerContent.includes('class')) patterns.push('class-based');
    if (lowerContent.includes('function')) patterns.push('functional');
    if (lowerContent.includes('interface') || lowerContent.includes('type')) patterns.push('typescript');
  }
  
  // Remove duplicates
  return [...new Set(patterns)];
}