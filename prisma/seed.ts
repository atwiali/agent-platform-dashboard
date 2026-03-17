import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const agents = [
  {
    slug: "cli-assistant",
    name: "Claude Assistant",
    description:
      "General-purpose coding assistant with file read/write capabilities. Great for generating code, explaining concepts, and working with files.",
    systemPrompt: `You are a helpful coding assistant with access to file tools. You can read and write files in a sandboxed workspace to help users with their tasks.

## Available Tools
- **read_file**: Read file contents from the workspace
- **write_file**: Create or overwrite files in the workspace

## Guidelines
- When asked to create code, write it to files using write_file
- When asked about existing files, read them first with read_file
- Explain what you're doing and why
- Write clean, well-documented code
- If you encounter errors from tools, explain them to the user and suggest alternatives`,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    tools: JSON.stringify([
      {
        name: "read_file",
        description: "Read the contents of a file at the specified path.",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to the file to read." },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write content to a file. Creates or overwrites.",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to the file to write." },
            content: { type: "string", description: "Content to write." },
          },
          required: ["path", "content"],
        },
      },
    ]),
    maxIterations: 25,
    isActive: true,
    useThinking: false,
    thinkingBudget: null,
  },
  {
    slug: "code-review",
    name: "Code Review Agent",
    description:
      "Autonomous GitHub PR reviewer. Analyzes diffs, inspects files, and posts structured review comments with findings categorized by severity.",
    systemPrompt: `You are a senior software engineer conducting a thorough code review of a GitHub pull request.

## Review Criteria
1. **Security vulnerabilities** — injection flaws, auth issues, secrets in code
2. **Bugs and correctness** — logic errors, null/undefined risks, race conditions
3. **Performance issues** — N+1 queries, unnecessary allocations, blocking calls
4. **Error handling** — uncaught exceptions, missing validation, silent failures
5. **Code quality** — readability, duplication, overly complex logic
6. **Best practices** — API design, architectural patterns, test coverage gaps

## Workflow
1. Call list_pr_files to understand the scope of changes
2. Call fetch_pr_diff to see the full diff
3. For complex files, call get_file_content to read full source
4. When review is complete, call post_review_comment with formatted markdown

Be constructive and specific. Suggest fixes, don't just point out problems.`,
    model: "claude-sonnet-4-20250514",
    maxTokens: 16000,
    tools: JSON.stringify([
      {
        name: "fetch_pr_diff",
        description: "Fetches the full unified diff of a pull request.",
        input_schema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" },
            pull_number: { type: "number", description: "PR number" },
          },
          required: ["owner", "repo", "pull_number"],
        },
      },
      {
        name: "get_file_content",
        description: "Retrieves full content of a file at a specific git ref.",
        input_schema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" },
            path: { type: "string", description: "File path" },
            ref: { type: "string", description: "Git ref" },
          },
          required: ["owner", "repo", "path", "ref"],
        },
      },
      {
        name: "list_pr_files",
        description: "Lists all files changed in a PR.",
        input_schema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" },
            pull_number: { type: "number", description: "PR number" },
          },
          required: ["owner", "repo", "pull_number"],
        },
      },
      {
        name: "post_review_comment",
        description: "Posts a review comment on the PR.",
        input_schema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" },
            pull_number: { type: "number", description: "PR number" },
            body: { type: "string", description: "Markdown review comment" },
          },
          required: ["owner", "repo", "pull_number", "body"],
        },
      },
    ]),
    maxIterations: 20,
    isActive: true,
    useThinking: true,
    thinkingBudget: 10000,
  },
  {
    slug: "rag-docs",
    name: "Documentation Agent",
    description:
      "RAG-powered documentation expert. Searches vector database for relevant docs, provides cited answers, and recalls past conversations.",
    systemPrompt: `You are a documentation expert agent. Your job is to answer questions about a project's documentation accurately, with citations.

## Rules
1. **Always search before answering.** Use search_docs to find relevant documentation chunks.
2. **Cite every claim.** Format: [Source: <file_path>, Section: <section_name>, Chunk: <chunk_index>]
3. **Use conversation memory.** Use recall_conversations for related past Q&A.
4. **Stay grounded.** If docs don't have enough info, say so. Don't fabricate.
5. **Be concise and structured.** Use headings, bullet points, and code blocks.`,
    model: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    tools: JSON.stringify([
      {
        name: "search_docs",
        description: "Search documentation vector database for relevant chunks.",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            top_k: { type: "number", description: "Results count (default: 5)" },
          },
          required: ["query"],
        },
      },
      {
        name: "recall_conversations",
        description: "Search past conversation history for relevant Q&A pairs.",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results (default: 5)" },
          },
          required: ["query"],
        },
      },
    ]),
    maxIterations: 20,
    isActive: true,
    useThinking: false,
    thinkingBudget: null,
  },
  {
    slug: "app-generator",
    name: "App Generator",
    description:
      "Full-stack application generator. Describe your app and this agent plans architecture and generates all code files.",
    systemPrompt: `You are an expert full-stack application generator. Build complete, working applications based on user descriptions.

## Process
1. **Understand**: Ask clarifying questions about requirements
2. **Plan**: Outline architecture, tech stack, and file structure
3. **Build**: Generate all files using write_file
4. **Review**: Read back key files to verify correctness

## Default Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API routes or Server Actions
- Database: Prisma + SQLite

## Guidelines
- Generate production-quality code with proper error handling
- Include TypeScript types for all data structures
- Create complete package.json with all dependencies
- Add proper .gitignore and configuration files
- Write clean, well-structured code following best practices`,
    model: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    tools: JSON.stringify([
      {
        name: "write_file",
        description: "Write a file to the generated app workspace.",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative file path" },
            content: { type: "string", description: "File content" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "read_file",
        description: "Read a file from the generated app workspace.",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative file path" },
          },
          required: ["path"],
        },
      },
      {
        name: "list_files",
        description: "List files in a directory of the workspace.",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory path (default: root)" },
          },
          required: [],
        },
      },
    ]),
    maxIterations: 50,
    isActive: true,
    useThinking: false,
    thinkingBudget: null,
  },
];

async function main() {
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        maxTokens: agent.maxTokens,
        tools: agent.tools,
        maxIterations: agent.maxIterations,
        isActive: agent.isActive,
        useThinking: agent.useThinking,
        thinkingBudget: agent.thinkingBudget,
      },
      create: agent,
    });
    console.log(`Seeded agent: ${agent.name}`);
  }
  console.log("\nAll agents seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
