import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SearchToolSchema, type MemoryDocument, type CodeChunk } from '../types/memory-v5.js';
import { getMemoryCollection, getDb } from '../db/connection.js';
import { generateCodeQueryEmbedding } from '../embeddings/codeEmbeddings.js';
import { generateQueryEmbedding } from '../embeddings/voyage-v5.js';
import { rerankResults } from '../embeddings/voyage-rerank.js';
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
            text: '🔴 CRITICAL: Cannot search without a brain! NO MEMORY SYSTEM!\n\n⚡ EXECUTE: memory_engineering_init\n\nSearching requires memories to exist. Initialize NOW!',
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
    logger.error('💀 SEARCH ENGINE EXPLODED!', error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `🔴 SEARCH EXPLOSION! Something went terribly wrong!

💀 ERROR: ${error instanceof Error ? error.message : 'Unknown catastrophic failure'}

🆘 EMERGENCY RECOVERY PROTOCOL:
1. Check environment: memory_engineering_check_env
2. Verify connection: Is MongoDB alive?
3. Retry with simpler query: Single word only
4. If persists: Check Voyage API key

⚡ MOST LIKELY CAUSE:
${error instanceof Error && error.message.includes('connect') ? '• MongoDB connection lost!' : ''}
${error instanceof Error && error.message.includes('voyage') ? '• Voyage API issue!' : ''}
${error instanceof Error && error.message.includes('timeout') ? '• Search timed out - query too complex!' : ''}
🔄 TRY AGAIN with a simpler search term!`,
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
      logger.info('🎯 VECTOR SEARCH ACTIVATED - Semantic intelligence engaged!');
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

      logger.info(`🎆 VECTOR SEARCH SUCCESS: ${results.length} memories discovered!`);
      searchType = 'vector';

    } catch (error) {
      logger.warn('⚠️ VECTOR SEARCH FAILED - Activating text search fallback!', error);
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
          text: `🔴 ZERO RESULTS for: "${params.query}" - But don\'t give up!

⚠️ DIAGNOSTIC CHECK:
${results.length === 0 ? '🔍 No matches found - try different search terms' : '✅ Search executed successfully'}
${searchType === 'text' ? '📦 Using text search (embeddings might help)' : '🎯 Using vector search'}

💡 SEARCH OPTIMIZATION STRATEGIES:

1️⃣ **Try BROADER terms:**
   Instead of: "${params.query}"
   Try: "${params.query.split(' ')[0]}" or "${params.query.includes(' ') ? params.query.split(' ').slice(-1)[0] : params.query.substring(0, Math.floor(params.query.length/2))}"

2️⃣ **Search by MEMORY TYPE:**
   📝 projectbrief → "requirements", "goals", "scope", "MVP"
   🎯 productContext → "problem", "user", "pain", "solution"
   ⚡ activeContext → "current", "now", "working", "TODO"
   🏗️ systemPatterns → "pattern", "architecture", "design"
   🔧 techContext → "stack", "version", "dependency"
   ✅ progress → "done", "complete", "bug", "issue"
   🗺️ codebaseMap → "file", "folder", "structure"

3️⃣ **Common POWER SEARCHES:**
   🔥 "TODO" - Find all pending work
   🔥 "bug" or "issue" - Find problems
   🔥 "decision" - Find architectural choices
   🔥 "current" - Find what you\'re working on

⚡ IMMEDIATE ACTIONS:
1. Run: memory_engineering_read_all (see what memories exist)
2. Try: memory_engineering_search --query "${params.query.split(' ')[0] || 'TODO'}"
3. Check: Did you sync_code recently? Code search needs fresh embeddings!

💀 REMEMBER: No results often means memories need updating, not that info doesn\'t exist!`,
        },
      ],
    };
  }
  
  // Try to rerank for better relevance (safe - falls back if unavailable)
  const rerankedResults = await rerankResults(params.query, results, params.limit || 10);
  
  let response = `🔍 Search Results: "${params.query}"\n\n`;
  response += `Found ${rerankedResults.length} memories\n\n`;

  rerankedResults.forEach((memory, idx) => {
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
          text: `🔴 CODE SEARCH RETURNED NOTHING! Query: "${params.query}" | Mode: ${params.codeSearch}

⚠️ YOUR CODE IS INVISIBLE TO THE SEARCH!

🧠 DIAGNOSTIC CHECK:
${params.codeSearch === 'similar' ? '• Vector search active but found NO semantic matches' : ''}
${params.codeSearch === 'implements' ? '• No implementations found - this concept might not exist!' : ''}
${params.codeSearch === 'uses' ? '• No usage found - this function/module is UNUSED or DOESN\'T EXIST!' : ''}
${params.codeSearch === 'pattern' ? '• Pattern not found - your architecture might not use this pattern!' : ''}

💡 EMERGENCY RECOVERY STRATEGIES:

1️⃣ **CHECK IF CODE IS SYNCED:**
   Run: memory_engineering_sync_code
   → Your code might not be indexed yet!

2️⃣ **TRY DIFFERENT SEARCH MODES:**
   🔍 similar: Semantic search (finds related concepts)
   🏗️ implements: Where things are built
   🔗 uses: Where things are used
   🎯 pattern: Architectural patterns

3️⃣ **POWER SEARCH EXAMPLES:**
   • memory_engineering_search --query "auth" --codeSearch "similar"
   • memory_engineering_search --query "UserService" --codeSearch "implements"
   • memory_engineering_search --query "generateToken" --codeSearch "uses"

4️⃣ **BROADEN YOUR SEARCH:**
   Instead of: "${params.query}"
   Try: "${params.query.split(' ')[0] || params.query.substring(0, Math.floor(params.query.length/2))}"

🔥 REMEMBER: No results often means code needs syncing, not that it doesn't exist!`,
        },
      ],
    };
  }
  
  // Try to rerank for better relevance (safe - falls back if unavailable)
  const rerankedResults = await rerankResults(params.query, results, params.limit || 10);
  
  return formatCodeSearchResults(params.query, params.codeSearch, rerankedResults);
}

async function searchSimilarCode(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  // Generate query embedding
  const queryEmbedding = await generateCodeQueryEmbedding(params.query);
  
  // Vector search - Atlas doesn't support regex in filter, so we post-filter
  const pipeline: any[] = [
    {
      $vectorSearch: {
        index: 'code_vector_search',
        path: 'contentVector',
        queryVector: queryEmbedding,
        numCandidates: params.limit * 10, // Get more candidates for post-filtering
        limit: params.limit * 3, // Get extra for filtering
        filter: {
          projectId
        }
      }
    }
  ];
  
  // Add post-filtering stage if filePath is specified
  if (params.filePath) {
    pipeline.push({
      $match: {
        filePath: { $regex: params.filePath, $options: 'i' }
      }
    });
  }
  
  // Limit to requested amount
  pipeline.push({ $limit: params.limit });
  
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
  if (params.filePath) query.filePath = { $regex: params.filePath, $options: 'i' };
  
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
  if (params.filePath) query.filePath = { $regex: params.filePath, $options: 'i' };
  
  return await collection
    .find(query)
    .limit(params.limit)
    .toArray();
}

// Normalize pattern queries for better matching
function normalizePatternQuery(query: string): string[] {
  // Base normalization: spaces to hyphens, lowercase
  const normalized = query.toLowerCase().replace(/\s+/g, '-');
  
  // Create variations for common patterns
  const variations: string[] = [normalized];
  
  // Add common variations
  if (normalized.includes('error')) {
    variations.push('error-handler', 'error-handling', 'exception');
  }
  if (normalized === 'async' || normalized.includes('async')) {
    variations.push('async', 'promise', 'await');
  }
  if (normalized.includes('auth')) {
    variations.push('authentication', 'authorization', 'auth', 'login');
  }
  if (normalized.includes('test')) {
    variations.push('test', 'spec', 'testing');
  }
  if (normalized.includes('util')) {
    variations.push('utility', 'utilities', 'utils', 'helper');
  }
  if (normalized.includes('db') || normalized.includes('database')) {
    variations.push('database', 'db', 'repository', 'model');
  }
  if (normalized.includes('api')) {
    variations.push('api', 'endpoint', 'route', 'router');
  }
  if (normalized.includes('log')) {
    variations.push('logging', 'logger', 'log');
  }
  
  // Remove duplicates
  return [...new Set(variations)];
}

async function searchPatterns(
  collection: any,
  projectId: string,
  params: any
): Promise<CodeChunk[]> {
  // Get normalized variations of the query
  const patternVariations = normalizePatternQuery(params.query);
  
  const query: any = {
    projectId,
    'metadata.patterns': { $in: patternVariations }
  };
  
  // language filter removed to fix Voyage AI issues
  if (params.filePath) query.filePath = { $regex: params.filePath, $options: 'i' };
  
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