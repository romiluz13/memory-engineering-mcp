# MCP Official Documentation Learnings

## What We Learned from Official MCP Sources

### 1. Tool Naming Conventions (from TypeScript SDK examples)
- Use lowercase with hyphens: `calculate-bmi`, `fetch-weather`, `list-files`
- Our pattern `memory_engineering/action` is also valid (namespace/action)
- Names should be descriptive and action-oriented

### 2. Tool Descriptions Best Practices
From the official examples:
```typescript
{
  title: "BMI Calculator",  // Short title
  description: "Calculate Body Mass Index", // Clear, one-line description
  inputSchema: { /* Zod schema */ }
}
```

**Key Insight**: Descriptions should be **simple and clear**, not technical!

### 3. MCP Architecture Flow
1. **Client Discovery**: AI connects and calls `ListToolsRequest`
2. **Tool Listing**: Server returns available tools with descriptions
3. **Tool Execution**: Client calls specific tool with parameters
4. **Response**: Server processes and returns results

### 4. What Makes Tools Discoverable
- Clear, concise descriptions
- Well-defined input schemas
- Predictable response formats
- Tools that "do one thing well"

### 5. MCP Design Philosophy
From the docs: "secure, standardized, **simple** way to give AI systems the context they need"

**Key word: SIMPLE!**

## What We're Doing Right ✅
1. Using proper MCP SDK request handlers
2. Implementing standard tool registration
3. Following schema validation with Zod
4. Supporting resources (memory://core, memory://search)
5. Proper error handling

## What We Need to Improve ❌
1. **Tool descriptions** are too technical
2. Missing **usage examples** in descriptions
3. No **workflow guidance** for AIs
4. No **contextual hints** in responses

## The Gap: Natural Language vs Technical Language

**Current Description:**
"Search memories using MongoDB $rankFusion or specific search types (vector, text, temporal)."

**What AI Needs:**
"Find how similar problems were solved. Use when starting features or hitting errors."

## MCP Doesn't Dictate Workflow!

Important realization: MCP is just the protocol. It doesn't tell AIs:
- WHEN to use tools
- WHICH tool to use for what task
- HOW tools connect in a workflow

**This is OUR responsibility in the tool descriptions!**

## Key Takeaway

MCP provides the plumbing. We need to provide the intelligence through:
1. Natural language descriptions
2. Usage triggers ("use when...")
3. Workflow examples
4. Contextual guidance

The protocol is simple. Our descriptions need to be simpler.