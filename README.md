# Memory Engineering MCP Server v2.0

[![npm version](https://badge.fury.io/js/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🧠 **Give your AI coding assistant a photographic memory** - MongoDB-powered persistent memory system using revolutionary $rankFusion hybrid search

## 🎯 Mission

Every AI coding assistant (Cursor, Windsurf, Claude Code) suffers from memory loss between sessions. Memory Engineering MCP solves this with a MongoDB-powered brain that remembers everything, finds patterns, and gets smarter over time.

## 🚀 Why Memory Engineering 2.0?

- **Zero Context Loss**: Your AI assistant remembers every debug session, every pattern, every lesson learned
- **Pattern Recognition**: Automatically discovers and learns from recurring patterns in your codebase
- **Self-Improving**: Gets smarter with every interaction through evolution memory
- **MongoDB $rankFusion**: The ONLY database that can combine vector + text + temporal search in one query

## 🧠 The 4-Class Memory System

### 1. **Core Memories** (The Foundation)
The 6 essential files that define your project:
- `projectbrief.md` - Overall project vision and goals
- `systemPatterns.md` - Architecture patterns and code conventions
- `activeContext.md` - Current sprint/task focus
- `techContext.md` - Technology stack and dependencies
- `progress.md` - Completed work and lessons learned
- `codebaseMap.md` - File structure and key modules

### 2. **Working Memories** (Daily Events)
Automatically captured coding events with 30-day TTL:
- Debug sessions with solutions
- Implementation approaches
- Code review insights
- Performance optimizations

### 3. **Insight Memories** (Auto-Generated Patterns)
AI-discovered patterns from your development:
- Recurring error solutions
- Successful implementation patterns
- Performance bottlenecks
- Team coding habits

### 4. **Evolution Memories** (Self-Improvement)
Tracks how the system gets smarter:
- Query effectiveness
- Memory usage patterns
- Improvement suggestions
- Learning from feedback

## 💎 MongoDB's Secret Weapon: $rankFusion

Only MongoDB 8.1+ can do this:

```javascript
{
  $rankFusion: {
    input: {
      pipelines: {
        semantic: [/* vector search */],
        recent: [/* temporal relevance */],  
        patterns: [/* proven solutions */],
        evolution: [/* frequently helpful */]
      }
    },
    combination: {
      weights: { 
        semantic: 0.4,
        recent: 0.2,
        patterns: 0.3,
        evolution: 0.1
      }
    }
  }
}
```

One query that intelligently combines ALL search dimensions!

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas 8.1+ (for $rankFusion)
- Voyage AI API key

### Quick Start

1. **Install globally**:
```bash
npm install -g memory-engineering-mcp
```

2. **Set environment variables**:
```bash
export MONGODB_URI="your-mongodb-atlas-uri"
export VOYAGE_API_KEY="your-voyage-api-key"
```

3. **Configure your AI assistant** (Claude Code example):
```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "memory-engineering-mcp",
      "env": {
        "MONGODB_URI": "{{from-env}}",
        "VOYAGE_API_KEY": "{{from-env}}"
      }
    }
  }
}
```

## 🎮 Usage

### Initialize Memory System
```bash
# Your AI assistant will automatically run:
memory_engineering/init
```

### Search Across All Memories
```bash
# Find patterns and solutions
memory_engineering/search --query "authentication error handling"
```

### Core Memory Management
```bash
# Read a memory file
memory_engineering/read --fileName "systemPatterns.md"

# Update with new patterns
memory_engineering/update --fileName "progress.md" --content "..."
```

### Sync Embeddings
```bash
# After updates, sync for search
memory_engineering/sync
```

## 🔧 Development

```bash
# Clone and setup
git clone https://github.com/romiluz13/memory-engineering-mcp.git
cd memory-engineering-mcp
pnpm install

# Configure
cp .env.example .env.local
# Edit .env.local

# Build and test
pnpm build
pnpm test
pnpm typecheck

# Create MongoDB indexes
pnpm db:indexes
```

## 📊 How It Works

1. **Memory Creation**: As you code, memories are automatically created
2. **Vector Embeddings**: Voyage AI generates semantic embeddings
3. **$rankFusion Search**: Combines multiple search strategies
4. **Pattern Discovery**: Aggregation pipelines find insights
5. **Evolution**: System learns from usage patterns

## 🎯 Perfect For

- **Large Codebases**: Never lose context in complex projects
- **Team Development**: Share discovered patterns
- **Long Projects**: Maintain context over months
- **AI Pair Programming**: Make your AI assistant truly intelligent

## 🏗️ Architecture

- **Single MongoDB Collection**: Unified, flexible schema
- **4 Memory Classes**: Core, Working, Insight, Evolution
- **TTL Indexes**: Automatic memory lifecycle
- **Vector + Text Search**: Best of both worlds
- **MCP Protocol**: Standard AI assistant integration

## 🤝 Contributing

We're building the future of AI-assisted development! Contributions welcome:

1. Fork the repository
2. Create your feature branch
3. Follow the 4-class memory architecture
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT - Make AI assistants smarter everywhere!

## 🙏 Acknowledgments

- MongoDB for the revolutionary $rankFusion operator
- Voyage AI for excellent embeddings
- The MCP protocol team
- All developers tired of context-less AI assistants

---

*"We're not just storing memories. We're building the cognitive infrastructure that makes every AI coding assistant feel like it has a PhD in your codebase."*