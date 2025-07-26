import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SearchToolSchema, type ProjectConfig, type MemoryDocument, createEvolutionMemory } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { generateEmbedding } from '../embeddings/voyage.js';
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
            text: 'Memory Engineering not initialized for this project. Run memory_engineering/init first.',
          },
        ],
      };
    }

    const config: ProjectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    const collection = getMemoryCollection();

    // Track query for evolution memory
    const queryStartTime = Date.now();

    let results: MemoryDocument[] = [];

    // Execute search based on type
    switch (params.searchType) {
      case 'rankfusion':
        results = await executeRankFusionSearch(collection, config.projectId, params.query, params.limit);
        break;
      case 'vector':
        results = await executeVectorSearch(collection, config.projectId, params.query, params.limit);
        break;
      case 'text':
        results = await executeTextSearch(collection, config.projectId, params.query, params.limit);
        break;
      case 'temporal':
        results = await executeTemporalSearch(collection, config.projectId, params.query, params.limit);
        break;
      default:
        // Default to rankfusion
        results = await executeRankFusionSearch(collection, config.projectId, params.query, params.limit);
    }

    // Track search effectiveness for evolution
    const queryDuration = Date.now() - queryStartTime;
    await trackSearchEvolution(collection, config.projectId, params.query, results.length, queryDuration);

    // Update access counts for returned memories
    if (results.length > 0) {
      await collection.updateMany(
        { _id: { $in: results.map(r => r._id).filter(id => id !== undefined) } },
        { 
          $set: { 'metadata.freshness': new Date() },
          $inc: { 'metadata.accessCount': 1 }
        }
      );
    }

    // Format results
    return formatSearchResults(params.query, results, params.searchType);

  } catch (error) {
    logger.error('Search tool error:', error);
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Search failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
    };
  }
}

async function executeRankFusionSearch(
  collection: any,
  projectId: string,
  query: string,
  limit: number
): Promise<MemoryDocument[]> {
  // Generate embedding for semantic search
  const queryEmbedding = await generateEmbedding(query);

  // MongoDB $rankFusion aggregation pipeline
  const pipeline = [
    {
      $rankFusion: {
        input: {
          pipelines: {
            // Semantic vector search pipeline (40% weight)
            semantic: [
              {
                $vectorSearch: {
                  index: 'memory_vectors',
                  path: 'contentVector',
                  queryVector: queryEmbedding,
                  numCandidates: limit * 5,
                  limit: limit * 2,
                  filter: { projectId }
                }
              }
            ],
            
            // Recent/temporal relevance pipeline (20% weight)
            recent: [
              {
                $match: {
                  projectId,
                  'metadata.freshness': { 
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                  }
                }
              },
              { $sort: { 'metadata.freshness': -1 } },
              { $limit: limit * 2 }
            ],
            
            // High importance patterns pipeline (30% weight)
            patterns: [
              {
                $search: {
                  index: 'memory_text',
                  text: {
                    query,
                    path: 'searchableText',
                    fuzzy: { maxEdits: 1 }
                  }
                }
              },
              {
                $match: {
                  projectId,
                  'metadata.importance': { $gte: 7 }
                }
              },
              { $limit: limit * 2 }
            ],
            
            // Frequently accessed evolution pipeline (10% weight)
            evolution: [
              {
                $match: {
                  projectId,
                  'metadata.accessCount': { $gte: 3 }
                }
              },
              { $sort: { 'metadata.accessCount': -1 } },
              { $limit: limit }
            ]
          }
        },
        combination: {
          method: 'reciprocalRankFusion',
          weights: {
            semantic: 0.4,
            recent: 0.2,
            patterns: 0.3,
            evolution: 0.1
          },
          k: 60 // RRF constant
        }
      }
    },
    { $limit: limit },
    {
      $lookup: {
        from: 'memory_engineering_documents',
        localField: '_id',
        foreignField: '_id',
        as: 'fullDocument'
      }
    },
    { $unwind: '$fullDocument' },
    { $replaceRoot: { newRoot: '$fullDocument' } }
  ];

  try {
    const results = await collection.aggregate(pipeline).toArray();
    return results;
  } catch (error) {
    // Fallback to simple hybrid search if $rankFusion not available
    logger.warn('$rankFusion not available, falling back to manual hybrid search', error);
    return await fallbackHybridSearch(collection, projectId, query, queryEmbedding, limit);
  }
}

async function fallbackHybridSearch(
  collection: any,
  projectId: string,
  query: string,
  queryEmbedding: number[],
  limit: number
): Promise<MemoryDocument[]> {
  // Manual implementation of hybrid search
  const [vectorResults, textResults, recentResults] = await Promise.all([
    // Vector search
    collection.aggregate([
      {
        $vectorSearch: {
          index: 'memory_vectors',
          path: 'contentVector',
          queryVector: queryEmbedding,
          numCandidates: limit * 3,
          limit: limit,
          filter: { projectId }
        }
      }
    ]).toArray(),
    
    // Text search
    collection.aggregate([
      {
        $search: {
          index: 'memory_text',
          text: {
            query,
            path: 'searchableText'
          }
        }
      },
      { $match: { projectId } },
      { $limit: limit }
    ]).toArray(),
    
    // Recent memories
    collection.find({
      projectId,
      'metadata.freshness': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ 'metadata.freshness': -1 })
    .limit(limit)
    .toArray()
  ]);

  // Combine and deduplicate results
  const combinedMap = new Map<string, MemoryDocument>();
  
  // Add with weights
  vectorResults.forEach((doc: MemoryDocument) => {
    combinedMap.set(doc._id!.toString(), doc);
  });
  
  textResults.forEach((doc: MemoryDocument) => {
    if (!combinedMap.has(doc._id!.toString())) {
      combinedMap.set(doc._id!.toString(), doc);
    }
  });
  
  recentResults.forEach((doc: MemoryDocument) => {
    if (!combinedMap.has(doc._id!.toString())) {
      combinedMap.set(doc._id!.toString(), doc);
    }
  });

  return Array.from(combinedMap.values()).slice(0, limit);
}

async function executeVectorSearch(
  collection: any,
  projectId: string,
  query: string,
  limit: number
): Promise<MemoryDocument[]> {
  const queryEmbedding = await generateEmbedding(query);
  
  return await collection.aggregate([
    {
      $vectorSearch: {
        index: 'memory_vectors',
        path: 'contentVector',
        queryVector: queryEmbedding,
        numCandidates: limit * 3,
        limit,
        filter: { projectId }
      }
    }
  ]).toArray();
}

async function executeTextSearch(
  collection: any,
  projectId: string,
  query: string,
  limit: number
): Promise<MemoryDocument[]> {
  return await collection.aggregate([
    {
      $search: {
        index: 'memory_text',
        text: {
          query,
          path: 'searchableText',
          fuzzy: { maxEdits: 1 }
        }
      }
    },
    { $match: { projectId } },
    { $limit: limit }
  ]).toArray();
}

async function executeTemporalSearch(
  collection: any,
  projectId: string,
  query: string,
  limit: number
): Promise<MemoryDocument[]> {
  // Search with temporal decay - more recent = higher relevance
  const textQuery = query.toLowerCase();
  
  return await collection.aggregate([
    {
      $match: {
        projectId,
        $or: [
          { searchableText: { $regex: textQuery, $options: 'i' } },
          { 'metadata.tags': { $regex: textQuery, $options: 'i' } }
        ]
      }
    },
    {
      $addFields: {
        temporalScore: {
          $divide: [
            1,
            {
              $add: [
                1,
                {
                  $divide: [
                    { $subtract: [new Date(), '$metadata.freshness'] },
                    86400000 // milliseconds in a day
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    { $sort: { temporalScore: -1 } },
    { $limit: limit }
  ]).toArray();
}

async function trackSearchEvolution(
  collection: any,
  projectId: string,
  query: string,
  resultCount: number,
  _duration: number
): Promise<void> {
  try {
    // Create evolution memory for this search
    const evolutionMemory = createEvolutionMemory(projectId, {
      query,
      resultCount,
      timestamp: new Date(),
      improvements: []
    });
    
    await collection.insertOne(evolutionMemory);
  } catch (error) {
    logger.warn('Failed to track search evolution', error);
  }
}

function formatSearchResults(
  query: string,
  results: MemoryDocument[],
  searchType: string
): CallToolResult {
  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No results found for: "${query}"

Try these search tips:
- Use different keywords or synonyms
- Search for patterns like "error handling" or "performance optimization"
- Try semantic search with concepts rather than exact terms
- Check if memories have been synced (run memory_engineering/sync)

Search type used: ${searchType}`,
        },
      ],
    };
  }

  let content = `# Search Results for: "${query}"\n\n`;
  content += `Found ${results.length} relevant memories (${searchType} search)\n\n`;

  results.forEach((doc, index) => {
    content += `## ${index + 1}. `;
    
    // Title based on memory class
    switch (doc.memoryClass) {
      case 'core':
        content += `📚 ${doc.content.fileName || 'Core Memory'}`;
        break;
      case 'working':
        content += `⚡ ${doc.content.event?.action || 'Working Memory'}`;
        break;
      case 'insight':
        content += `💡 ${doc.content.insight?.pattern || 'Insight'}`;
        break;
      case 'evolution':
        content += `📈 Evolution: ${doc.content.evolution?.query || 'Query'}`;
        break;
      default:
        content += `📄 ${doc.memoryClass}/${doc.memoryType}`;
    }
    
    content += `\n`;
    content += `- **Importance**: ${doc.metadata.importance}/10\n`;
    content += `- **Accessed**: ${doc.metadata.accessCount} times\n`;
    content += `- **Last Updated**: ${doc.metadata.freshness.toISOString().split('T')[0]}\n`;
    
    // Preview of content
    let preview = '';
    switch (doc.memoryClass) {
      case 'core':
        preview = (doc.content.markdown || '').substring(0, 200);
        break;
      case 'working':
        preview = doc.content.event?.solution || JSON.stringify(doc.content.event?.context || {}).substring(0, 200);
        break;
      case 'insight':
        preview = `Confidence: ${doc.content.insight?.confidence}/10`;
        break;
      case 'evolution':
        preview = `Results: ${doc.content.evolution?.resultCount}`;
        break;
    }
    
    if (preview) {
      content += `- **Preview**: ${preview}...\n`;
    }
    
    content += `- **ID**: ${doc._id}\n\n`;
  });

  // Add search suggestions
  content += `---\n\n`;
  content += `💡 **Search Tips**:\n`;
  content += `- Use "rankfusion" (default) for best results combining all search types\n`;
  content += `- Use "vector" for semantic/conceptual similarity\n`;
  content += `- Use "text" for exact keyword matching\n`;
  content += `- Use "temporal" for time-weighted results\n\n`;
  content += `To view full memory: memory_engineering/read --fileName "name" or use the memory ID`;

  return {
    content: [
      {
        type: 'text',
        text: content,
      },
    ],
  };
}