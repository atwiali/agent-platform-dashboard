import Anthropic from "@anthropic-ai/sdk";
import { ToolHandler } from "@/types/agent";

export const ragDocsTools: Anthropic.Messages.Tool[] = [
  {
    name: "search_docs",
    description:
      "Search the documentation vector database for chunks relevant to a query. Returns the most similar document chunks with metadata. Always use this before answering questions.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant documentation",
        },
        top_k: {
          type: "number",
          description: "Number of results to return (default: 5, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "recall_conversations",
    description:
      "Search past conversation history for relevant Q&A pairs. Use when the question might relate to something discussed previously.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query for past conversations",
        },
        limit: {
          type: "number",
          description: "Max past conversations to return (default: 5)",
        },
      },
      required: ["query"],
    },
  },
];

// Placeholder handlers — in production these connect to Pinecone + SQLite
export const ragDocsHandlers: ToolHandler[] = [
  {
    name: "search_docs",
    execute: async (input) => {
      // In production, this calls the Pinecone vector DB
      // For now, return a placeholder indicating setup is needed
      const query = input.query as string;
      return `[RAG search for "${query}"] This agent requires a Pinecone vector database to be configured. Please set PINECONE_API_KEY and ingest documents first.`;
    },
  },
  {
    name: "recall_conversations",
    execute: async (input) => {
      const query = input.query as string;
      return `[Conversation recall for "${query}"] No past conversations found. This feature requires the memory database to be initialized.`;
    },
  },
];

export const ragDocsSystemPrompt = `You are a documentation expert agent. Your job is to answer questions about a project's documentation accurately, with citations.

## Rules

1. **Always search before answering.** Use the search_docs tool to find relevant documentation chunks before responding. Never answer from memory alone.

2. **Cite every claim.** Every factual statement must include a citation:
   [Source: <file_path>, Section: <section_name>, Chunk: <chunk_index>]

3. **Use conversation memory.** When a question relates to a previous conversation, use recall_conversations to retrieve relevant past Q&A pairs.

4. **Stay grounded.** If retrieved documents don't contain enough information, say so explicitly. Do not fabricate information.

5. **Be concise and structured.** Use headings, bullet points, and code blocks to organize answers.`;

export const ragDocsSeed = {
  slug: "rag-docs",
  name: "Documentation Agent",
  description:
    "RAG-powered documentation expert. Searches vector database for relevant docs, provides cited answers, and recalls past conversations for context.",
  systemPrompt: ragDocsSystemPrompt,
  model: "claude-sonnet-4-20250514",
  maxTokens: 8192,
  tools: JSON.stringify(ragDocsTools),
  maxIterations: 20,
  isActive: true,
  useThinking: false,
};
