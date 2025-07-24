# MCP Setup Guide

This guide explains how to configure Memory Engineering MCP with various AI assistants and development environments.

## Prerequisites

Before setting up the MCP server, ensure you have:

1. **MongoDB Atlas cluster** with Vector Search enabled
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

### Claude Desktop Configuration Locations

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

## Alternative IDE Setup

### Cursor IDE

1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "MCP" settings
3. Add the configuration above

### Other MCP-compatible tools

Use the same configuration format with the appropriate command:

```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "npx",
      "args": ["memory-engineering-mcp"],
      "env": {
        "MONGODB_URI": "your-connection-string",
        "VOYAGE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (M0 free tier works for testing)
3. Enable Vector Search in cluster settings
4. Get your connection string

### 2. Create Vector Search Index

The system will attempt to create indexes automatically, but you may need to create the vector search index manually:

1. Go to Atlas Console → Browse Collections
2. Create database: `memory_engineering`
3. Create collection: `memory_engineering_documents`
4. Go to Search Indexes tab
5. Create Search Index with this configuration:

```json
{
  "name": "memory_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "contentVector",
      "numDimensions": 1024,
      "similarity": "cosine"
    }]
  }
}
```

## Voyage AI Setup

1. Sign up at [voyageai.com](https://voyageai.com)
2. Get your API key from the dashboard
3. Add to environment variables

## Testing the Setup

### 1. Initialize for a project

```bash
# This will be available as an MCP tool in your AI assistant
memory_engineering/init --projectPath "/path/to/your/project" --projectName "My Project"
```

### 2. Test basic operations

```bash
# Update a memory file
memory_engineering/update --fileName "projectbrief.md" --content "# My Project\n\nProject description here."

# Generate embeddings
memory_engineering/sync

# Search memories
memory_engineering/search --query "project description" --searchType "hybrid"
```

### 3. Test Context Engineering workflow

```bash
# Phase 1: Research and planning
memory_engineering/generate-prp --request "I need to add user authentication"

# Phase 2: Implementation
memory_engineering/execute-prp --prp "user-authentication"
```

## Development Setup

If you want to contribute or modify the code:

### 1. Clone and setup

```bash
git clone https://github.com/romiluz13/memory-engineering-mcp.git
cd memory-engineering-mcp
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Build and test

```bash
pnpm build
pnpm run db:indexes  # Create MongoDB indexes
pnpm test           # Run tests
pnpm mcp:inspect    # Test MCP functionality
```

## Troubleshooting

### "MCP server not found" error

1. Verify the package is installed: `npm list -g memory-engineering-mcp`
2. Check your PATH includes npm global binaries
3. Try using npx: `npx memory-engineering-mcp` instead

### "Connection refused" error

1. Verify MongoDB Atlas connection string is correct
2. Check IP address is whitelisted in Atlas (or use 0.0.0.0/0 for development)
3. Test connection with MongoDB Compass

### "Vector search index not found" error

1. Ensure your Atlas cluster supports Vector Search
2. Create the vector search index manually (see MongoDB Atlas Setup)
3. Run `memory_engineering/sync` to generate embeddings

### "Voyage AI authentication failed" error

1. Verify your Voyage AI API key is correct
2. Check you have sufficient credits
3. Test the API key with a simple curl request

### Permission denied errors

1. Ensure the process has write permissions to create `.memory-engineering/` directory
2. Check file system permissions in your project directory

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | - | Yes |
| `VOYAGE_API_KEY` | Voyage AI API key | - | Yes |
| `MEMORY_ENGINEERING_DB` | Database name | `memory_engineering` | No |
| `MEMORY_ENGINEERING_COLLECTION` | Collection name | `memory_engineering_documents` | No |
| `NODE_ENV` | Environment mode | `production` | No |

## Security Notes

- Never commit real API credentials to version control
- Use environment variables or secure configuration management
- Rotate API keys regularly
- Use MongoDB Atlas IP whitelisting in production
- Consider using MongoDB Atlas App Services for additional security

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the [GitHub Issues](https://github.com/romiluz13/memory-engineering-mcp/issues)
3. Create a new issue with:
   - Your setup (OS, Node version, etc.)
   - Complete error messages
   - Steps to reproduce