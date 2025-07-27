import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
  type ListResourcesRequest,
  type ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { initTool } from './init.js';
import { startSessionTool } from './startSession.js';
import { readTool } from './read.js';
import { updateTool } from './update.js';
import { memoryBankUpdateTool } from './memoryBankUpdate.js';
import { searchTool } from './search.js';
import { syncTool } from './sync.js';
import { logger } from '../utils/logger.js';

export function setupTools(server: Server): void {
  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering_start_session',
          description: 'MANDATORY: Start every session with this command. Reads all 7 core memories to give you full project context. Must be run before any other memory operations.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_init',
          description: 'Initialize memory system for your project. Run once at project start. Creates 7 core memory documents in MongoDB and sets up search indexes. If indexes fail, run npm run create-indexes manually.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              projectName: {
                type: 'string',
                description: 'Project name (defaults to directory name)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_read',
          description: 'Read specific memory document. Use after start_session for details. Valid core memories: projectbrief, productContext, activeContext, systemPatterns, techContext, progress, codebaseMap. Example: memory_engineering_read --fileName "activeContext" (no .md needed)',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Core memory name WITHOUT .md extension (e.g., activeContext, systemPatterns, progress)'
              },
              memoryClass: {
                type: 'string',
                enum: ['core', 'working'],
                description: 'Memory class to filter by',
              },
              memoryType: {
                type: 'string',
                enum: ['context', 'event'],
                description: 'Memory type to filter by',
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
          },
        },
        {
          name: 'memory_engineering_update',
          description: 'Update a memory document. For core memories use fileName (no .md). For working memories use memoryClass="working" with JSON content. Examples: memory_engineering_update --fileName "activeContext" --content "Working on: auth system" OR memory_engineering_update --memoryClass "working" --content \'{"action": "fixed bug", "solution": "..."}\'',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Core memory name WITHOUT .md extension (e.g., activeContext, progress, systemPatterns)'
              },
              content: {
                type: 'string',
                description: 'Content (markdown for core memories, JSON for others)',
                minLength: 1
              },
              memoryClass: {
                type: 'string',
                enum: ['working'],
                description: 'Memory class for new memories',
              },
              memoryType: {
                type: 'string',
                enum: ['context', 'event'],
                description: 'Memory type (optional)',
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'memory_engineering_search',
          description: 'Search memories using MongoDB $rankFusion (hybrid of vector, text, temporal). Use before implementing features or when debugging. If search fails with "Path projectId needs to be indexed", run npm run create-indexes. Example: memory_engineering_search --query "authentication patterns"',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
                minLength: 1
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              limit: {
                type: 'number',
                description: 'Maximum results (default: 10, max: 50)',
                default: 10,
                minimum: 1,
                maximum: 50
              },
              searchType: {
                type: 'string',
                enum: ['rankfusion', 'vector', 'text', 'temporal'],
                description: 'Search type (default: rankfusion)',
                default: 'rankfusion',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'memory_engineering_sync',
          description: 'Generate vector embeddings for memories to enable semantic search. Run after creating/updating memories. Uses Voyage AI to create 1024-dimensional embeddings. Required before search will work properly.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
              forceRegenerate: {
                type: 'boolean',
                description: 'Regenerate all embeddings (default: false)',
                default: false,
              },
            },
          },
        },
        {
          name: 'memory_engineering_memory_bank_update',
          description: 'Update multiple core memories in one command. Useful for systematic updates. Memory names do NOT need .md extension. Example uses JSON object with memory names as keys and content as values.',
          inputSchema: {
            type: 'object',
            properties: {
              updates: {
                type: 'object',
                description: 'Object with memory names as keys and markdown content as values',
                properties: {
                  activeContext: { type: 'string' },
                  systemPatterns: { type: 'string' },
                  progress: { type: 'string' },
                  techContext: { type: 'string' },
                  projectbrief: { type: 'string' },
                  productContext: { type: 'string' },
                  codebaseMap: { type: 'string' },
                },
              },
              projectPath: {
                type: 'string',
                description: 'Project directory path (defaults to current directory)',
              },
            },
            required: ['updates'],
          },
        },
      ],
    };
  });

  // Register resources handlers
  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => {
    return {
      resources: [
        {
          uri: 'memory://core',
          name: 'Core Memory Documents',
          description: 'The 7 core memory documents stored in MongoDB',
          mimeType: 'text/markdown',
        },
        {
          uri: 'memory://search',
          name: 'Memory Search Status',
          description: 'Search index configuration and statistics',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request: ReadResourceRequest) => {
    const { uri } = request.params;
    
    try {
      switch (uri) {
        case 'memory://core':
          return {
            contents: [{
              uri: 'memory://core',
              mimeType: 'text/markdown',
              text: `# Core Memory Documents

The 7 core memory documents that form the foundation of the memory system:

1. **projectbrief** - Project goals, scope, and success criteria
2. **systemPatterns** - Architecture patterns and code conventions
3. **activeContext** - Current sprint and task focus
4. **techContext** - Technology stack and dependencies
5. **progress** - Completed work and lessons learned
6. **codebaseMap** - File structure and key modules

Use memory_engineering_read --fileName [name] to read a specific document.`,
            }],
          };

        case 'memory://search':
          return {
            contents: [{
              uri: 'memory://search',
              mimeType: 'application/json',
              text: JSON.stringify({
                type: 'MongoDB Atlas Search',
                indexes: {
                  vector: {
                    name: 'memory_vectors',
                    dimensions: 1024,
                    similarity: 'cosine',
                    model: 'voyage-3-large'
                  },
                  text: {
                    name: 'memory_text',
                    analyzer: 'lucene.standard',
                    fields: ['searchableText', 'metadata.tags']
                  }
                },
                searchTypes: {
                  rankfusion: 'MongoDB $rankFusion combining vector, text, temporal, and evolution',
                  vector: 'Semantic similarity search',
                  text: 'Keyword matching with fuzzy search',
                  temporal: 'Time-weighted relevance'
                }
              }, null, 2),
            }],
          };

        default:
          return {
            isError: true,
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: `Unknown resource: ${uri}`,
            }],
          };
      }
    } catch (error) {
      logger.error('Resource read error:', error);
      return {
        isError: true,
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: `Error reading resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const { name, arguments: args } = request.params;

      logger.info(`Tool called: ${name}`, args);

      switch (name) {
        case 'memory_engineering_init':
          return await initTool(args);
        case 'memory_engineering_start_session':
          return await startSessionTool(args);
        case 'memory_engineering_read':
          return await readTool(args);
        case 'memory_engineering_update':
          return await updateTool(args);
        case 'memory_engineering_search':
          return await searchTool(args);
        case 'memory_engineering_sync':
          return await syncTool(args);
        case 'memory_engineering_memory_bank_update':
          return await memoryBankUpdateTool(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error('Tool execution error:', error);
      
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  });
}