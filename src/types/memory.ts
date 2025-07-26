import { z } from 'zod';
import type { ObjectId } from 'mongodb';

// Memory classes for the new 4-class system
export const MEMORY_CLASSES = ['core', 'working', 'insight', 'evolution'] as const;
export type MemoryClass = typeof MEMORY_CLASSES[number];

// Memory types within each class
export const MEMORY_TYPES = ['pattern', 'context', 'event', 'learning', 'meta'] as const;
export type MemoryType = typeof MEMORY_TYPES[number];

// Core memory file names (for backward compatibility)
export const CORE_MEMORY_FILES = [
  'projectbrief.md',
  'systemPatterns.md', 
  'activeContext.md',
  'techContext.md',
  'progress.md',
  'codebaseMap.md'
] as const;

// MongoDB document schema for unified memory collection
export interface MemoryDocument {
  _id?: ObjectId;
  projectId: string;
  
  // Classification
  memoryClass: MemoryClass;
  memoryType: MemoryType;
  
  // Flexible content based on class
  content: {
    // For core memories (markdown files)
    fileName?: string;
    markdown?: string;
    
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
    
    // For insights (patterns)
    insight?: {
      pattern: string;
      confidence: number;
      evidence: ObjectId[];
      discovered: Date;
    };
    
    // For evolution (self-improvement)
    evolution?: {
      query: string;
      resultCount: number;
      feedback?: 'helpful' | 'not_helpful';
      timestamp: Date;
      improvements?: string[];
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
    codeReferences?: Array<{
      file: string;
      line: number;
      snippet: string;
    }>;
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
  fileName: string,
  content: string
): Partial<MemoryDocument> {
  return {
    projectId,
    memoryClass: 'core',
    memoryType: 'context',
    content: {
      fileName,
      markdown: content,
    },
    metadata: {
      importance: 10,
      freshness: new Date(),
      accessCount: 0,
      tags: ['core', fileName.replace('.md', '')],
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

export function createInsightMemory(
  projectId: string,
  insight: MemoryDocument['content']['insight']
): Partial<MemoryDocument> {
  return {
    projectId,
    memoryClass: 'insight',
    memoryType: 'pattern',
    content: { insight },
    metadata: {
      importance: Math.round(insight?.confidence || 5),
      freshness: new Date(),
      accessCount: 0,
      tags: ['insight', 'pattern'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createEvolutionMemory(
  projectId: string,
  evolution: MemoryDocument['content']['evolution']
): Partial<MemoryDocument> {
  return {
    projectId,
    memoryClass: 'evolution',
    memoryType: 'meta',
    content: { evolution },
    metadata: {
      importance: 3,
      freshness: new Date(),
      accessCount: 0,
      tags: ['evolution', 'meta', 'learning'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}