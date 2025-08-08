import { VoyageAIClient } from 'voyageai';
import type { CodeChunk } from '../types/memory-v5.js';
import { logger } from '../utils/logger.js';

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const BATCH_SIZE = 100; // Process chunks in batches

let voyageClient: VoyageAIClient | null = null;

function getVoyageClient(): VoyageAIClient {
  if (!voyageClient) {
    if (!VOYAGE_API_KEY) {
      throw new Error('VOYAGE_API_KEY environment variable is not set');
    }
    voyageClient = new VoyageAIClient({ apiKey: VOYAGE_API_KEY });
  }
  return voyageClient;
}



/**
 * Generate embeddings for code chunks using voyage-3 model.
 * Each chunk is embedded with its signature, content, and metadata.
 */
export async function generateCodeEmbeddings(
  chunks: Omit<CodeChunk, '_id' | 'contentVector' | 'createdAt' | 'updatedAt'>[]
): Promise<number[][]> {
  const client = getVoyageClient();
  
  // Simplified: Generate embeddings for each chunk individually
  // This avoids the complexity of contextualizedEmbed which seems to have issues
  const chunkTexts = chunks.map(chunk => {
    // Combine signature, content, and metadata for rich embedding
    const text = `${chunk.chunk.signature || chunk.chunk.name}
${chunk.chunk.content}
File: ${chunk.filePath} | Type: ${chunk.chunk.type} | Patterns: ${chunk.metadata.patterns.join(', ')}`;
    return text;
  });
  
  // Generate embeddings in batches using regular embed (not contextualized)
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
    const batch = chunkTexts.slice(i, i + BATCH_SIZE);

    try {
      logger.info(`Generating embeddings for batch of ${batch.length} chunks with voyage-3`);

      // Use regular embed which is more stable
      const response = await client.embed({
        input: batch,
        model: 'voyage-3',  // Use stable non-contextualized model
        inputType: 'document'
      });

      logger.info(`Received response with ${response.data?.length || 0} embeddings`);

      // Extract embeddings from regular embed response
      // The response structure is simpler: response.data[index].embedding
      if (response.data && Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0) {
            allEmbeddings.push(item.embedding);
            logger.debug(`Added embedding with ${item.embedding.length} dimensions`);
          } else {
            logger.error(`Invalid embedding in response:`, item);
          }
        }
      } else {
        logger.error('No data in embedding response:', response);
      }

      logger.info(`Total embeddings collected so far: ${allEmbeddings.length}`);

    } catch (error: any) {
      // More robust error handling for embed API
      if (error.message?.includes('invalid model')) {
        throw new Error(`Model voyage-3 not available. Please check your Voyage AI account permissions.`);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Voyage AI API key. Please check your VOYAGE_API_KEY environment variable.');
      } else {
        logger.error('Failed to generate code embeddings:', error);
        throw error;
      }
    }
  }
  
  // SIMPLIFIED: Just return all embeddings in the order they were generated
  // The contextualized embeddings should maintain the same order as the input chunks
  logger.debug(`Generated ${allEmbeddings.length} embeddings for ${chunks.length} chunks`);

  if (allEmbeddings.length !== chunks.length) {
    logger.error(`Embedding count mismatch: ${allEmbeddings.length} embeddings for ${chunks.length} chunks`);

    // Pad with empty arrays if we have fewer embeddings
    while (allEmbeddings.length < chunks.length) {
      allEmbeddings.push([]);
    }

    // Truncate if we have too many embeddings
    if (allEmbeddings.length > chunks.length) {
      allEmbeddings.splice(chunks.length);
    }
  }

  logger.info(`Returning ${allEmbeddings.filter(e => e.length > 0).length} valid embeddings out of ${chunks.length} chunks`);

  return allEmbeddings;
}

/**
 * Generate embedding for a code search query using voyage-3 model
 */
export async function generateCodeQueryEmbedding(query: string): Promise<number[]> {
  const client = getVoyageClient();

  try {
    logger.info(`Generating embedding for query: "${query.substring(0, 100)}..."`);

    // Use regular embed API which is more stable
    const response = await client.embed({
      input: [query],  // Single query
      model: 'voyage-3',  // Same model as documents for consistency
      inputType: 'query'  // This is a search query
    });

    // Extract embedding from response
    if (response.data && response.data.length > 0) {
      const item = response.data[0];
      if (item && item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0) {
        logger.info(`Generated query embedding with ${item.embedding.length} dimensions`);
        return item.embedding;
      }
    }
    
    throw new Error('Failed to generate embedding for query');
  } catch (error: any) {
    // Provide specific error messages
    if (error.message?.includes('invalid model')) {
      throw new Error(`Model voyage-3 not available for queries.`);
    } else if (error.response?.status === 401) {
      throw new Error('Invalid Voyage AI API key for query embedding.');
    } else {
      logger.error('Failed to generate query embedding:', error);
      throw error;
    }
  }
}

/**
 * Example of how contextualized embeddings solve the "golden chunk" problem:
 * 
 * File: userService.ts
 * Chunks:
 * 1. "import { User } from './models/User';"
 * 2. "export class UserService { ... }"
 * 3. "async authenticate(email: string, password: string) { ... }"
 * 
 * With standard embeddings:
 * - Chunk 3 loses context about UserService class
 * - Search for "UserService authenticate" might not find chunk 3
 * 
 * With contextualized embeddings:
 * - Chunk 3 is embedded knowing it's part of UserService
 * - Search for "UserService authenticate" correctly finds chunk 3
 * - Each chunk "knows" about the imports and class structure
 */