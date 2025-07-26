# Memory Engineering - Initial Setup Template

Welcome to Memory Engineering MCP! This guide helps you initialize your memory system for your project.

## Quick Start

To initialize Memory Engineering for your project:

```
memory_engineering/init
```

This creates:
- 6 core memory files in your project directory
- MongoDB collection with proper indexes
- Vector search configuration
- TTL settings for working memories

## Core Memory Files

After initialization, you'll have these 6 foundational files:

1. **projectbrief.md** - Define your project's vision, goals, and success criteria
2. **systemPatterns.md** - Document architecture patterns and code conventions  
3. **activeContext.md** - Track current sprint focus and active tasks
4. **techContext.md** - List technology stack, dependencies, and constraints
5. **progress.md** - Record completed work and lessons learned
6. **codebaseMap.md** - Map file structure and key modules

## First Steps

1. **Define Your Project**
   ```
   memory_engineering/update --fileName "projectbrief.md" --content "# Project Name..."
   ```

2. **Document Tech Stack**
   ```
   memory_engineering/update --fileName "techContext.md" --content "# Technology Stack..."
   ```

3. **Map Your Codebase**
   ```
   memory_engineering/update --fileName "codebaseMap.md" --content "# Codebase Structure..."
   ```

## How Memory Engineering Works

The system uses MongoDB's $rankFusion to combine:
- **Semantic search** (40%) - Finds conceptually similar memories
- **Temporal relevance** (20%) - Prioritizes recent work
- **Pattern matching** (30%) - Discovers proven solutions
- **Evolution tracking** (10%) - Learns from usage patterns

## Example Workflow

```bash
# Search for authentication patterns
memory_engineering/search --query "authentication implementation"

# Record a debugging session
memory_engineering/update --memoryClass "working" --content '{
  "action": "debug authentication",
  "context": {"file": "auth.js", "error": "token expired"},
  "solution": "Added refresh token logic",
  "duration": 45
}'

# Sync embeddings for better search
memory_engineering/sync
```

## Memory Classes

- **Core**: Your 6 foundational files (never expire)
- **Working**: Event-based memories (30-day TTL)
- **Insight**: Auto-discovered patterns
- **Evolution**: System self-improvement tracking

Start by populating your core memory files - they form the foundation that makes every AI coding session more effective!