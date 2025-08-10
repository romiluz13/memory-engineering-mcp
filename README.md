# 🧠 Memory Engineering MCP

[![npm version](https://img.shields.io/npm/v/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Persistent memory and semantic code understanding for AI assistants.** Built on MongoDB Atlas Vector Search and Voyage AI embeddings.

## 🔥 The Game Changer: Code Embeddings

**This is what makes Memory Engineering different from everything else:**

### Revolutionary Code Chunking
- **Smart Semantic Boundaries**: Tracks braces, parentheses, and indentation to capture COMPLETE functions (up to 200 lines) and classes (up to 300 lines)
- **Context-Aware**: Every chunk includes its imports, dependencies, and surrounding context
- **Pattern Detection**: Automatically identifies 20+ code patterns (error-handling, async, authentication, etc.)

### Why This Matters
```javascript
// Traditional chunking BREAKS this function in half:
function processPayment(order) {  // <- Chunk 1 ends here
  validateOrder(order);           // <- Chunk 2 starts here, loses context!
  // ... 50 more lines
}

// Our chunking keeps it COMPLETE:
function processPayment(order) {  // <- Full function preserved
  validateOrder(order);           
  // ... entire function included
}                                 // <- Chunk ends at semantic boundary
```

### Semantic Code Search That Actually Works
```bash
# Find similar implementations
search --query "JWT refresh" --codeSearch "similar"

# Find who implements an interface
search --query "AuthProvider" --codeSearch "implements"  

# Find usage patterns
search --query "error handling" --codeSearch "pattern"

# Natural language → Code
search --query "how do we validate users"
# Automatically searches: authenticate, verify, check, validate patterns
```

## 🧠 The 7 Core Memories

Inspired by Cline, but enhanced with MongoDB persistence:

1. **activeContext** - What you're doing RIGHT NOW (update every 3-5 min!)
2. **projectbrief** - Core requirements and features
3. **systemPatterns** - Architecture decisions and patterns
4. **techContext** - Stack, dependencies, constraints  
5. **progress** - What's done, in-progress, and next
6. **productContext** - Why this exists, user needs
7. **codebaseMap** - File structure with embedded statistics

## 💪 Technical Architecture

### MongoDB Atlas Integration
- **Vector Search**: 2048-dimensional embeddings with HNSW indexing
- **Hybrid Search**: Combines semantic + keyword search with RankFusion
- **Auto-indexing**: Manages compound, text, and vector indexes automatically
- **Connection pooling**: 5-100 connections with retry logic

### Voyage AI Embeddings
- **Model**: voyage-3 (1024 dimensions for general, 2048 for code)
- **Contextualized**: Each chunk knows about surrounding code
- **Batch processing**: 100 chunks at a time for efficiency
- **Smart caching**: Only re-embeds changed files

### Code Intelligence
```typescript
// What gets captured in each chunk:
interface CodeChunk {
  chunk: {
    type: 'function' | 'class' | 'method' | 'module';
    signature: string;      // Full signature with params
    content: string;        // Complete code
    context: string;        // Imports and dependencies
    startLine: number;
    endLine: number;
  };
  contentVector: number[];  // 2048-dim embedding
  metadata: {
    patterns: string[];     // Detected patterns
    dependencies: string[]; // What it imports
    exports: string[];      // What it exports
  };
}
```

## ⚡ Quick Start

### Installation
```bash
npm install -g memory-engineering-mcp
```

### Configure Cursor/.cursor/mcp.json
```json
{
  "mcpServers": {
    "memory-engineering-mcp": {
      "command": "npx",
      "args": ["memory-engineering-mcp"],
      "env": {
        "MONGODB_URI": "your-mongodb-atlas-uri",
        "VOYAGE_API_KEY": "your-voyage-api-key"
      }
    }
  }
}
```

### First Run
```bash
# Initialize (scans entire codebase, generates embeddings)
memory_engineering_init

# Now search your code semantically!
memory_engineering_search --query "authentication flow" --codeSearch "pattern"

# Update memories as you work
memory_engineering_memory --name activeContext --content "Fixed JWT expiry..."
```

## 🎯 Real Power Examples

### Finding Code You Forgot Exists
```bash
search --query "payment processing"
# Finds: processPayment(), handleStripeWebhook(), validateCard()
# Even if you never used the word "payment" in those functions!
```

### Understanding Patterns Across Codebase
```bash
search --query "error" --codeSearch "pattern"
# Returns ALL error handling patterns:
# - try/catch blocks
# - .catch() handlers  
# - error middleware
# - validation errors
```

### Tracking Decisions
```bash
search --query "why Redis"
# Finds the exact activeContext entry where you decided to use Redis
# "Chose Redis for session storage because: 1) Fast lookups 2) TTL support..."
```

## 📊 Performance Metrics

- **Code sync**: ~1000 files/minute with embeddings
- **Search latency**: <500ms for 100k chunks
- **Memory operations**: <100ms
- **Embedding dimensions**: 2048 (maximum accuracy)
- **Chunk sizes**: 30-300 lines (adaptive)
- **Pattern detection**: 20+ patterns recognized

## 🔧 Advanced Features

### Smart Pattern Aliasing
The system understands natural language variations:
- "auth" → searches: authentication, authorization, login, JWT, token
- "db" → searches: database, MongoDB, schema, model, collection
- "error handling" → searches: try-catch, exception, error-handler

### Incremental Sync
Only changed files are re-embedded:
```javascript
// Detects changes via:
- File modification time
- Content hash comparison  
- Git diff integration
- Automatic after 24h gap
```

### Context Preservation
Every code chunk maintains context:
```typescript
// Original file:
import { User } from './models';
import bcrypt from 'bcrypt';

class AuthService {
  async validateUser(email: string, password: string) {
    // ... implementation
  }
}

// Chunk includes:
- Imports (User, bcrypt)
- Class context (AuthService)
- Full method implementation
- Patterns detected: ["authentication", "async", "validation"]
```

## 🛠️ Tools Reference

| Tool | Purpose | Key Features |
|------|---------|--------------|
| `memory_engineering_init` | Initialize project | Scans code, creates memories, generates embeddings |
| `memory_engineering_memory` | Read/Update memories | Unified interface for all 7 memories |
| `memory_engineering_search` | Semantic search | Memory + code search with patterns |
| `memory_engineering_sync` | Sync code embeddings | Smart chunking, incremental updates |
| `memory_engineering_system` | Health & diagnostics | Status, environment, doctor mode |

## 🚀 Why This Works

1. **Complete Code Understanding**: Unlike other systems that break functions arbitrarily, we preserve semantic units
2. **Rich Embeddings**: Each chunk has context, patterns, and relationships
3. **Behavioral Prompting**: Dramatic prompts ensure AI assistants take memory seriously
4. **MongoDB Scale**: Handles millions of chunks with millisecond queries
5. **Voyage AI Quality**: State-of-the-art embeddings optimized for code

## 📄 License

MIT - See [LICENSE](LICENSE) file

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/memory-engineering-mcp)
- [GitHub Repository](https://github.com/romiluz13/memory-engineering-mcp)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Voyage AI](https://voyageai.com)

---

*Built with Model Context Protocol (MCP) by Anthropic*