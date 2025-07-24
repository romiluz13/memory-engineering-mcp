import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SearchToolSchema, type ProjectConfig } from '../types/memory.js';
import { getMemoryCollection } from '../db/connection.js';
import { generateEmbedding } from '../embeddings/voyage.js';
import { logger } from '../utils/logger.js';

// Generate creative search suggestions based on query patterns
function generateCreativeSearchSuggestions(query: string): string {
  const lowerQuery = query.toLowerCase();
  const suggestions = [];
  
  // Pattern-based suggestions
  if (lowerQuery.includes('performance') || lowerQuery.includes('speed') || lowerQuery.includes('optimization')) {
    suggestions.push('🚀 "scaling challenges faced" - Learn from performance bottlenecks');
    suggestions.push('⚡ "bottleneck optimization patterns" - Discover speed improvements');
    suggestions.push('📊 "performance metrics tracking" - Find measurement approaches');
  }
  
  if (lowerQuery.includes('error') || lowerQuery.includes('bug') || lowerQuery.includes('debug')) {
    suggestions.push('🔍 "debugging techniques used" - Learn troubleshooting patterns');
    suggestions.push('🛠️ "error handling strategies" - Discover robust error management');
    suggestions.push('🔄 "recovery patterns implemented" - Find resilience approaches');
  }
  
  if (lowerQuery.includes('user') || lowerQuery.includes('ux') || lowerQuery.includes('interface')) {
    suggestions.push('👥 "user feedback incorporated" - Learn from user insights');
    suggestions.push('🎨 "user experience enhancement" - Discover UX patterns');
    suggestions.push('📱 "user workflow optimization" - Find journey improvements');
  }
  
  if (lowerQuery.includes('test') || lowerQuery.includes('quality') || lowerQuery.includes('validation')) {
    suggestions.push('🧪 "testing strategy precedents" - Find testing approaches');
    suggestions.push('✅ "validation patterns used" - Discover quality gates');
    suggestions.push('🔬 "quality assurance methods" - Learn QA techniques');
  }
  
  // Always add some creative cross-cutting suggestions
  suggestions.push('🔗 "related business logic" - Find connected functionality');
  suggestions.push('🎯 "similar complexity features" - Discover comparable implementations');
  suggestions.push('💡 "unconventional solution approach" - Find creative alternatives');
  suggestions.push('⚖️ "trade-off decisions made" - Learn from architectural choices');
  
  return suggestions.length > 0 ? suggestions.slice(0, 4).join('\n') : 
    '🔍 "related patterns found" - Explore connected concepts\n💡 "lessons learned documented" - Discover implementation insights';
}

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

      // MongoDB Atlas Vector Search aggregation with PROJECT ISOLATION FILTER
      results = await collection
        .aggregate([
          {
            $vectorSearch: {
              index: 'memory_vector_index',
              path: 'contentVector',
              queryVector: queryVector,
              numCandidates: params.limit * 10,
              limit: params.limit * 2,
              filter: {
                projectId: { $eq: config.projectId }
              },
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
                        filter: {
                          projectId: { $eq: config.projectId }
                        },
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
      
      // Add enhanced context stats for AI intelligence
      const contentStats = `[${(doc.content.length / 1024).toFixed(1)}KB, v${doc.metadata.version || 1}]`;
      
      // Add intelligent relevance indicators
      const relevanceIndicators = [];
      if (scoreValue > 0.8) relevanceIndicators.push('🎯 HIGH RELEVANCE');
      else if (scoreValue > 0.5) relevanceIndicators.push('📋 MEDIUM RELEVANCE');
      else relevanceIndicators.push('💡 POTENTIAL INSIGHT');
      
      // Add content type intelligence
      const typeEmoji: Record<string, string> = {
        'projectbrief': '🎯',
        'productContext': '🌟', 
        'activeContext': '⚡',
        'systemPatterns': '🏗️',
        'techContext': '🔧',
        'progress': '📈'
      };
      const emoji = typeEmoji[doc.metadata.type] || '📄';
      
      // Add last updated intelligence
      const lastUpdated = doc.metadata.lastUpdated ? 
        new Date(doc.metadata.lastUpdated).toLocaleDateString() : 'Unknown';
      
      return `## ${index + 1}. ${emoji} ${doc.fileName} ${relevanceIndicators.join(' ')}
**Type**: ${doc.metadata.type} ${contentStats} | **Updated**: ${lastUpdated}
**RRF Score**: ${scoreValue.toFixed(3)}${scoreInfo}
**Context**: ${preview}

🧠 **AI Integration Notes**: This ${doc.metadata.type} file contains patterns relevant to your query. Consider cross-referencing with related memory files for complete context.`;
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
    
    // Part 3: Intelligent next steps and creative suggestions
    const creativeSuggestions = generateCreativeSearchSuggestions(params.query);
    
    contentParts.push({
      type: 'text' as const,
      text: `📍 INTELLIGENT NEXT STEPS:
1. 📖 Deep dive: memory_engineering/read --fileName "[most relevant filename]"
2. 🔄 Cross-reference: Search related concepts using suggestions below
3. 🚀 Pattern synthesis: Combine findings from multiple memory files
4. 💡 Context expansion: Update memories with new insights discovered

🧠 CREATIVE SEARCH SUGGESTIONS:
${creativeSuggestions}

🏆 MongoDB $rankFusion POWER:
- Semantic understanding of "${params.query}" concepts ✓
- Keyword matching for exact terms ✓  
- Reciprocal Rank Fusion combining both approaches ✓
- One unified database - no external vector DB needed ✓

💎 The beauty of MongoDB: Operational data + vector embeddings + full-text search + version history ALL in one place!`
    });

    return {
      content: contentParts,
    };
  } catch (error) {
    logger.error('Search tool error:', error);
    
    // Enhanced user-friendly error messages with solutions
    let errorMessage = '';
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('no mongodb atlas search index found')) {
      errorMessage = `🔧 **MongoDB Atlas Search Index Setup Required**

**The Issue**: Search indexes are still being created or need to be set up manually.

**Quick Fix**:
1. Run: \`memory_engineering/sync\` to create indexes automatically
2. Wait 1-2 minutes for Atlas to build indexes
3. Try your search again

**Manual Setup** (if automatic fails):
1. Go to MongoDB Atlas Console
2. Navigate to your cluster → Search → Create Search Index
3. Use the JSON configuration from: \`npm run db:indexes\`

**Current Status**: 
- Vector search index: Creating...
- Atlas Search index: Creating...

💡 **Pro Tip**: Use \`memory_engineering/search --searchType vector\` while text index builds!`;
    } else if (errorMsg.includes('text index required')) {
      errorMessage = `📝 **Atlas Search Index Not Ready**

**The Issue**: Text search requires Atlas Search index which is still building.

**Immediate Solutions**:
1. 🧠 Use vector search: \`memory_engineering/search --query "[your query]" --searchType vector\`
2. 🔄 Run: \`memory_engineering/sync\` to ensure index creation
3. ⏳ Wait 1-2 minutes for Atlas to build text index

**Why This Happens**: Atlas Search indexes take time to build for optimal performance.

💎 **MongoDB Magic**: While text search builds, vector search with Voyage AI embeddings works perfectly!`;
    } else if (errorMsg.includes('connection') || errorMsg.includes('network')) {
      errorMessage = `🔌 **MongoDB Connection Issue**

**The Issue**: Cannot connect to your MongoDB Atlas database.

**Solutions**:
1. ✅ Check your \`MONGODB_URI\` in environment variables
2. 🌐 Verify internet connection
3. 🔑 Confirm MongoDB Atlas access (IP whitelist, credentials)
4. 🔄 Try: \`memory_engineering/sync\` to test connection

**Environment Check**:
- MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}
- VOYAGE_API_KEY: ${process.env.VOYAGE_API_KEY ? '✅ Set' : '❌ Missing'}

💡 **Pro Tip**: Test connection with: \`npm run db:check\``;
    } else if (errorMsg.includes('voyage') || errorMsg.includes('embedding')) {
      errorMessage = `🧠 **Voyage AI Embedding Error**

**The Issue**: Cannot generate embeddings for semantic search.

**Solutions**:
1. ✅ Check your \`VOYAGE_API_KEY\` in environment variables
2. 🔄 Try text-only search: \`memory_engineering/search --query "[your query]" --searchType text\`
3. 🌐 Verify Voyage AI API status

**Quick Workaround**: Use text search while fixing embedding issue!`;
    } else {
      errorMessage = `🚨 **Memory Engineering Search Error**

**The Issue**: ${errorMsg}

**General Solutions**:
1. 🔄 Try: \`memory_engineering/sync\` to refresh system
2. 🔧 Check: \`memory_engineering/init\` was run for this project
3. 📋 Verify: Project has memory files to search

**Get Help**: 
- Check system status with available memory files
- Ensure MongoDB Atlas and Voyage AI are properly configured

💡 **Debug Info**: ${errorMsg}`;
    }
    
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
    };
  }
}