# AI Agent Workflow Guide for Memory Engineering MCP

## Overview
Memory Engineering MCP is designed to work seamlessly with AI coding assistants like Cursor, Windsurf, and Claude Code through the Model Context Protocol (MCP).

## Natural AI Agent Workflow

### 1. Project Initialization
When an AI agent starts working on a project:
```
memory_engineering/init
```
- Automatically creates 6 core memory files
- Sets up MongoDB collection and indexes
- No manual configuration needed

### 2. Understanding the Project
AI agents naturally query project context:
```
memory_engineering/read --fileName "projectbrief.md"
memory_engineering/read --fileName "systemPatterns.md"
```

### 3. Searching for Patterns
When AI needs to find similar implementations:
```
memory_engineering/search --query "authentication implementation"
memory_engineering/search --query "error handling patterns" --searchType "rankfusion"
```

### 4. Recording Work Progress
As AI agents complete tasks:
```
# Update current context
memory_engineering/update --fileName "activeContext.md" --content "..."

# Record new patterns discovered
memory_engineering/update --fileName "systemPatterns.md" --content "..."

# Track progress
memory_engineering/update --fileName "progress.md" --content "..."
```

### 5. Creating Working Memories
AI agents can track debugging sessions:
```
memory_engineering/update --memoryClass "working" --content '{
  "action": "debug authentication",
  "context": {"file": "auth.js", "error": "token expired"},
  "solution": "Added refresh token logic",
  "duration": 45
}'
```

### 6. Evolution Tracking
System automatically tracks search effectiveness:
- Every search creates an evolution memory
- Helps AI learn what queries work best
- Self-improving over time

## Tool Integration Patterns

### For Cursor
- Use @ references to memory files: `@projectbrief.md`
- Search memories before implementing features
- Update activeContext.md during development

### For Windsurf
- Leverages "10 steps ahead" thinking with memory search
- Auto-detects patterns from insight memories
- Updates working memories for debugging sessions

### For Claude Code
- Native MCP integration
- Autonomous memory updates during coding
- Pattern recognition from past implementations

## Workflow Best Practices

1. **Start Every Session**
   - Read activeContext.md to understand current state
   - Search for relevant patterns before coding

2. **During Development**
   - Create working memories for significant debug sessions
   - Update systemPatterns.md when discovering new patterns

3. **End of Session**
   - Update progress.md with completed work
   - Update activeContext.md for next session

## Memory Lifecycle

```
Init → Core Files → Search → Work → Update → Sync → Evolution
 ↑                                                           ↓
 └───────────────────────────────────────────────────────────┘
```

## Search Strategies

1. **Default (rankfusion)**: Best for general queries
2. **Vector**: For conceptual similarity
3. **Text**: For exact matches
4. **Temporal**: For recent work

## Automatic Features

- **TTL**: Working memories auto-expire after 30 days
- **Evolution**: Search effectiveness tracked automatically
- **Sync**: Run periodically to update embeddings
- **Insights**: Patterns discovered through aggregation

## Zero Configuration Required
AI agents can start using memories immediately after init. No manual setup needed beyond MongoDB connection.