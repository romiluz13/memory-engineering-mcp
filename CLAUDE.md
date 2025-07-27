# Memory Engineering MCP - AI Assistant Instructions

## Required Session Start
```
memory_engineering_start_session
```
This command MUST be run at the start of every session to load all core memories.

## Memory System Architecture

### Core Memories (7 documents)
1. **projectbrief** - Project goals, scope, and requirements
2. **productContext** - Product rationale and user needs  
3. **activeContext** - Current work items and focus
4. **systemPatterns** - Architecture patterns and conventions
5. **techContext** - Technology stack and dependencies
6. **progress** - Completed work and learnings
7. **codebaseMap** - File structure and module organization

### Working Memories
- Event-based debug sessions and solutions
- 30-day TTL (Time To Live)
- JSON format for structured data

## Tool Reference

### 1. `memory_engineering_init`
Initialize project memory system. Creates core memories and MongoDB indexes.
```bash
memory_engineering_init --projectName "myproject"
```

### 2. `memory_engineering_start_session` 
Load all core memories. Required at session start.
```bash
memory_engineering_start_session
```

### 3. `memory_engineering_read`
Read specific memory document. No .md extension needed.
```bash
memory_engineering_read --fileName "systemPatterns"
```

### 4. `memory_engineering_update`
Update memory content. Use fileName for core, memoryClass for working.
```bash
# Core memory update
memory_engineering_update --fileName "activeContext" --content "Working on: authentication"

# Working memory creation
memory_engineering_update --memoryClass "working" --content '{"action": "debugged login", "solution": "..."}'
```

### 5. `memory_engineering_memory_bank_update`
Update multiple core memories simultaneously.
```bash
memory_engineering_memory_bank_update --updates '{
  "activeContext": "Completed: basic auth",
  "progress": "Authentication module working"
}'
```

### 6. `memory_engineering_search`
Search memories using MongoDB $rankFusion (hybrid search).
```bash
memory_engineering_search --query "authentication patterns"
```

## Workflows

### Starting New Feature
1. `memory_engineering_start_session` - Load context
2. `memory_engineering_search --query "similar feature"` - Find patterns
3. Implement based on existing patterns
4. `memory_engineering_update --fileName "progress"` - Document completion

### Debugging Issue
1. `memory_engineering_start_session` - Load context
2. `memory_engineering_search --query "error type"` - Find similar issues
3. Fix the bug
4. `memory_engineering_update --memoryClass "working"` - Save solution

### End of Session
1. `memory_engineering_update --fileName "activeContext"` - Update current state
2. `memory_engineering_update --fileName "progress"` - Document completed work
3. `memory_engineering_sync` - Generate embeddings for search

## Technical Details

### MongoDB Configuration
- Database: `memory_engineering`
- Collection: `memory_engineering_documents`
- Indexes: compound, vector (1024d), text, TTL

### Search Types
- **rankfusion** (default): Combines vector, text, temporal, and importance
- **vector**: Semantic similarity using Voyage AI embeddings
- **text**: Keyword matching with fuzzy search
- **temporal**: Time-weighted relevance

### Error Handling
- If search fails: "Path projectId needs to be indexed" → Run `npm run db:indexes`
- If sync fails: Check VOYAGE_API_KEY environment variable
- If init fails: Verify MongoDB connection string

## Development Commands
```bash
npm run build          # TypeScript compilation
npm run test           # Test suite
npm run typecheck      # Type checking
npm run lint           # ESLint
npm run db:indexes     # Create MongoDB search indexes manually
```

## Key Principles

1. **Mandatory Reading** - Always start with `memory_engineering_start_session`
2. **Deliberate Updates** - Manual documentation of progress and patterns  
3. **Hybrid Search** - Combines vector embeddings with text search
4. **Working Memory** - Temporary storage for debug solutions
5. **Atomic Operations** - Updates either succeed completely or fail with clear errors

## Implementation Notes

- Memory names do NOT require .md extension
- All operations use projectId for isolation
- Vector embeddings use voyage-3-large (1024 dimensions)
- Search indexes must be created in MongoDB Atlas
- Working memories expire automatically after 30 days