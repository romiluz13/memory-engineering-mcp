# Memory Engineering MCP - Persistent Memory for AI Coding Assistants

[![npm version](https://badge.fury.io/js/memory-engineering-mcp.svg)](https://www.npmjs.com/package/memory-engineering-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Persistent memory system for AI coding assistants using MongoDB storage and hybrid search

## Problem

Every AI coding assistant (Cursor, Windsurf, Claude Code) forgets everything between sessions. You have to re-explain your project, patterns, and context every single time.

## Solution

Memory Engineering MCP implements a memory system with:
- **Mandatory Context Reading** - AI MUST read all memories at session start
- **MongoDB Storage** - Reliable persistence, not just files
- **Smart Search** - Vector + text search with MongoDB's $rankFusion
- **Working Memory** - Remember debug solutions for 30 days
- **Simple & Clear** - Just 2 memory types, 6 tools, no complexity

## What's New in v3.1.0

Simplified architecture:
- **2 Memory Classes** (was 4) - Just Core + Working
- **Mandatory Discipline** - `memory_engineering_start_session` is required
- **Manual Updates** - Deliberate, explicit memory updates
- **Kept the Good** - $rankFusion, vector search, clean MongoDB storage
- **Dropped the Complex** - No insights, evolution, or meta-tracking

## Memory System

### 1. **Core Memories** (7 Essential Documents)
- `projectbrief` - What you're building
- `productContext` - Why it exists
- `activeContext` - Current work focus
- `systemPatterns` - How to build
- `techContext` - Technologies used
- `progress` - What's completed
- `codebaseMap` - Where things are

### 2. **Working Memories** (Debug Sessions)
- Bug fixes and solutions
- Auto-expire after 30 days
- Searchable by problem/solution

## Quick Start

### 1. Install
```bash
npm install -g memory-engineering-mcp
```

### 2. Configure MongoDB
Create a MongoDB Atlas cluster (free tier works!) and get your connection string.

### 3. Set Environment Variables
```bash
# .env.local
MONGODB_URI=mongodb+srv://...
VOYAGE_API_KEY=pa-...  # From voyageai.com
```

### 4. Configure Your AI Assistant

#### Cursor
Add to `.cursorrules`:
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

#### Claude Code
Add to claude_code_config.json:
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

## Usage

### Every Session MUST Start With:
```
memory_engineering_start_session
```
This reads ALL core memories - no exceptions!

### Core Workflow
```bash
# 1. Initialize project (once)
memory_engineering_init

# 2. Start session (EVERY TIME)
memory_engineering_start_session

# 3. Update current context
memory_engineering_update --fileName "activeContext" --content "Working on: authentication"

# 4. Search when needed
memory_engineering_search --query "error handling patterns"

# 5. Save debug solutions
memory_engineering_update --memoryClass "working" --content '{
  "action": "fixed auth bug",
  "context": {"error": "token expired"},
  "solution": "Added refresh token logic"
}'

# 6. Update multiple memories
memory_engineering_memory_bank_update --updates '{
  "progress": "✅ Auth system complete",
  "systemPatterns": "New pattern: JWT with refresh tokens"
}'
```

## 🔧 Tools Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `memory_engineering_init` | Create 7 core memories | Once per project |
| `memory_engineering_start_session` | Read ALL memories | Start of EVERY session |
| `memory_engineering_read` | Read specific memory | When you need details |
| `memory_engineering_update` | Update one memory | After completing work |
| `memory_engineering_memory_bank_update` | Update multiple | Major milestones |
| `memory_engineering_search` | Find relevant memories | When solving problems |

## 🎯 Key Principles

1. **Mandatory Discipline** - MUST read all memories at start
2. **Deliberate Updates** - Manual documentation, not automatic
3. **Simple Storage** - Just MongoDB documents, not complex systems
4. **Smart Search** - $rankFusion combines vector + text beautifully
5. **Focused Purpose** - Remember what matters, drop what doesn't

## 🚀 Why This Works

The original Cline Memory Bank succeeded through simplicity:
- 6 files you MUST read
- Manual updates when needed
- Clear, mandatory discipline

We kept that simplicity and added:
- MongoDB for reliable storage
- Vector search for finding patterns
- Working memory for debug sessions
- But NO unnecessary complexity

## 📊 Requirements

- Node.js 18+
- MongoDB Atlas 8.1+ (for $rankFusion)
- Voyage AI API key (free tier available)

## 🤝 Contributing

We're back to basics! When contributing:
- Keep it simple
- No automatic features
- Respect the mandatory discipline
- Test everything

## 📄 License

MIT - Because great memory should be free

---

*"We don't need to track insights about insights. We just need to remember what we're building."*

Built with ❤️ for developers tired of explaining their project every session.