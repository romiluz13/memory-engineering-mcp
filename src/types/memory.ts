import { z } from 'zod';
import type { ObjectId } from 'mongodb';

// Memory file types
export const MEMORY_FILE_TYPES = [
  'projectbrief',
  'productContext', 
  'activeContext',
  'systemPatterns',
  'techContext',
  'progress',
  'custom',
] as const;

export type MemoryFileType = typeof MEMORY_FILE_TYPES[number];

// MongoDB document schema
export interface MemoryDocument {
  _id?: ObjectId;
  projectId: string;
  fileName: string;
  content: string;
  contentVector?: number[];
  metadata: {
    lastUpdated: Date;
    version: number;
    type: MemoryFileType;
    fileSize: number;
    researchId?: string;
    prpGenerated?: boolean;
  };
  references: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const ProjectConfigSchema = z.object({
  projectId: z.string().uuid(),
  projectPath: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const MemoryFileSchema = z.object({
  fileName: z.string().regex(/^[a-zA-Z0-9-_]+\.md$/),
  content: z.string().min(1),
  type: z.enum(MEMORY_FILE_TYPES),
});

export type MemoryFile = z.infer<typeof MemoryFileSchema>;

// Tool input schemas
export const InitToolSchema = z.object({
  projectPath: z.string().optional(),
  projectName: z.string().optional(),
});

export const ReadToolSchema = z.object({
  fileName: z.string().regex(/^[a-zA-Z0-9-_]+\.md$/),
  projectPath: z.string().optional(),
});

export const UpdateToolSchema = z.object({
  fileName: z.string().regex(/^[a-zA-Z0-9-_]+\.md$/),
  content: z.string().min(1),
  projectPath: z.string().optional(),
});

export const SearchToolSchema = z.object({
  query: z.string().min(1),
  projectPath: z.string().optional(),
  limit: z.number().int().positive().max(50).default(10),
  searchType: z.enum(['hybrid', 'vector', 'text']).default('hybrid'),
});

export const SyncToolSchema = z.object({
  projectPath: z.string().optional(),
  forceRegenerate: z.boolean().default(false),
});

// Context Engineering PRP tools (simplified)
export const GeneratePRPSchema = z.object({
  request: z.string().min(3),
  projectPath: z.string().optional(),
});

export const ExecutePRPSchema = z.object({
  prp: z.string().optional(),
  projectPath: z.string().optional(),
  force: z.boolean().default(false),
});

