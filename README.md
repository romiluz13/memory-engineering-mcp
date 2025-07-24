# Memory Engineering MCP Server

[![npm version](https://badge.fury.io/js/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A MongoDB-powered MCP (Model Context Protocol) server that enables AI assistants to maintain persistent, project-aware memory across sessions. Built with MongoDB Atlas Vector Search's native $rankFusion hybrid search capabilities.

## Overview

Memory Engineering MCP transforms how AI assistants work with project context by providing:

- **Persistent Memory**: Context survives across sessions and conversations
- **Project Isolation**: Each project maintains its own secure memory space
- **Hybrid Search**: MongoDB's native $rankFusion combines vector and text search
- **Context Engineering**: Two-phase workflow for systematic feature development

## Key Features

### 🧠 Intelligent Memory System
- Structured project documentation that evolves with your codebase
- Six core memory files: project brief, product context, active context, system patterns, tech context, and progress
- Automatic cross-reference detection between memory files

### 🔍 MongoDB $rankFusion Hybrid Search
- Native MongoDB 8.1+ $rankFusion operator for hybrid search
- Reciprocal Rank Fusion algorithm intelligently combines results
- Configurable weights (default: 70% vector, 30% text)
- Voyage AI embeddings for semantic similarity

### 🏗️ Context Engineering Workflow
- **Phase 1**: `memory_engineering/generate-prp` - Research and planning
- **Phase 2**: `memory_engineering/execute-prp` - Implementation with validation
- ULTRATHINK integration for systematic feature development
- Validation gates ensure production-ready code

### 🚀 Production Ready
- TypeScript with strict type checking
- Comprehensive test suite with Vitest
- MongoDB Atlas Vector Search integration
- ESLint and Prettier for code quality

## Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster with Vector Search enabled
- Voyage AI API key

### Quick Start

1. **Install the package**:
```bash
npm install -g memory-engineering-mcp
```

2. **Configure environment variables**:
```bash
export MONGODB_URI="your-mongodb-connection-string"
export VOYAGE_API_KEY="your-voyage-api-key"
```

3. **Configure in Claude Desktop**:
```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "memory-engineering-mcp",
      "env": {
        "MONGODB_URI": "your-mongodb-connection-string",
        "VOYAGE_API_KEY": "your-voyage-api-key"
      }
    }
  }
}
```

### Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/romiluz13/memory-engineering-mcp.git
cd memory-engineering-mcp
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Configure environment**:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Build and setup**:
```bash
pnpm build
pnpm run db:indexes
```

## Available MCP Tools

### Core Memory Operations
- `memory_engineering/init` - Initialize memory system for a project
- `memory_engineering/read` - Read stored memory files
- `memory_engineering/update` - Update memory files with new content
- `memory_engineering/search` - Hybrid search across project memories
- `memory_engineering/sync` - Generate embeddings and update indexes

### Context Engineering Workflow
- `memory_engineering/generate-prp` - Research phase: analyze patterns and create implementation plan
- `memory_engineering/execute-prp` - Implementation phase: execute plan with validation loops

## Memory Structure

The system uses six core memory files:

1. **projectbrief.md** - Project goals, scope, and high-level requirements
2. **productContext.md** - Problem domain, user needs, and solution approach
3. **activeContext.md** - Current development focus and recent changes
4. **systemPatterns.md** - Architecture decisions and design patterns
5. **techContext.md** - Technology stack, tools, and constraints
6. **progress.md** - Implementation status and next steps

## MongoDB Setup

### Required Indexes

The system requires specific MongoDB indexes for optimal performance:

```bash
# Create indexes automatically
pnpm run db:indexes

# Or check existing indexes
pnpm run db:check
```

### Vector Search Index

MongoDB Atlas Vector Search index configuration:
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

## Usage Examples

### Basic Memory Operations
```bash
# Initialize memory for a project
memory_engineering/init --projectPath "/path/to/project"

# Read project brief
memory_engineering/read --fileName "projectbrief.md"

# Update active context
memory_engineering/update --fileName "activeContext.md" --content "Working on authentication system"

# Search for authentication patterns
memory_engineering/search --query "authentication patterns" --searchType "hybrid"
```

### Context Engineering Workflow
```bash
# Phase 1: Research and planning
memory_engineering/generate-prp --request "I need to add user authentication"

# Phase 2: Implementation
memory_engineering/execute-prp --prp "user-authentication"
```

## Architecture

### Project Isolation
Each project gets:
- Unique project ID based on workspace path
- Isolated MongoDB documents with `projectId` filter
- Separate vector embeddings and search indexes
- Independent memory evolution

### Hybrid Search
MongoDB's $rankFusion operator provides:
- Semantic search via Voyage AI embeddings
- Text search via Atlas Search
- Intelligent result ranking
- Configurable scoring weights

### Context Engineering
Two-phase workflow ensures:
- Systematic research before implementation
- Pattern discovery from existing code
- Validation loops with self-correction
- Production-ready code output

## Testing

Run the test suite:
```bash
pnpm test
```

Run with coverage:
```bash
pnpm test:coverage
```

Test MCP functionality:
```bash
pnpm mcp:inspect
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Check linting: `pnpm lint`
6. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `VOYAGE_API_KEY` | Voyage AI API key for embeddings | Yes |
| `MEMORY_ENGINEERING_DB` | Database name (default: memory_engineering) | No |
| `MEMORY_ENGINEERING_COLLECTION` | Collection name (default: memory_engineering_documents) | No |

## Troubleshooting

### Common Issues

**Vector search not working**:
- Ensure MongoDB Atlas cluster supports Vector Search
- Check that vector index is created and active
- Run `pnpm run db:check` to verify setup

**Embeddings not generating**:
- Verify Voyage AI API key is set correctly
- Check network connectivity
- Run `memory_engineering/sync` to regenerate embeddings

**Project isolation issues**:
- Ensure each project has unique `projectId`
- Check MongoDB queries include `projectId` filter
- Verify `.memory-engineering/config.json` exists

## License

MIT License. See [LICENSE](LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/romiluz13/memory-engineering-mcp)
- [npm Package](https://www.npmjs.com/package/memory-engineering-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/products/platform/atlas-vector-search)
- [Voyage AI](https://voyageai.com/)