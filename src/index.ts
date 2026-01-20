#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "node:child_process";

function getGitDiff(cwd: string, base: string): string {
  try {
    return execSync(`git diff ${base}...HEAD`, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`Failed to get git diff: ${error}`);
  }
}

function getMainBranch(cwd: string): string {
  try {
    const result = execSync(
      "git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo refs/remotes/origin/main",
      { cwd, encoding: "utf-8" }
    ).trim();
    return result.replace("refs/remotes/origin/", "");
  } catch {
    return "main";
  }
}

function getCurrentBranch(cwd: string): string {
  return execSync("git branch --show-current", {
    cwd,
    encoding: "utf-8",
  }).trim();
}

function getCommitMessages(cwd: string, base: string): string {
  try {
    return execSync(`git log ${base}...HEAD --oneline`, {
      cwd,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

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
        name: "review_diff",
        description:
          "Review git diff from main branch in the current working directory",
        inputSchema: {
          type: "object",
          properties: {
            cwd: {
              type: "string",
              description: "Working directory path (defaults to process.cwd())",
            },
            base: {
              type: "string",
              description: "Base branch to diff against (defaults to main)",
            },
          },
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "review_diff") {
    const { cwd: inputCwd, base: inputBase } = (args ?? {}) as {
      cwd?: string;
      base?: string;
    };
    const cwd = inputCwd ?? process.cwd();
    const base = inputBase ?? getMainBranch(cwd);
    const currentBranch = getCurrentBranch(cwd);
    const diff = getGitDiff(cwd, base);
    const commits = getCommitMessages(cwd, base);

    if (!diff.trim()) {
      return {
        content: [
          {
            type: "text",
            text: `No changes found between ${base} and ${currentBranch}`,
          },
        ],
      };
    }

    const summary = [
      `## Code Review: ${currentBranch} vs ${base}`,
      "",
      "### Commits",
      commits || "(no commits)",
      "",
      "### Diff",
      "```diff",
      diff,
      "```",
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: summary,
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
