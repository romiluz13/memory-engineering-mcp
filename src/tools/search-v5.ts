import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SearchToolSchema, type MemoryDocument, type CodeChunk } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { generateCodeQueryEmbedding } from '../embeddings/codeEmbeddings.js';
import { generateQueryEmbedding } from '../embeddings/voyage-v5.js';
import { logger } from '../utils/logger.js';

export async function searchTool(args: unknown): Promise<CallToolResult> {
  try {
    const params = SearchToolSchema.parse(args);
    const projectPath = params.projectPath || process.cwd();

    // Read project config
    const configPath = join(projectPath, '.memory-engineering', 'config.json');
    if (!existsSync(configPath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Memory Engineering not initialized. Run memory_engineering_init first.',
          },
        ],
      };
    }

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    
    // If code search is requested, delegate to code search
    if (params.codeSearch) {
      return await executeCodeSearch(config.projectId, params);
    }
    
    // Otherwise, do memory search
    return await executeMemorySearch(config.projectId, params);

  } catch (error) {
    logger.error('Search tool error:', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}

async function executeMemorySearch(
  projectId: string,
  params: any
): Promise<CallToolResult> {
  const collection = getMemoryCollection();
  let results: MemoryDocument[] = [];
  let searchType = 'hybrid';

  // v8: Check if memories have vector embeddings
  const hasVectors = await collection.findOne({
    projectId,
    contentVector: { $exists: true, $type: 'array' }
  });

  if (hasVectors) {
    try {
      // v8: Vector search with embeddings for semantic memory search!
      logger.info('Using v8 vector search for memories...');
      const queryEmbedding = await generateQueryEmbedding(params.query);

      results = await collection.aggregate([
        {
          $vectorSearch: {
            index: 'memory_vector_search',
            path: 'contentVector',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: params.limit,
            filter: { projectId }
          }
        },
        {
          $addFields: {
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]).toArray() as MemoryDocument[];

      logger.info(`v8 Vector search found ${results.length} results`);
      searchType = 'vector';

    } catch (error) {
      logger.warn('Vector search failed, falling back to text search:', error);
      searchType = 'text';
    }
  }

  // Fallback to text search if no vectors or vector search failed
  if (results.length === 0 || searchType === 'text') {
    results = await collection.find({
      projectId,
      $text: { $search: params.query }
    })
    .limit(params.limit)
    .toArray() as MemoryDocument[];
    searchType = 'text';
  }

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No results found for: "${params.query}"

Remember: In v5, you should start with memory_engineering_read_all to see all memories.
Search is secondary - use it to find specific sections within memories.`,
        },
      ],
    };
  }
  
  let response = `🔍 Search Results: "${params.query}"\n\n`;
  response += `Found ${results.length} memories\n\n`;

  results.forEach((memory, idx) => {
    response += `${idx + 1}. ${memory.memoryName}\n`;
    response += `   Last updated: ${memory.metadata.lastModified.toISOString()}\n`;

    // Show similarity score if available (from vector search)
    if ((memory as any).score) {
      response += `   Similarity: ${((memory as any).score * 100).toFixed(1)}%\n`;
    }
    
    // Show relevant excerpt
    const lines = memory.content.split('\n');
    const matchLine = lines.findIndex(line => 
      line.toLowerCase().includes(params.query.toLowerCase())
    );
    
    if (matchLine !== -1) {
      const start = Math.max(0, matchLine - 2);
      const end = Math.min(lines.length, matchLine + 3);
      response += `   Context:\n`;
      response += lines.slice(start, end)
        .map(line => `   ${line}`)
        .join('\n');
      response += '\n\n';
    }
  });
  
  return {
    content: [
      {
        type: 'text',
        text: response,
      },
    ],
  };
}

async function executeCodeSearch(
  projectId: string,
  params: any
): Promise<CallToolResult> {
  const codeCollection = getDb().collection<CodeChunk>('memory_engineering_code');
  
  let results: CodeChunk[] = [];
  
  switch (params.codeSearch) {
    case 'similar':
      results = await searchSimilarCode(codeCollection, projectId, params);
      break;
      
    case 'implements':
      results = await searchImplementations(codeCollection, projectId, params);
      break;
      
    case 'uses':
      results = await searchUsages(codeCollection, projectId, params);
      break;
      
    case 'pattern':
      results = await searchPatterns(codeCollection, projectId, params);
      break;
  }
  
  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No code results found for: "${params.query}" (mode: ${params.codeSearch})

Try different search modes:
- similar: Find code semantically similar to your query
- implements: Find implementations of a concept
- uses: Find code using specific functions/modules
- pattern: Find code matching architectural patterns`,
        },
      ],
    };
  }
  
  return formatCodeSearchResults(params.query, params.codeSearch, results);
}

async function searchSimilarCode(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  // Generate query embedding
  const queryEmbedding = await generateCodeQueryEmbedding(params.query);
  
  // Vector search with optional filters
  const pipeline: any[] = [
    {
      $vectorSearch: {
        index: 'code_vector_search',
        path: 'contentVector',
        queryVector: queryEmbedding,
        numCandidates: params.limit * 3,
        limit: params.limit,
        filter: {
          projectId,
          // language filter removed to fix Voyage AI issues
          ...(params.filePath && { filePath: { $regex: params.filePath } })
        }
      }
    }
  ];
  
  return await collection.aggregate(pipeline).toArray();
}

async function searchImplementations(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  const query: any = {
    projectId,
    $text: { $search: params.query },
    'chunk.type': { $in: ['function', 'class', 'method'] }
  };
  
  // language filter removed to fix Voyage AI issues
  if (params.filePath) query.filePath = { $regex: params.filePath };
  
  return await collection
    .find(query)
    .limit(params.limit)
    .toArray();
}

async function searchUsages(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  const query: any = {
    projectId,
    'metadata.dependencies': params.query
  };
  
  // language filter removed to fix Voyage AI issues
  if (params.filePath) query.filePath = { $regex: params.filePath };
  
  return await collection
    .find(query)
    .limit(params.limit)
    .toArray();
}

async function searchPatterns(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  const query: any = {
    projectId,
    'metadata.patterns': params.query
  };
  
  // language filter removed to fix Voyage AI issues
  if (params.filePath) query.filePath = { $regex: params.filePath };
  
  return await collection
    .find(query)
    .limit(params.limit)
    .toArray();
}

function formatCodeSearchResults(
  query: string,
  mode: string,
  results: CodeChunk[]
): CallToolResult {
  let response = `Code Search Results: "${query}" (mode: ${mode})\n\n`;
  response += `Found ${results.length} code chunks\n\n`;
  
  results.forEach((chunk, idx) => {
    response += `${idx + 1}. ${chunk.chunk.name || 'Anonymous'}\n`;
    response += `   Type: ${chunk.chunk.type}\n`;
    response += `   File: ${chunk.filePath}:${chunk.chunk.startLine}\n`;
    
    if (chunk.chunk.signature) {
      response += `   Signature: ${chunk.chunk.signature}\n`;
    }
    
    if (chunk.metadata.patterns.length > 0) {
      response += `   Patterns: ${chunk.metadata.patterns.join(', ')}\n`;
    }
    
    // Show preview
    const preview = chunk.chunk.content
      .split('\n')
      .slice(0, 5)
      .join('\n')
      .trim();
    
    response += `   Preview:\n`;
    response += preview
      .split('\n')
      .map(line => `     ${line}`)
      .join('\n');
    
    if (chunk.chunk.content.split('\n').length > 5) {
      response += '\n     ...';
    }
    
    response += '\n\n';
  });
  
  response += `\nTip: Use memory_engineering_read to see the full codebaseMap memory.\n`;
  response += `Code chunks are linked to the codebaseMap for context.`;
  
  return {
    content: [
      {
        type: 'text',
        text: response,
      },
    ],
  };
}