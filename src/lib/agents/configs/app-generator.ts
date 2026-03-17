import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ToolHandler } from "@/types/agent";

const WORKSPACE_DIR = resolve(process.cwd(), "tmp/generated-apps");

function resolveSafe(filePath: string): string {
  const resolved = resolve(WORKSPACE_DIR, filePath);
  if (!resolved.startsWith(WORKSPACE_DIR)) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}

export const appGeneratorTools: Anthropic.Messages.Tool[] = [
  {
    name: "write_file",
    description:
      "Write a file to the generated app workspace. Creates directories as needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path within the generated app (e.g., 'src/app/page.tsx')",
        },
        content: {
          type: "string",
          description: "The file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Read a file from the generated app workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path within the generated app",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files in a directory of the generated app workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative directory path (default: root)",
        },
      },
      required: [],
    },
  },
];

export const appGeneratorHandlers: ToolHandler[] = [
  {
    name: "write_file",
    execute: async (input) => {
      const safePath = resolveSafe(input.path as string);
      await mkdir(dirname(safePath), { recursive: true });
      await writeFile(safePath, input.content as string, "utf-8");
      return `File written: ${input.path}`;
    },
  },
  {
    name: "read_file",
    execute: async (input) => {
      const safePath = resolveSafe(input.path as string);
      return await readFile(safePath, "utf-8");
    },
  },
  {
    name: "list_files",
    execute: async (input) => {
      const { readdir } = await import("node:fs/promises");
      const dirPath = resolveSafe((input.path as string) || ".");
      const entries = await readdir(dirPath, {
        withFileTypes: true,
        recursive: true,
      });
      return entries
        .map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`)
        .join("\n");
    },
  },
];

export const appGeneratorSystemPrompt = `You are an expert full-stack application generator. Your job is to build complete, working applications based on user descriptions.

## Process
1. **Understand**: Ask clarifying questions about the app requirements if needed
2. **Plan**: Outline the architecture, tech stack, and file structure
3. **Build**: Generate all necessary files using the write_file tool
4. **Review**: Read back key files to verify correctness

## Tech Stack (default)
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes or Server Actions
- **Database**: Prisma + SQLite (easily swappable)

## Guidelines
- Generate production-quality code with proper error handling
- Include TypeScript types for all data structures
- Create a complete package.json with all required dependencies
- Add proper .gitignore and configuration files
- Include basic README with setup instructions
- Write clean, well-structured code following best practices
- Use semantic HTML and accessible UI patterns`;

export const appGeneratorSeed = {
  slug: "app-generator",
  name: "App Generator",
  description:
    "Full-stack application generator. Describe your app idea and this agent will plan the architecture and generate all the code files.",
  systemPrompt: appGeneratorSystemPrompt,
  model: "claude-sonnet-4-20250514",
  maxTokens: 8192,
  tools: JSON.stringify(appGeneratorTools),
  maxIterations: 50,
  isActive: true,
  useThinking: false,
};
