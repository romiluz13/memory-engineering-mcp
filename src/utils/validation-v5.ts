import { z } from 'zod';

// Enhanced validation schemas using Zod (official TypeScript validation library)

// Environment variable validation
export const EnvironmentSchema = z.object({
  MONGODB_URI: z.string().url('MongoDB URI must be a valid URL'),
  VOYAGE_API_KEY: z.string().min(10, 'Voyage API key must be at least 10 characters'),
  MEMORY_ENGINEERING_DB: z.string().optional().default('memory_engineering'),
  MEMORY_ENGINEERING_COLLECTION: z.string().optional().default('memory_engineering_documents'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

// Memory content validation
export const MemoryContentSchema = z.object({
  memoryName: z.enum(['projectbrief', 'productContext', 'activeContext', 'systemPatterns', 'techContext', 'progress', 'codebaseMap']),
  content: z.string()
    .min(10, 'Memory content must be at least 10 characters')
    .max(100000, 'Memory content must be less than 100,000 characters'),
  projectPath: z.string().optional(),
});

// Project configuration validation
export const ProjectConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectName: z.string().min(1, 'Project name is required'),
  createdAt: z.date().optional(),
  lastModified: z.date().optional(),
});

// Search query validation
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(1000, 'Search query too long'),
  limit: z.number().int().min(1).max(100).optional().default(10),
  projectPath: z.string().optional(),
});

// Code sync validation
export const CodeSyncSchema = z.object({
  patterns: z.array(z.string()).min(1, 'At least one pattern is required'),
  projectPath: z.string().optional(),
  minChunkSize: z.number().int().min(10).max(10000).optional().default(80),
  includeTests: z.boolean().optional().default(true),
  forceRegenerate: z.boolean().optional().default(false),
});

// Validation helper functions
export function validateEnvironment(env: Record<string, string | undefined>) {
  try {
    return {
      isValid: true,
      data: EnvironmentSchema.parse(env),
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.issues.map((e: any) => `🔴 VALIDATION FAILED at ${e.path.join('.')}: ${e.message.toUpperCase()}! FIX IMMEDIATELY!`)
      };
    }
    return {
      isValid: false,
      data: null,
      errors: ['💀 CATASTROPHIC VALIDATION EXPLOSION! System cannot process this data! CHECK EVERYTHING!']
    };
  }
}

export function validateMemoryContent(data: unknown) {
  try {
    return {
      isValid: true,
      data: MemoryContentSchema.parse(data),
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        data: null,
        errors: error.issues.map((e: any) => `🔴 VALIDATION FAILED at ${e.path.join('.')}: ${e.message.toUpperCase()}! FIX IMMEDIATELY!`)
      };
    }
    return {
      isValid: false,
      data: null,
      errors: ['💀 CATASTROPHIC VALIDATION EXPLOSION! System cannot process this data! CHECK EVERYTHING!']
    };
  }
}

// Legacy function for backward compatibility
export function validateMemoryStructure(_memoryName: string, _content: string) {
  return {
    isValid: true,
    requiredSections: []
  };
}