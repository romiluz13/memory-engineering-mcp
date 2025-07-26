import { describe, it, expect } from 'vitest';
import { 
  MEMORY_CLASSES,
  MEMORY_TYPES,
  CORE_MEMORY_FILES,
  InitToolSchema,
  ReadToolSchema,
  UpdateToolSchema,
  SearchToolSchema,
  SyncToolSchema,
} from '../src/types/memory.js';

describe('Memory Types', () => {
  describe('Memory Classes', () => {
    it('should have all expected memory classes', () => {
      expect(MEMORY_CLASSES).toContain('core');
      expect(MEMORY_CLASSES).toContain('working');
      expect(MEMORY_CLASSES).toContain('insight');
      expect(MEMORY_CLASSES).toContain('evolution');
      expect(MEMORY_CLASSES).toHaveLength(4);
    });
  });

  describe('Memory Types', () => {
    it('should have all expected memory types', () => {
      expect(MEMORY_TYPES).toContain('pattern');
      expect(MEMORY_TYPES).toContain('context');
      expect(MEMORY_TYPES).toContain('event');
      expect(MEMORY_TYPES).toContain('learning');
      expect(MEMORY_TYPES).toContain('meta');
      expect(MEMORY_TYPES).toHaveLength(5);
    });
  });

  describe('Core Memory Files', () => {
    it('should have all 6 core memory files', () => {
      expect(CORE_MEMORY_FILES).toContain('projectbrief.md');
      expect(CORE_MEMORY_FILES).toContain('systemPatterns.md');
      expect(CORE_MEMORY_FILES).toContain('activeContext.md');
      expect(CORE_MEMORY_FILES).toContain('techContext.md');
      expect(CORE_MEMORY_FILES).toContain('progress.md');
      expect(CORE_MEMORY_FILES).toContain('codebaseMap.md');
      expect(CORE_MEMORY_FILES).toHaveLength(6);
    });
  });

  describe('Schema Validation', () => {
    it('should validate init tool schema', () => {
      const validInit = {
        projectPath: '/test/path',
        projectName: 'Test Project',
      };
      
      expect(() => InitToolSchema.parse(validInit)).not.toThrow();
      expect(() => InitToolSchema.parse({})).not.toThrow(); // all optional
    });

    it('should validate read tool schema', () => {
      const validRead1 = {
        fileName: 'projectbrief.md',
      };
      
      const validRead2 = {
        memoryClass: 'working',
        memoryType: 'event',
      };
      
      expect(() => ReadToolSchema.parse(validRead1)).not.toThrow();
      expect(() => ReadToolSchema.parse(validRead2)).not.toThrow();
    });

    it('should validate update tool schema', () => {
      const validUpdate1 = {
        fileName: 'activeContext.md',
        content: '# Active Context\nTest content',
      };
      
      const validUpdate2 = {
        memoryClass: 'working',
        content: '{"action": "test", "context": {}}',
      };
      
      expect(() => UpdateToolSchema.parse(validUpdate1)).not.toThrow();
      expect(() => UpdateToolSchema.parse(validUpdate2)).not.toThrow();
    });

    it('should validate search tool schema with defaults', () => {
      const validSearch = {
        query: 'test query',
      };
      
      const parsed = SearchToolSchema.parse(validSearch);
      expect(parsed.limit).toBe(10);
      expect(parsed.searchType).toBe('rankfusion');
    });

    it('should validate sync tool schema', () => {
      const validSync = {
        projectPath: '/test/path',
        forceRegenerate: true,
      };
      
      expect(() => SyncToolSchema.parse(validSync)).not.toThrow();
      expect(() => SyncToolSchema.parse({})).not.toThrow(); // all optional
    });
  });
});