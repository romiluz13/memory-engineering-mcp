import { logger } from '../utils/logger.js';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_MODEL = 'voyage-3'; // Latest general-purpose model for text
const EMBEDDING_DIMENSIONS = 1024; // voyage-3 default dimensions

interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

export async function generateEmbedding(
  text: string,
  inputType: 'document' | 'query' = 'document'
): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: EMBEDDING_MODEL,
        input_type: inputType,  // Official Voyage AI parameter for optimization
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as VoyageEmbeddingResponse;
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No embeddings returned from Voyage AI');
    }

    return data.data[0]?.embedding || [];
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw error;
  }
}

// Convenience functions for specific use cases (official Voyage AI optimization)
export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(text, 'document');
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(text, 'query');
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable is not set');
  }

  try {
    // Process in batches to avoid API limits
    const batchSize = 50;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await fetch(VOYAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: batch,
          model: EMBEDDING_MODEL,
          input_type: 'document',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voyage AI API error: ${response.status} ${error}`);
      }

      const data = await response.json() as VoyageEmbeddingResponse;
      
      if (!data.data || data.data.length !== batch.length) {
        throw new Error('Unexpected number of embeddings returned from Voyage AI');
      }

      // Sort by index to ensure correct order
      const sortedEmbeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
      
      embeddings.push(...sortedEmbeddings);
    }

    return embeddings;
  } catch (error) {
    logger.error('Failed to generate embeddings:', error);
    throw error;
  }
}

export { EMBEDDING_DIMENSIONS };