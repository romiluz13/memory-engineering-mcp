# Memory Engineering MCP - AI Brain for Coding Assistants

## 🚀 Project Status: v2.0 Architecture Redesign
Building the PERFECT memory system for AI coding assistants using MongoDB's revolutionary $rankFusion operator (MongoDB 8.1+) and Voyage AI embeddings.

## 🎯 Mission: Give AI Coding Assistants a Photographic Memory
Every AI coding assistant (Cursor, Windsurf, Claude Code) suffers from memory loss between sessions. We solve this with a MongoDB-powered brain that remembers everything, finds patterns, and gets smarter over time.

## 🧠 Architecture: 4 Memory Classes (One Collection)

### The Perfect Memory System
```javascript
// Collection: memories (unified, flexible)
{
  memoryClass: "core" | "working" | "insight" | "priority",
  memoryType: "pattern" | "context" | "event" | "learning" | "urgency",
  content: { /* flexible based on memory class */ },
  contentVector: Array, // voyage-3-large embeddings (1024 dims)
  metadata: { importance, freshness, tags, autoExpire }
}
```

### 1. **Core Memories** (The 6 Foundational Files)
- `projectbrief.md` - Overall project vision and goals
- `systemPatterns.md` - Architecture patterns and code conventions
- `activeContext.md` - Current sprint/task focus
- `techContext.md` - Technology stack and dependencies
- `progress.md` - Completed work and lessons learned
- `codebaseMap.md` - File structure and key modules

### 2. **Working Memories** (Daily Coding Events)
- Debug sessions with solutions
- Implementation approaches
- Code reviews and refactoring
- Auto-expires after 30 days (TTL)

### 3. **Insight Memories** (Auto-Generated Patterns)
- Discovered from repeated patterns
- Confidence-scored learnings
- Cross-referenced evidence
- Makes AI smarter over time

### 4. **Evolution Memories** (Self-Improvement)
- Query effectiveness tracking
- Memory usage patterns
- System learning from feedback
- Automatic optimization over time

## 💎 MongoDB $rankFusion: Our Secret Weapon

```javascript
// One query that combines EVERYTHING
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
      weights: { semantic: 0.4, recent: 0.2, patterns: 0.3, evolution: 0.1 }
    }
  }
}
```

**Only MongoDB 8.1+ can do this!** Combines vector search + text search + temporal queries + priority filtering in ONE operation.

## 🔧 Implementation Status

### ✅ Completed
- Core architecture design
- Memory lifecycle algorithms
- Aggregation pipeline patterns
- UX/DX design principles

### 🚧 In Progress
- Context engineering deprecation
- Migration to 4-class system
- $rankFusion implementation

### 📋 Planning Files
- `MEMORY_ENGINEERING_2.0_PLAN.md` - Complete architectural vision
- `DEPRECATION_PLAN.md` - Removing context engineering complexity
- `MONGODB_SHOWCASE_FEATURES.md` - Why only MongoDB can do this
- `MEMORY_LIFECYCLE_ALGORITHMS.md` - Intelligence and decay algorithms
- `AGGREGATION_PIPELINES_INSIGHTS.md` - Pattern discovery pipelines
- `UX_DX_DESIGN.md` - Developer experience design
- `MEMORY_2.0_SUMMARY.md` - Executive summary

## 🛠️ Key Technologies

### MongoDB Atlas (8.1+ Required)
- **$rankFusion**: Reciprocal Rank Fusion for hybrid search
- **Vector Search**: Native vector similarity search
- **Atlas Search**: Full-text search with fuzzy matching
- **TTL Indexes**: Automatic memory cleanup
- **Aggregation Pipelines**: Complex pattern analysis

### Voyage AI (voyage-3-large)
- Chosen model: `voyage-3-large` for best overall performance
- 1024 dimensions (perfect for MongoDB)
- Optimized for English descriptions about code
- 32K token context window

## 📚 Required Documentation

**Need from MongoDB (Rom to provide):**
- Latest $rankFusion performance benchmarks
- Vector search optimization tips
- Index strategy best practices

**Web Search for Latest:**
- MCP protocol updates (modelcontextprotocol.io)
- Voyage AI model comparisons
- AI coding assistant behaviors

## 🎯 Development Commands
```bash
# Core commands
npm run dev          # Start MCP server
npm run build        # TypeScript compilation
npm run test         # Test suite
npm run typecheck    # Type checking
npm run lint         # ESLint

# MongoDB
npm run db:indexes   # Create all indexes
npm run db:seed      # Initial memory setup
```

## 🚀 Next Steps

1. **Week 1**: Deprecate context engineering (40% code reduction)
2. **Week 2**: Implement 4-class memory system
3. **Week 3**: $rankFusion search implementation
4. **Week 4**: Polish and performance optimization

## 🎨 Core Principles

1. **Zero Risk**: Easy to develop, no breaking changes
2. **Minimal Complexity**: Each feature must stay simple
3. **Maximum AI Efficiency**: Best possible brain for AI coding assistants

## 🤝 Contributing

This is an open-source project helping the AI development community. We focus on:
- Making AI coding assistants smarter
- Showcasing MongoDB's unique capabilities
- Keeping complexity minimal
- Maximizing developer happiness

## 📖 The Beautiful Irony

We're using manual planning files to build the system that makes manual planning files obsolete. Soon, all this planning will live in our MongoDB-powered memory system - searchable, evolving, and intelligent.

---

*"We're not just storing memories. We're building the cognitive infrastructure that makes every AI coding assistant feel like it has a PhD in your codebase."*