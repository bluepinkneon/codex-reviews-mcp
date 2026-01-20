#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "codex-reviews-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "review_code",
        description: "Submit code for Codex review",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The code to review",
            },
            language: {
              type: "string",
              description: "Programming language of the code",
            },
          },
          required: ["code"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "review_code") {
    const { code, language } = args as { code: string; language?: string };
    // TODO: Implement actual review logic
    return {
      content: [
        {
          type: "text",
          text: `Review submitted for ${language ?? "unknown"} code:\n${code.slice(0, 100)}...`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Codex Reviews MCP server running on stdio");
}

main().catch(console.error);
