# MCP Setup Guide

This guide explains how to configure Memory Engineering MCP with various AI assistants and development environments.

## Prerequisites

Before setting up the MCP server, ensure you have:

1. **MongoDB Atlas cluster** (8.1+ for $rankFusion) with Vector Search enabled
2. **Voyage AI API key** from [voyageai.com](https://voyageai.com)
3. **Node.js 18+** installed

## Quick Setup

### 1. Install globally (recommended)

```bash
npm install -g memory-engineering-mcp
```

### 2. Configure environment variables

Create a `.env` file or set environment variables:

```bash
export MONGODB_URI="your-mongodb-atlas-connection-string"
export VOYAGE_API_KEY="your-voyage-ai-api-key"
```

## Claude Desktop Setup

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "memory-engineering-mcp",
      "env": {
        "MONGODB_URI": "your-mongodb-atlas-connection-string",
        "VOYAGE_API_KEY": "your-voyage-ai-api-key"
      }
    }
  }
}
```

### Configuration Locations

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

## Cursor Setup

For Cursor, add the MCP server in Settings > Features > MCP:

```json
{
  "memory-engineering": {
    "command": "npx",
    "args": ["memory-engineering-mcp"],
    "env": {
      "MONGODB_URI": "${MONGODB_URI}",
      "VOYAGE_API_KEY": "${VOYAGE_API_KEY}"
    }
  }
}
```

## MongoDB Setup

### Required Indexes

The MCP server automatically creates these indexes on initialization:

1. **Compound Indexes**:
   - `{ projectId: 1, memoryClass: 1, 'metadata.freshness': -1 }`
   - `{ projectId: 1, 'metadata.importance': -1 }`

2. **TTL Index** (for auto-expiring working memories):
   - `{ 'metadata.autoExpire': 1 }`

3. **Vector Search Index** (`memory_vectors`):
   ```json
   {
     "type": "vectorSearch",
     "fields": [{
       "type": "vector",
       "path": "contentVector",
       "numDimensions": 1024,
       "similarity": "cosine"
     }]
   }
   ```

4. **Text Search Index** (`memory_text`):
   ```json
   {
     "type": "search",
     "mappings": {
       "dynamic": false,
       "fields": {
         "searchableText": { "type": "string" },
         "metadata.tags": { "type": "string" }
       }
     }
   }
   ```

## Testing the Setup

### 1. Initialize for a project

```bash
# This will be available as an MCP tool in your AI assistant
memory_engineering/init
```

### 2. Test basic operations

```bash
# Read a core memory file
memory_engineering/read --fileName "projectbrief.md"

# Update a memory file
memory_engineering/update --fileName "projectbrief.md" --content "# My Project\n\nProject description here."

# Generate embeddings
memory_engineering/sync

# Search memories
memory_engineering/search --query "project description"
```

### 3. Verify search types

```bash
# $rankFusion search (default)
memory_engineering/search --query "authentication"

# Vector search only
memory_engineering/search --query "authentication" --searchType "vector"

# Text search only
memory_engineering/search --query "authentication" --searchType "text"

# Temporal search
memory_engineering/search --query "recent changes" --searchType "temporal"
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (required)
- `VOYAGE_API_KEY`: Voyage AI API key (required)
- `MEMORY_ENGINEERING_DB`: Database name (default: "memory_engineering")
- `MEMORY_ENGINEERING_COLLECTION`: Collection name (default: "memory_engineering_documents")

## Troubleshooting

### Connection Issues
- Verify MongoDB URI includes proper authentication
- Ensure MongoDB cluster allows connections from your IP
- Check that Vector Search is enabled on your Atlas cluster

### Search Not Working
- Run `memory_engineering/sync` to generate embeddings
- Verify indexes exist in MongoDB Atlas UI
- Ensure MongoDB version is 8.1+ for $rankFusion

### Memory Not Persisting
- Check projectId consistency
- Verify MongoDB write permissions
- Look for errors in console output

## Support

For issues or questions:
- GitHub Issues: [github.com/romiluz13/memory-engineering-mcp/issues](https://github.com/romiluz13/memory-engineering-mcp/issues)
- Documentation: See README.md and CLAUDE.md