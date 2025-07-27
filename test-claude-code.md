# Testing Memory Engineering MCP with Claude Code

## Setup

1. Install the package:
```bash
npm install -g memory-engineering-mcp@3.1.0
```

2. Add to Claude Code config (`~/.config/claude-code/claude_code_config.json`):
```json
{
  "mcpServers": {
    "memory-engineering": {
      "command": "npx",
      "args": ["memory-engineering-mcp"],
      "env": {
        "MONGODB_URI": "your-mongodb-uri",
        "VOYAGE_API_KEY": "your-voyage-api-key"
      }
    }
  }
}
```

## Expected Tool Names in Claude Code

Based on the v3.0.1 fix, tools should be accessible as:
- `memory_engineering_init` (not memory_engineering/init)
- `memory_engineering_start_session`
- `memory_engineering_read`
- `memory_engineering_update`
- `memory_engineering_search`
- `memory_engineering_sync`
- `memory_engineering_memory_bank_update`

## Testing Commands

```bash
# Initialize
memory_engineering_init

# Start session (MANDATORY)
memory_engineering_start_session

# Read a core memory
memory_engineering_read --fileName "activeContext"

# Update a memory
memory_engineering_update --fileName "activeContext" --content "Testing Claude Code integration"

# Search
memory_engineering_search --query "test"

# Sync embeddings
memory_engineering_sync
```

## Troubleshooting

If tools aren't recognized:
1. Check Claude Code logs
2. Verify MCP server is running
3. Ensure tool names use underscores, not slashes
4. Check that MongoDB and Voyage API keys are set

## Success Criteria

✅ All tools are recognized by Claude Code
✅ No "tool name validation error"
✅ Can perform full workflow from init to search