import { describe, it, expect } from 'vitest';
import {
  CORE_MEMORY_NAMES,
  MEMORY_HIERARCHY,
  InitToolSchema,
  ReadToolSchema,
  UpdateToolSchema,
  SearchToolSchema,
} from '../src/types/memory-v5.js';

describe('Memory Types v5', () => {
  describe('Core Memory Names', () => {
    it('should have all 7 core memory names', () => {
      expect(CORE_MEMORY_NAMES).toContain('projectbrief');
      expect(CORE_MEMORY_NAMES).toContain('productContext');
      expect(CORE_MEMORY_NAMES).toContain('activeContext');
      expect(CORE_MEMORY_NAMES).toContain('systemPatterns');
      expect(CORE_MEMORY_NAMES).toContain('techContext');
      expect(CORE_MEMORY_NAMES).toContain('progress');
      expect(CORE_MEMORY_NAMES).toContain('codebaseMap');
      expect(CORE_MEMORY_NAMES).toHaveLength(7); // Cline's 7 core memories
    });
  });

  describe('Memory Hierarchy', () => {
    it('should have proper dependency structure', () => {
      expect(MEMORY_HIERARCHY.projectbrief.dependsOn).toEqual([]);
      expect(MEMORY_HIERARCHY.productContext.dependsOn).toContain('projectbrief');
      expect(MEMORY_HIERARCHY.activeContext.dependsOn).toContain('productContext');
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
      const validRead = {
        memoryName: 'projectbrief',
        projectPath: '/test/path',
      };

      expect(() => ReadToolSchema.parse(validRead)).not.toThrow();
      expect(() => ReadToolSchema.parse({ memoryName: 'activeContext' })).not.toThrow();
    });

    it('should validate update tool schema', () => {
      const validUpdate = {
        memoryName: 'activeContext',
        content: '# Active Context\nTest content',
        projectPath: '/test/path',
      };

      expect(() => UpdateToolSchema.parse(validUpdate)).not.toThrow();
      expect(() => UpdateToolSchema.parse({
        memoryName: 'progress',
        content: 'Test content'
      })).not.toThrow();
    });

    it('should validate search tool schema with defaults', () => {
      const validSearch = {
        query: 'test query',
      };

      const parsed = SearchToolSchema.parse(validSearch);
      expect(parsed.limit).toBe(10);
      expect(parsed.query).toBe('test query');
    });

    it('should validate search tool schema with code search', () => {
      const validSearch = {
        query: 'test query',
        codeSearch: 'similar',
        language: 'typescript',
      };

      expect(() => SearchToolSchema.parse(validSearch)).not.toThrow();
    });
  });
});