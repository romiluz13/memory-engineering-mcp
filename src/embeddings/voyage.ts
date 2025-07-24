import { logger } from '../utils/logger.js';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_MODEL = 'voyage-3';
const EMBEDDING_DIMENSIONS = 1024;

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

export async function generateEmbedding(text: string): Promise<number[]> {
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as VoyageEmbeddingResponse;
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No embedding returned from Voyage AI');
    }

    const firstData = data.data[0];
    if (!firstData) {
      throw new Error('No embedding data returned from Voyage AI');
    }
    const embedding = firstData.embedding;
    
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Unexpected embedding dimensions: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`);
    }

    logger.debug(`Generated embedding for text (${text.length} chars), tokens used: ${data.usage.total_tokens}`);
    
    return embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY environment variable is not set');
  }

  if (texts.length === 0) {
    return [];
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: EMBEDDING_MODEL,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as VoyageEmbeddingResponse;
    
    if (!data.data || data.data.length !== texts.length) {
      throw new Error('Unexpected number of embeddings returned from Voyage AI');
    }

    // Sort by index to ensure correct order
    const sortedEmbeddings = data.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);

    logger.debug(`Generated ${texts.length} embeddings, tokens used: ${data.usage.total_tokens}`);
    
    return sortedEmbeddings;
  } catch (error) {
    logger.error('Error generating embeddings:', error);
    throw error;
  }
}

export { EMBEDDING_DIMENSIONS };