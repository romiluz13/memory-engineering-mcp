import { z } from 'zod';
import type { ObjectId } from 'mongodb';

// Memory classes (2 types)
export const MEMORY_CLASSES = ['core', 'working'] as const;
export type MemoryClass = typeof MEMORY_CLASSES[number];

// Memory types - simplified
export const MEMORY_TYPES = ['context', 'event'] as const;
export type MemoryType = typeof MEMORY_TYPES[number];

// Core memory names (NOT files - these are MongoDB documents!)
export const CORE_MEMORY_NAMES = [
  'projectbrief',
  'productContext',  // WHY the project exists (was missing!)
  'systemPatterns', 
  'activeContext',
  'techContext',
  'progress',
  'codebaseMap'      // We added this as bonus
] as const;

// Legacy .md support for backwards compatibility
export const CORE_MEMORY_FILES = CORE_MEMORY_NAMES.map(name => `${name}.md`);

// MongoDB document schema for unified memory collection
export interface MemoryDocument {
  _id?: ObjectId;
  projectId: string;
  
  // Classification
  memoryClass: MemoryClass;
  memoryType: MemoryType;
  
  // Flexible content based on class
  content: {
    // For core memories (stored as MongoDB documents, not files!)
    memoryName?: string;  // e.g., "projectbrief" (no .md extension!)
    fileName?: string;    // DEPRECATED: Legacy field for backward compatibility
    markdown?: string;    // The markdown content
    
    // For working memories (events)
    event?: {
      timestamp: Date;
      action: string;
      context: Record<string, any>;
      solution?: string;
      duration?: number;
      outcome?: {
        success: boolean;
        errors?: Array<{ type: string; message: string }>;
      };
    };
  };
  
  // Search and retrieval
  contentVector?: number[];     // voyage-3-large embeddings (1024 dims)
  searchableText?: string;       // Concatenated for text search
  
  // Metadata
  metadata: {
    importance: number;          // 1-10
    freshness: Date;            // Last access
    accessCount: number;
    autoExpire?: Date;          // TTL for working memories
    tags: string[];
    version?: number;           // For core memories
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Project configuration
export interface ProjectConfig {
  projectId: string;
  projectPath: string;
  name: string;
  createdAt: Date;
  memoryVersion: '2.0';
}

// Zod schemas for validation
export const ProjectConfigSchema = z.object({
  projectId: z.string().uuid(),
  projectPath: z.string(),
  name: z.string(),
  createdAt: z.date(),
  memoryVersion: z.literal('2.0'),
});

// Tool input schemas
export const InitToolSchema = z.object({
  projectPath: z.string().optional(),
  projectName: z.string().optional(),
});

export const ReadToolSchema = z.object({
  fileName: z.string().optional(),
  memoryClass: z.enum(MEMORY_CLASSES).optional(),
  memoryType: z.enum(MEMORY_TYPES).optional(),
  projectPath: z.string().optional(),
});

export const UpdateToolSchema = z.object({
  fileName: z.string().optional(),
  content: z.string().min(1),
  memoryClass: z.enum(MEMORY_CLASSES).optional(),
  memoryType: z.enum(MEMORY_TYPES).optional(),
  projectPath: z.string().optional(),
});

export const SearchToolSchema = z.object({
  query: z.string().min(1),
  projectPath: z.string().optional(),
  limit: z.number().int().positive().max(50).default(10),
  searchType: z.enum(['rankfusion', 'vector', 'text', 'temporal']).default('rankfusion'),
});

export const SyncToolSchema = z.object({
  projectPath: z.string().optional(),
  forceRegenerate: z.boolean().default(false),
});

// Memory creation helpers
export function createCoreMemory(
  projectId: string,
  memoryName: string,  // No .md extension!
  content: string
): Partial<MemoryDocument> {
  // Strip .md if provided for backward compatibility
  const cleanName = memoryName.replace(/\.md$/, '');
  
  return {
    projectId,
    memoryClass: 'core',
    memoryType: 'context',
    content: {
      memoryName: cleanName,  // Store without .md
      markdown: content,
    },
    metadata: {
      importance: 10,
      freshness: new Date(),
      accessCount: 0,
      tags: ['core', cleanName],
      version: 1,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createWorkingMemory(
  projectId: string,
  event: MemoryDocument['content']['event']
): Partial<MemoryDocument> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return {
    projectId,
    memoryClass: 'working',
    memoryType: 'event',
    content: { event },
    metadata: {
      importance: 5,
      freshness: new Date(),
      accessCount: 0,
      autoExpire: thirtyDaysFromNow,
      tags: ['working', event?.action || 'event'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Removed createInsightMemory - simplified to 2 classes
// Removed createEvolutionMemory - simplified to 2 classes