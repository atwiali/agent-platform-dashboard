import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ToolHandler } from "@/types/agent";

const SAFE_BASE_DIR = resolve(process.cwd(), "tmp/agent-workspace");

function resolveSafe(filePath: string): string {
  const resolved = resolve(SAFE_BASE_DIR, filePath);
  if (!resolved.startsWith(SAFE_BASE_DIR)) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}

export const cliAssistantTools: Anthropic.Messages.Tool[] = [
  {
    name: "read_file",
    description:
      "Read the contents of a file at the specified path. Returns the full text of the file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read (relative to workspace).",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file at the specified path. Creates the file if it doesn't exist, or overwrites it.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Path to the file to write (relative to workspace).",
        },
        content: {
          type: "string",
          description: "The text content to write into the file.",
        },
      },
      required: ["path", "content"],
    },
  },
];

export const cliAssistantHandlers: ToolHandler[] = [
  {
    name: "read_file",
    execute: async (input) => {
      const safePath = resolveSafe(input.path as string);
      const content = await readFile(safePath, "utf-8");
      return content;
    },
  },
  {
    name: "write_file",
    execute: async (input) => {
      const safePath = resolveSafe(input.path as string);
      await mkdir(dirname(safePath), { recursive: true });
      await writeFile(safePath, input.content as string, "utf-8");
      return `File written successfully to ${input.path}`;
    },
  },
];

export const cliAssistantSystemPrompt = `You are a helpful coding assistant with access to file tools. You can read and write files in a sandboxed workspace to help users with their tasks.

## Available Tools
- **read_file**: Read file contents from the workspace
- **write_file**: Create or overwrite files in the workspace

## Guidelines
- When asked to create code, write it to files using write_file
- When asked about existing files, read them first with read_file
- Explain what you're doing and why
- Write clean, well-documented code
- If you encounter errors from tools, explain them to the user and suggest alternatives`;

export const cliAssistantSeed = {
  slug: "cli-assistant",
  name: "Claude Assistant",
  description:
    "General-purpose coding assistant with file read/write capabilities. Great for generating code, explaining concepts, and working with files.",
  systemPrompt: cliAssistantSystemPrompt,
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  tools: JSON.stringify(cliAssistantTools),
  maxIterations: 25,
  isActive: true,
  useThinking: false,
};
