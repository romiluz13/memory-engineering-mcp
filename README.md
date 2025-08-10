# 🧠 Memory Engineering MCP

[![npm version](https://img.shields.io/npm/v/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The first AI assistant memory system that actually works.** Give your AI persistent memory across sessions using MongoDB Atlas and Voyage AI.

## 🚀 Why This Exists

AI assistants like Claude, ChatGPT, and Copilot forget everything between sessions. Every conversation starts from scratch. This costs developers hours of repeated explanations.

**Memory Engineering MCP solves this permanently.**

## ✨ Key Features

- **🧠 Persistent Memory**: 7 core memories that never forget
- **🔍 Semantic Code Search**: Understands your code deeply with Voyage AI embeddings
- **⚡ Smart Chunking**: Captures complete functions, not fragments
- **🎯 Pattern Recognition**: Detects 20+ code patterns automatically
- **🔄 Incremental Sync**: Only processes changed files
- **📊 MongoDB Atlas**: Scales infinitely with your project

## 🎬 Quick Start

### Prerequisites

- Node.js 20+ 
- MongoDB Atlas account (free tier works)
- Voyage AI API key (free tier available)

### Installation

```bash
# Install globally
npm install -g memory-engineering-mcp

# Or use directly with npx
npx memory-engineering-mcp
```

### Configure in Cursor

Add to your `.cursor/mcp.json`:

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

## 🛠️ MCP Tools

The system provides 5 consolidated tools:

### 1. `memory_engineering_init`
Initialize a new project with persistent memory.

### 2. `memory_engineering_memory`
Read or update any of the 7 core memories:
- `projectbrief` - What you're building
- `productContext` - Why it exists
- `activeContext` - Current work (update every 3-5 min!)
- `systemPatterns` - Architecture decisions
- `techContext` - Technology stack
- `progress` - What's done and what's next
- `codebaseMap` - File structure

### 3. `memory_engineering_search`
Search memories and code semantically:
- `similar` - Find related code
- `pattern` - Find architectural patterns
- `implements` - Find implementations
- `uses` - Find usage examples

### 4. `memory_engineering_sync`
Generate embeddings for semantic code search. Automatically detects patterns and captures complete functions.

### 5. `memory_engineering_system`
Check system status, environment, and diagnostics.

## 🏗️ Architecture

```
Your AI Assistant (Cursor/Cline/etc)
        ↓
    MCP Protocol
        ↓
Memory Engineering MCP
        ↓
   MongoDB Atlas  +  Voyage AI
    (Persistence)   (Embeddings)
```

## 🔥 What Makes This Revolutionary

### Smart Semantic Boundaries
Unlike other systems that cut functions arbitrarily, we track braces, indentation, and parentheses to capture COMPLETE semantic units - up to 200 lines for functions, 300 for classes.

### Behavioral Design
The dramatic prompts ("UPDATE EVERY 3-5 MINUTES OR DIE!") aren't bugs - they're behavioral psychology that ensures AI assistants take memory seriously.

### Pattern Intelligence
Automatically detects and indexes 20+ code patterns (error-handling, async, authentication, etc.) making search incredibly accurate.

## 📊 Performance

- Memory operations: <100ms
- Code sync: ~1 file/second
- Search: <500ms with reranking
- Embedding dimensions: 2048 (Voyage AI)
- Chunk size: 30-200 lines (adaptive)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Built on the Model Context Protocol (MCP) by Anthropic
- Inspired by Cline's 7-memory structure
- Powered by MongoDB Atlas and Voyage AI

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/memory-engineering-mcp)
- [Documentation](docs/TROUBLESHOOTING.md)
- [Changelog](CHANGELOG.md)

---

*"The difference between an AI that forgets and one that remembers is the difference between a tool and a partner."*