# Codex Reviews MCP

MCP server for Codex code reviews.

## Setup

```bash
bun install
bun run build
```

## Usage

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "codex-reviews": {
      "command": "node",
      "args": ["/path/to/codex-reviews-mcp/dist/index.js"]
    }
  }
}
```

## Tools

- `review_code` - Submit code for Codex review
