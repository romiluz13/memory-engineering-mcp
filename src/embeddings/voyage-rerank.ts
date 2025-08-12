/**
 * Voyage AI Reranking - ZERO RISK Addition
 * This is purely additive - if it fails, search works normally
 */

import { logger } from '../utils/logger.js';

const RERANK_API_URL = 'https://api.voyageai.com/v1/rerank';
const RERANK_MODEL = 'rerank-2.5'; // Full version for best quality

interface RerankResponse {
  object: string;
  data: Array<{
    index: number;
    relevance_score: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

/**
 * Rerank documents for better relevance
 * SAFE: If this fails, returns original order
 */
export async function rerankResults(
  query: string,
  documents: any[],
  topK: number = 10
): Promise<any[]> {
  // Safety check - if no API key or too few docs, return original
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || documents.length <= 1) {
    return documents.slice(0, topK);
  }

  try {
    // Prepare document texts for reranking
    const documentTexts = documents.map(doc => {
      if (doc.content) {
        // For memory documents
        return doc.content.substring(0, 1000);
      } else if (doc.metadata) {
        // For code chunks
        return `${doc.metadata.signature || ''}\n${doc.chunkContent || doc.content || ''}`.substring(0, 1000);
      }
      return JSON.stringify(doc).substring(0, 1000);
    });

    // Call Voyage AI rerank API
    const response = await fetch(RERANK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        documents: documentTexts,
        model: RERANK_MODEL,
        top_k: Math.min(topK, documents.length)
      })
    });

    if (!response.ok) {
      // Silently fail - return original order
      logger.debug(`Rerank API returned ${response.status}, using original order`);
      return documents.slice(0, topK);
    }

    const data = await response.json() as RerankResponse;
    
    // Reorder documents based on rerank scores
    const rerankedDocs = data.data
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .map(item => documents[item.index])
      .filter(Boolean);

    logger.debug(`✨ Reranked ${rerankedDocs.length} results for better relevance`);
    return rerankedDocs;

  } catch (error) {
    // SAFETY: Any error = return original order
    logger.debug('Reranking unavailable, using original order', error);
    return documents.slice(0, topK);
  }
}

/**
 * Check if reranking is available (for logging only)
 */
export function isRerankingAvailable(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}
