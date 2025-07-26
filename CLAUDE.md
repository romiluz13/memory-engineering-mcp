# Memory Engineering MCP v2.0 - Technical Reference

## Project Overview
Memory Engineering MCP is a MongoDB-powered memory system that gives AI coding assistants persistent, intelligent memory across sessions.

## Architecture: 4-Class Memory System

### Memory Classes
1. **Core** - 6 foundational markdown files
2. **Working** - Event-based memories with 30-day TTL
3. **Insight** - Auto-discovered patterns
4. **Evolution** - Self-improvement tracking

### MongoDB Configuration
- **Database**: `memory_engineering` (configurable via MEMORY_ENGINEERING_DB)
- **Collection**: `memory_engineering_documents` (configurable via MEMORY_ENGINEERING_COLLECTION)
- **Required Version**: MongoDB 8.1+ (for $rankFusion)

### Indexes
1. **Compound Indexes**:
   - `{ projectId: 1, memoryClass: 1, 'metadata.freshness': -1 }`
   - `{ projectId: 1, 'metadata.importance': -1 }`

2. **TTL Index**:
   - `{ 'metadata.autoExpire': 1 }` with `expireAfterSeconds: 0`

3. **Vector Search Index** (`memory_vectors`):
   - Type: `vectorSearch`
   - Path: `contentVector`
   - Dimensions: 1024
   - Similarity: `cosine`

4. **Text Search Index** (`memory_text`):
   - Type: `search`
   - Fields: `searchableText`, `metadata.tags`
   - Analyzer: `lucene.standard`

## MCP Tools

### 1. memory_engineering/init
- Creates project-specific MongoDB collection
- Initializes 6 core memory files
- Sets up all indexes
- Returns project ID for isolation

### 2. memory_engineering/read
- Reads by `fileName` (core memories)
- Reads by `memoryClass` and `memoryType`
- Updates access count and freshness

### 3. memory_engineering/update
- Updates core memories by `fileName`
- Creates new memories with `memoryClass`
- Clears embeddings for re-sync
- Maintains version history

### 4. memory_engineering/search
- **rankfusion** (default): $rankFusion combining 4 pipelines
- **vector**: Semantic similarity
- **text**: Keyword matching
- **temporal**: Time-weighted
- Creates evolution memories for tracking

### 5. memory_engineering/sync
- Generates vector embeddings (voyage-3-large)
- Updates searchable text
- Ensures indexes exist
- Batch processing for efficiency

## $rankFusion Configuration
```javascript
{
  $rankFusion: {
    input: {
      pipelines: {
        semantic: [...],  // 40% weight - vector search
        recent: [...],    // 20% weight - temporal relevance
        patterns: [...],  // 30% weight - high importance
        evolution: [...]  // 10% weight - frequently accessed
      }
    },
    combination: {
      method: 'reciprocalRankFusion',
      weights: { semantic: 0.4, recent: 0.2, patterns: 0.3, evolution: 0.1 },
      k: 60
    }
  }
}
```

## Environment Variables
- `MONGODB_URI`: MongoDB connection string (required)
- `VOYAGE_API_KEY`: Voyage AI API key (required)
- `MEMORY_ENGINEERING_DB`: Database name (default: memory_engineering)
- `MEMORY_ENGINEERING_COLLECTION`: Collection name (default: memory_engineering_documents)

## Development Commands
```bash
npm run build        # TypeScript compilation
npm run test         # Run tests
npm run typecheck    # Type checking
npm run lint         # ESLint
npm run db:indexes   # Create indexes
```

## AI Agent Integration
Works seamlessly with:
- Cursor (via MCP)
- Windsurf (via MCP)
- Claude Code (native MCP)

## Version
Current: 2.0.0
- Removed context engineering
- 4-class memory system
- MongoDB $rankFusion search
- Evolution tracking