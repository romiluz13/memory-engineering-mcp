import { describe, it, expect } from 'vitest';
import { 
  MEMORY_FILE_TYPES,
  MemoryFileSchema,
  InitToolSchema,
  SearchToolSchema,
} from '../src/types/memory.js';

describe('Memory Types', () => {
  describe('Memory File Types', () => {
    it('should have all expected memory file types', () => {
      expect(MEMORY_FILE_TYPES).toContain('projectbrief');
      expect(MEMORY_FILE_TYPES).toContain('productContext');
      expect(MEMORY_FILE_TYPES).toContain('activeContext');
      expect(MEMORY_FILE_TYPES).toContain('systemPatterns');
      expect(MEMORY_FILE_TYPES).toContain('techContext');
      expect(MEMORY_FILE_TYPES).toContain('progress');
      expect(MEMORY_FILE_TYPES).toContain('custom');
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct memory file schema', () => {
      const validFile = {
        fileName: 'projectbrief.md',
        content: 'Test content',
        type: 'projectbrief',
      };
      
      expect(() => MemoryFileSchema.parse(validFile)).not.toThrow();
    });

    it('should reject invalid file names', () => {
      const invalidFile = {
        fileName: 'invalid file.txt',
        content: 'Test content',
        type: 'custom',
      };
      
      expect(() => MemoryFileSchema.parse(invalidFile)).toThrow();
    });

    it('should validate init tool schema', () => {
      const validInit = {
        projectPath: '/test/path',
        projectName: 'Test Project',
      };
      
      expect(() => InitToolSchema.parse(validInit)).not.toThrow();
    });

    it('should validate search tool schema with defaults', () => {
      const validSearch = {
        query: 'test query',
      };
      
      const parsed = SearchToolSchema.parse(validSearch);
      expect(parsed.limit).toBe(10);
      expect(parsed.searchType).toBe('hybrid');
    });
  });
});