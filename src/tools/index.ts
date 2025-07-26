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
import { readTool } from './read.js';
import { updateTool } from './update.js';
import { searchTool } from './search.js';
import { syncTool } from './sync.js';
import { logger } from '../utils/logger.js';

export function setupTools(server: Server): void {
  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    return {
      tools: [
        {
          name: 'memory_engineering/init',
          description: 'Initialize memory system for a project. Creates MongoDB collection, indexes, and 6 core memory files.',
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
          name: 'memory_engineering/read',
          description: 'Read memories from MongoDB. Supports reading by fileName for core memories or by memoryClass/memoryType.',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Core memory file name (e.g., systemPatterns.md)',
                pattern: '^[a-zA-Z0-9-_]+\\.md$'
              },
              memoryClass: {
                type: 'string',
                enum: ['core', 'working', 'insight', 'evolution'],
                description: 'Memory class to filter by',
              },
              memoryType: {
                type: 'string',
                enum: ['pattern', 'context', 'event', 'learning', 'meta'],
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
          name: 'memory_engineering/update',
          description: 'Update core memory files or create new memories. For core memories, use fileName. For other classes, specify memoryClass and provide JSON content.',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'Core memory file to update',
                pattern: '^[a-zA-Z0-9-_]+\\.md$'
              },
              content: {
                type: 'string',
                description: 'Content (markdown for core memories, JSON for others)',
                minLength: 1
              },
              memoryClass: {
                type: 'string',
                enum: ['working', 'insight', 'evolution'],
                description: 'Memory class for new memories',
              },
              memoryType: {
                type: 'string',
                enum: ['pattern', 'context', 'event', 'learning', 'meta'],
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
          name: 'memory_engineering/search',
          description: 'Search memories using MongoDB $rankFusion or specific search types (vector, text, temporal).',
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
          name: 'memory_engineering/sync',
          description: 'Generate vector embeddings and update search indexes for all memories without embeddings.',
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
      ],
    };
  });

  // Register resources handlers
  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => {
    return {
      resources: [
        {
          uri: 'memory://core',
          name: 'Core Memory Files',
          description: 'The 6 foundational memory files',
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
              text: `# Core Memory Files

The 6 core memory files that form the foundation of the memory system:

1. **projectbrief.md** - Project goals, scope, and success criteria
2. **systemPatterns.md** - Architecture patterns and code conventions
3. **activeContext.md** - Current sprint and task focus
4. **techContext.md** - Technology stack and dependencies
5. **progress.md** - Completed work and lessons learned
6. **codebaseMap.md** - File structure and key modules

Use memory_engineering/read --fileName [name] to read a specific file.`,
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
        case 'memory_engineering/init':
          return await initTool(args);
        case 'memory_engineering/read':
          return await readTool(args);
        case 'memory_engineering/update':
          return await updateTool(args);
        case 'memory_engineering/search':
          return await searchTool(args);
        case 'memory_engineering/sync':
          return await syncTool(args);
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