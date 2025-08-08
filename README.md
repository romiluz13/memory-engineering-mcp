# Memory Engineering MCP v11 - Persistent Memory for AI Assistants

[![npm version](https://badge.fury.io/js/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🧠 **AI Memory System powered by MongoDB Atlas & Voyage AI**  
> Simple, reliable persistent memory across coding sessions

**🎯 GOLDEN RULE: "I MUST read ALL memory bank files at the start of EVERY task"**

## 🎯 Problem

AI coding assistants (Cursor, Claude, ChatGPT) forget everything between sessions. You have to re-explain your project, patterns, and context every single time.

## ✨ Solution

Memory Engineering MCP implements Cline's proven 7-memory structure with:
- **Persistent storage** - MongoDB stores memories across sessions
- **Semantic code search** - Voyage AI embeddings for intelligent code retrieval
- **MCP protocol** - Works with any MCP-compatible AI assistant
- **Simple workflow** - Read all memories at start, update as you work

## 🚀 Quick Start

### 1. Install

```bash
npm install -g memory-engineering-mcp
```

### 2. Set Environment Variables

Create `.env.local` in your project:
```env
MONGODB_URI=mongodb+srv://...  # Your MongoDB connection string
VOYAGE_API_KEY=pa-...          # From voyageai.com
```

### 3. Configure Your AI Assistant

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "npx",
      "args": ["memory-engineering-mcp"]
    }
  }
}
```

### 4. Start Using - PERFECT WORKFLOW

In your AI assistant:
```bash
# 1. Initialize (ONCE per project only)
memory_engineering_init

# 2. ALWAYS start EVERY session with this (MANDATORY)
memory_engineering_read_all

# 3. Update memories as you learn (activeContext most common)
memory_engineering_update --memoryName "activeContext" --content "..."

# 4. Sync code after major changes (not every edit)
memory_engineering_sync_code --patterns "**/*.{ts,js,py}"

# 5. Search before implementing
memory_engineering_search --query "authentication logic" --codeSearch "similar"
```

**⚠️ CRITICAL**: Never skip `read_all` at session start - it loads your entire context!

## 📚 The 7 Core Memories

Following Cline's proven structure:

1. **projectbrief** - What you're building
2. **productContext** - Who needs this and why
3. **activeContext** - Current work and learnings
4. **systemPatterns** - Architecture and conventions
5. **techContext** - Technology stack and setup
6. **progress** - Completed features and lessons
7. **codebaseMap** - File structure + semantic code search

## 🛠️ MCP Tools - WHEN TO USE EACH

| Tool | When to Use | Frequency |
|------|------------|-----------|
| `memory_engineering_init` | First time setup | Once per project |
| `memory_engineering_read_all` | **START OF EVERY SESSION** | Always first command |
| `memory_engineering_update` | After learning something | Multiple times per session |
| `memory_engineering_search` | Before implementing | As needed |
| `memory_engineering_sync_code` | After code changes | Daily/Weekly |

## 🔍 Code Search Modes

- **similar** - Find semantically similar code
- **implements** - Find implementations of concepts
- **uses** - Find code using specific functions
- **pattern** - Find architectural patterns

## 🎯 PERFECT USAGE PATTERNS

### The Golden Workflow
1. **Session Start**: `memory_engineering_read_all` (MANDATORY)
2. **During Work**: Update `activeContext` with learnings
3. **Code Changes**: Batch changes, then `sync_code`
4. **Before Search**: Run `sync_code` if searching code
5. **Session End**: Final `activeContext` update

### Common Mistakes to Avoid
- ❌ Skipping `read_all` at start (loses all context)
- ❌ Over-syncing code (batch changes instead)
- ❌ Creating duplicate memories (update existing)
- ❌ Manual codebaseMap updates (let sync handle it)

### Which Memory to Update?
- **activeContext**: Current learnings and decisions (MOST COMMON)
- **systemPatterns**: Architecture decisions
- **progress**: Completed features
- **techContext**: Stack changes
- **projectbrief**: Scope changes
- **productContext**: Requirement changes
- **codebaseMap**: AUTO-UPDATED by sync_code

📖 **See [PERFECT_MCP_USAGE.md](PERFECT_MCP_USAGE.md) for complete guide**

## 📋 Requirements

- Node.js 18+
- MongoDB (Atlas free tier works)
- Voyage AI API key (free tier available)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT - See [LICENSE](LICENSE) for details.

---

Built with the philosophy: *"Read ALL memories at the start of EVERY session"*