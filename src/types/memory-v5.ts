import { z } from 'zod';
import type { ObjectId } from 'mongodb';

// Cline's 6 core memories + codebaseMap for code embeddings
export const CORE_MEMORY_NAMES = [
  'projectbrief',
  'productContext',
  'activeContext',
  'systemPatterns',
  'techContext',
  'progress',
  'codebaseMap'  // Enhanced with Voyage AI code embeddings
] as const;

export type CoreMemoryName = typeof CORE_MEMORY_NAMES[number];

// Simple MongoDB document schema - just core memories with markdown
export interface MemoryDocument {
  _id?: ObjectId;
  projectId: string;
  memoryName: CoreMemoryName;
  content: string;  // Just markdown content
  contentVector?: number[];  // Voyage AI embeddings for semantic search
  metadata: {
    version: number;
    lastModified: Date;
    accessCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Cline's memory hierarchy
export const MEMORY_HIERARCHY = {
  'projectbrief': {
    dependsOn: [],
    description: 'Foundation document that shapes all other files'
  },
  'productContext': {
    dependsOn: ['projectbrief'],
    description: 'Why this project exists and who needs it'
  },
  'systemPatterns': {
    dependsOn: ['projectbrief'],
    description: 'System architecture and design patterns'
  },
  'techContext': {
    dependsOn: ['projectbrief'],
    description: 'Technologies and development setup'
  },
  'activeContext': {
    dependsOn: ['productContext', 'systemPatterns', 'techContext'],
    description: 'Current work focus and learnings'
  },
  'progress': {
    dependsOn: ['activeContext'],
    description: 'What works and what\'s left to build'
  },
  'codebaseMap': {
    dependsOn: ['projectbrief'],
    description: 'Directory structure and searchable code embeddings'
  }
} as const;

// Tool schemas - simplified
export const InitToolSchema = z.object({
  projectPath: z.string().optional(),
  projectName: z.string().optional()
});

export const ReadAllToolSchema = z.object({
  projectPath: z.string().optional()
});

export const ReadToolSchema = z.object({
  memoryName: z.enum(CORE_MEMORY_NAMES),
  projectPath: z.string().optional()
});

export const UpdateToolSchema = z.object({
  memoryName: z.enum(CORE_MEMORY_NAMES),
  content: z.string().min(1),
  projectPath: z.string().optional()
});

export const SearchToolSchema = z.object({
  query: z.string().min(1),
  projectPath: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(10),
  codeSearch: z.enum(['similar', 'implements', 'uses', 'pattern']).optional(),
  filePath: z.string().optional()
});

// Project configuration
export interface ProjectConfig {
  projectId: string;
  projectPath: string;
  name: string;
  createdAt: Date;
  memoryVersion: string;
}

// Cline's key principle embedded in type
export const CLINE_PRINCIPLE = 
  "I MUST read ALL memory bank files at the start of EVERY task - this is not optional.";

// Code chunk schema for embedding code
export interface CodeChunk {
  _id?: ObjectId;
  projectId: string;
  codebaseMapId: ObjectId;  // Links to parent codebaseMap memory
  
  // File metadata
  filePath: string;
  lastModified: Date;
  
  // Chunk content
  chunk: {
    type: 'function' | 'class' | 'method' | 'module' | 'block';
    name?: string;           // Function/class name
    signature?: string;      // Full signature with params
    content: string;         // Actual code
    context: string;         // Surrounding context (imports, class context)
    startLine: number;
    endLine: number;
  };
  
  // Search optimization
  contentVector: number[];   // voyage-code-3 embedding (1024 dimensions)
  searchableText: string;    // For text search
  
  // Metadata
  metadata: {
    complexity?: number;     // Cyclomatic complexity
    dependencies: string[];  // Imported modules
    exports: string[];      // What this chunk exports
    patterns: string[];     // Detected patterns (e.g., "error-handler", "api-endpoint")
    size: number;           // Lines of code
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Sync options for code
export const SyncCodeSchema = z.object({
  projectPath: z.string().optional(),
  patterns: z.array(z.string()).optional().default(['**/*.ts', '**/*.js', '**/*.py']),
  minChunkSize: z.number().optional().default(5),
  forceRegenerate: z.boolean().optional().default(false),
  includeTests: z.boolean().optional().default(false)
});