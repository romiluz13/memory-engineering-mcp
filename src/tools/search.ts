import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SearchToolSchema, type ProjectConfig } from '../types/memory.js';
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

    let results;

    if (params.searchType === 'text') {
      // Text-only search using Atlas Search
      results = await collection
        .aggregate([
          {
            $search: {
              index: 'memory_text_index',
              text: {
                query: params.query,
                path: ['content', 'fileName'],
              },
            },
          },
          {
            $match: {
              projectId: config.projectId,
            },
          },
          {
            $project: {
              fileName: 1,
              content: 1,
              'metadata.type': 1,
              score: { $meta: 'searchScore' },
            },
          },
          {
            $limit: params.limit,
          },
        ])
        .toArray();
    } else if (params.searchType === 'vector') {
      // Vector-only search
      const queryVector = await generateEmbedding(params.query);
      
      // Check if vector index exists
      const hasVectorData = await collection.findOne({
        projectId: config.projectId,
        contentVector: { $exists: true, $not: { $type: 'null' } },
      });

      if (!hasVectorData) {
        return {
          content: [
            {
              type: 'text',
              text: 'No embeddings found. Run memory_engineering/sync to generate embeddings first.',
            },
          ],
        };
      }

      // MongoDB Atlas Vector Search aggregation
      // Use without filter and then match - works with basic vector index
      results = await collection
        .aggregate([
          {
            $vectorSearch: {
              index: 'memory_vector_index',
              path: 'contentVector',
              queryVector: queryVector,
              numCandidates: params.limit * 10,
              limit: params.limit * 2,
            },
          },
          {
            $match: {
              projectId: config.projectId,
            },
          },
          {
            $project: {
              fileName: 1,
              content: 1,
              'metadata.type': 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
          {
            $limit: params.limit,
          },
        ])
        .toArray();
    } else {
      // Hybrid search using MongoDB's native $rankFusion
      const queryVector = await generateEmbedding(params.query);

      // Check if vector index exists
      const hasVectorData = await collection.findOne({
        projectId: config.projectId,
        contentVector: { $exists: true, $not: { $type: 'null' } },
      });

      if (!hasVectorData) {
        // Fall back to text search only
        logger.warn('No embeddings found, falling back to text search');
        params.searchType = 'text';
        return searchTool(params);
      }

      // MongoDB native hybrid search with $rankFusion
      results = await collection
        .aggregate([
          {
            $rankFusion: {
              input: {
                pipelines: {
                  vectorPipeline: [
                    {
                      $vectorSearch: {
                        index: 'memory_vector_index',
                        path: 'contentVector',
                        queryVector: queryVector,
                        numCandidates: params.limit * 10,
                        limit: params.limit,
                      },
                    },
                    {
                      $match: {
                        projectId: config.projectId,
                      },
                    },
                  ],
                  textPipeline: [
                    {
                      $search: {
                        index: 'memory_text_index',
                        text: {
                          query: params.query,
                          path: ['content', 'fileName'],
                        },
                      },
                    },
                    {
                      $match: {
                        projectId: config.projectId,
                      },
                    },
                    {
                      $limit: params.limit,
                    },
                  ],
                },
              },
              combination: {
                weights: {
                  vectorPipeline: 0.7,
                  textPipeline: 0.3,
                },
              },
            },
          },
          {
            $addFields: {
              score: { $meta: 'score' }, // RRF score from $rankFusion
            },
          },
          {
            $project: {
              fileName: 1,
              content: 1,
              'metadata.type': 1,
              score: 1,
            },
          },
          {
            $limit: params.limit,
          },
        ])
        .toArray();
    }

    if (!results || results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔍 No results found for query: "${params.query}"

💡 OPTIMIZATION TIPS:
1. 🔄 Run memory_engineering/sync to generate/update embeddings
2. 🎯 Try different keywords or concepts
3. 🚀 Use hybrid search (default) for best results!

${params.searchType === 'hybrid' ? 
`💎 MongoDB $rankFusion searched BOTH:
   - Semantic meaning (what you're looking for conceptually)
   - Exact keywords (what you typed)
   
   No matches means this is truly NEW territory!` :
`🔧 You used ${params.searchType} search only. Try 'hybrid' for MongoDB's FULL POWER!`}`,
          },
        ],
      };
    }

    logger.info(`Search completed: ${results.length} results for query "${params.query}"`);

    // Helper function to extract relevant context around search terms
    const getSmartPreview = (content: string, query: string): string => {
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const words = lowerQuery.split(/\s+/);
      
      // Find the best matching section
      let bestStart = 0;
      let bestScore = 0;
      
      // Check each position in the content
      for (let i = 0; i < content.length - 150; i += 50) {
        const section = lowerContent.substring(i, i + 300);
        let score = 0;
        
        // Count how many query words appear in this section
        words.forEach(word => {
          if (word && section.includes(word)) score++;
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestStart = i;
        }
      }
      
      // Extract the best section and clean it up
      let preview = content.substring(bestStart, bestStart + 200);
      
      // Try to start at sentence beginning
      const sentenceStart = preview.indexOf('. ');
      if (sentenceStart > 0 && sentenceStart < 50) {
        preview = preview.substring(sentenceStart + 2);
      }
      
      // Clean up and add ellipsis if needed
      preview = preview.replace(/\n+/g, ' ').trim();
      if (bestStart > 0) preview = '...' + preview;
      if (bestStart + 200 < content.length) preview = preview + '...';
      
      return preview;
    };

    // Format results
    const formattedResults = results.map((doc, index) => {
      const preview = params.searchType === 'text' || params.searchType === 'hybrid'
        ? getSmartPreview(doc.content, params.query)
        : doc.content.substring(0, 200).replace(/\n/g, ' ');
        
      const scoreInfo = params.searchType === 'hybrid' && doc.vectorScore && doc.textScore
        ? ` (vector: ${doc.vectorScore.toFixed(3)}, text: ${doc.textScore.toFixed(3)})`
        : '';
      
      // Ensure score is always a number before calling toFixed
      const scoreValue = typeof doc.score === 'number' ? doc.score : 0;
      
      // Add content stats for AI context awareness
      const contentStats = `[${(doc.content.length / 1024).toFixed(1)}KB, ${doc.metadata.version || 1} versions]`;
      
      return `## ${index + 1}. ${doc.fileName} (${doc.metadata.type}) ${contentStats}
Score: ${scoreValue.toFixed(3)}${scoreInfo}
Preview: ${preview}`;
    }).join('\n\n');

    // Create search type explanation
    let searchExplanation = '';
    if (params.searchType === 'hybrid') {
      searchExplanation = `💎 MongoDB $rankFusion Hybrid Search - The CROWN JEWEL!
🧪 Algorithm: 70% Semantic (Voyage AI) + 30% Keyword (Atlas Search)
🔄 Reciprocal Rank Fusion intelligently combined both approaches!

This search understood BOTH:
- What you meant conceptually (semantic vectors)
- The exact words you used (text matching)`;
    } else if (params.searchType === 'vector') {
      searchExplanation = `🧠 Vector Search: Found semantically similar content using Voyage AI embeddings
💡 TIP: Use 'hybrid' search for even better results!`;
    } else {
      searchExplanation = `📝 Text Search: Found keyword matches using Atlas Search
💡 TIP: Use 'hybrid' search to also find conceptually related content!`;
    }

    // Optimized for Cursor MCP - chunked responses for better performance
    const contentParts = [];
    
    // Part 1: Search header and explanation
    contentParts.push({
      type: 'text' as const,
      text: `🔍 MongoDB Search Results for: "${params.query}"

${searchExplanation}

📊 Found ${results.length} matches:`
    });
    
    // Part 2: Results (chunked if many results)
    if (formattedResults.length > 2000) {
      const chunks = formattedResults.match(/.{1,1800}/g) || [];
      chunks.forEach((chunk, index) => {
        contentParts.push({
          type: 'text' as const,
          text: `📋 Results (Part ${index + 1}/${chunks.length}):

${chunk}`
        });
      });
    } else {
      contentParts.push({
        type: 'text' as const,
        text: `📋 Search Results:

${formattedResults}`
      });
    }
    
    // Part 3: Next steps and MongoDB advantages
    contentParts.push({
      type: 'text' as const,
      text: `📍 NEXT STEPS:
1. 📖 Read the most relevant file: memory_engineering/read --fileName "[filename]"
2. 🔄 Update your knowledge: memory_engineering/update --fileName "[filename]"
3. 🚀 Create new features based on patterns found!

🏆 MongoDB ADVANTAGE: ONE database for:
- Operational data ✓
- Vector embeddings ✓  
- Full-text search ✓
- Version history ✓

No external vector DB needed - MongoDB does it ALL!`
    });

    return {
      content: contentParts,
    };
  } catch (error) {
    logger.error('Search tool error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Search failed: ';
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('no mongodb atlas search index found')) {
      errorMessage = `Search indexes are being created. Please wait a moment and try again.

The following indexes are being set up:
- Vector search index for semantic search
- Atlas Search index for text search

This typically takes 1-2 minutes. Run memory_engineering/sync to ensure indexes are created.`;
    } else if (errorMsg.includes('text index required')) {
      errorMessage = `Text search is not available yet. The Atlas Search index is being created.

In the meantime, you can use:
- searchType: "vector" for semantic search
- Run memory_engineering/sync to create search indexes`;
    } else if (error instanceof Error && 'code' in error && error.code === 6) {
      errorMessage = 'Connection error. Please check your MongoDB connection and try again.';
    } else {
      errorMessage += errorMsg || 'Unknown error occurred';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
    };
  }
}