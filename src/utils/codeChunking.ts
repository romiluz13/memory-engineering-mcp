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
        const endLine = Math.min(i + 50, lines.length); // Take next 50 lines or until end
        
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
            context: '',
            startLine,
            endLine
          },
          searchableText: `${name} function ${extname(filePath)}`,
          metadata: {
            dependencies: [],
            exports: [name],
            patterns: detectPatterns(name),
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
        const endLine = Math.min(i + 100, lines.length); // Take next 100 lines for classes
        
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
            context: '',
            startLine,
            endLine
          },
          searchableText: `${name} class ${extname(filePath)}`,
          metadata: {
            dependencies: [],
            exports: [name],
            patterns: detectPatterns(name),
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

function detectPatterns(name: string): string[] {
  const patterns: string[] = [];
  const lowerName = name.toLowerCase();
  
  // Detect common patterns
  if (lowerName.includes('handler')) patterns.push('event-handler');
  if (lowerName.includes('middleware')) patterns.push('middleware');
  if (lowerName.includes('controller')) patterns.push('controller');
  if (lowerName.includes('service')) patterns.push('service');
  if (lowerName.includes('repository')) patterns.push('repository');
  if (lowerName.includes('error')) patterns.push('error-handler');
  if (lowerName.includes('auth')) patterns.push('authentication');
  if (lowerName.includes('test')) patterns.push('test');
  if (lowerName.includes('util')) patterns.push('utility');
  if (lowerName.includes('helper')) patterns.push('helper');
  
  return patterns;
}