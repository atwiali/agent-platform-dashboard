<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Anthropic-Claude-6B4FBB?style=for-the-badge" alt="Claude" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

# Agent Platform Dashboard

A unified production dashboard for managing AI agents powered by **Claude (Anthropic SDK)**. Wraps 4 specialized CLI-based AI agents into a single web platform with real-time streaming chat, usage analytics, evaluation suite, and multi-layered security.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Agents](#agents)
- [API Reference](#api-reference)
- [Security](#security)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

Agent Platform Dashboard is a Next.js 15 App Router application that provides a web interface to interact with, manage, monitor, and evaluate AI agents. Instead of running 4 separate CLI tools, everything is unified under one dashboard with a shared agentic loop, persistent conversations, usage tracking, and an evaluation suite.

### What Problem Does It Solve?

Managing multiple AI agents across different CLI tools is fragmented. You lose conversation history, can't track costs, have no way to evaluate quality, and there's no centralized security. This platform solves all of that in a single, modern web interface.

---

## Features

### 1. Real-Time Streaming Chat
- **Server-Sent Events (SSE)** streaming from server to client
- Character-by-character text rendering as Claude responds
- Collapsible **extended thinking** blocks showing Claude's reasoning process
- Live **tool call** visualization with input parameters, results, timing, and error states
- Multi-turn conversations with full context preservation
- Agent selector and new chat controls in the input area

### 2. Unified Agentic Loop
- **Single `runAgentStream()` function** replaces 4 separate while-loops
- Automatic tool execution cycle: Claude calls a tool, the server executes it, feeds the result back, and Claude continues
- Configurable `maxIterations` limit with graceful wrap-up
- Extended thinking support with configurable token budget
- Works identically for chat and evaluation runs

### 3. Multi-Agent Support
Four pre-configured agents, each with specialized tools:

| Agent | Tools | Description |
|-------|-------|-------------|
| **CLI Assistant** | `read_file`, `write_file` | General-purpose file system assistant with path traversal protection |
| **Code Review** | `fetch_pr_diff`, `get_file_content`, `list_pr_files`, `post_review_comment` | GitHub PR reviewer using Octokit with extended thinking |
| **RAG Docs** | `search_docs`, `recall_conversations` | Documentation agent (Pinecone integration placeholder) |
| **App Generator** | `write_file`, `read_file`, `list_files` | Multi-file application scaffolder |

### 4. Conversation Management
- **Persistent conversations** stored in SQLite via Prisma
- **Conversation sidebar** with search, date-grouped history (Today, Yesterday, This Week, Older)
- **URL-based routing** (`/chat?conversation=<id>`) for deep-linking and bookmarking
- Click to resume any previous conversation with full message + tool call history
- Delete conversations from the sidebar
- Auto-refresh sidebar when new conversations are created

### 5. Agent Configuration UI
- **Agent listing page** with color-coded cards showing model, tools, stats
- **Detail/edit page** per agent with:
  - Basic info (name, description, active toggle)
  - Model selector (Sonnet 4 / Opus 4 / Haiku 4)
  - Max tokens, max iterations, temperature slider
  - Extended thinking toggle + budget configuration
  - Read-only tool display (tools are defined in code)
  - Full system prompt editor
- Changes saved via REST API and take effect on next chat

### 6. Usage Analytics
- **Every API call is tracked**: tokens, cost, latency, tool count, success/failure
- **Cost calculator** with per-model pricing (Sonnet, Opus, Haiku input/output rates)
- **Interactive dashboard** with date range selector (7/14/30/90 days):
  - 4 stat cards: API Calls, Total Cost, Avg Latency, Success Rate
  - 3 token summary cards: Input, Output, Thinking
  - **Cost area chart** with gradient fill
  - **Token stacked bar chart** (input vs output per day)
  - **Latency trend** area chart
  - **Agent cost pie chart** with donut visualization
  - Full agent breakdown table

### 7. Evaluation Suite
- **Create test cases** with:
  - Agent selector
  - Input message (what to send to the agent)
  - Multiple pass criteria per test case
- **6 criteria types**:
  - `contains` — output must contain specific text
  - `not_contains` — output must not contain text
  - `regex` — output must match a regex pattern
  - `tool_called` — a specific tool must have been invoked
  - `no_tool_called` — a specific tool must not have been invoked
  - `json_schema` — output JSON must contain required keys
- **Batch eval runs**: click "Run All" to execute every test case for an agent
- **Same code path as real chat** — evals use `runAgentStream()` so results reflect actual behavior
- **Run detail page** with:
  - Summary cards (status, pass rate, cost, duration)
  - Per-test results with pass/fail indicator
  - Input, output preview, and per-criterion breakdown

### 8. Security Layers
All wired into the `/api/chat` endpoint:

| Layer | What It Does |
|-------|-------------|
| **Rate Limiter** | In-memory token bucket: 10 req/min, 50 req/hr per IP. Returns 429 with `Retry-After` header |
| **Input Sanitizer** | Strips HTML/script tags, removes hidden unicode characters, enforces 10K char limit |
| **Injection Detector** | Score-based detection (14 weighted patterns). Score > 0.7 = reject, 0.3-0.7 = warn + log, < 0.3 = allow |
| **Output Filter** | Regex scan for AWS keys, API keys (Anthropic/OpenAI/GitHub), emails, phone numbers, SSNs, credit cards, private keys, JWTs. Redacts with `[REDACTED]` |

Tool-level security:
- `read_file` / `write_file` tools use `resolveSafe()` to prevent path traversal attacks
- File operations are sandboxed to designated workspace directories

### 9. Dark Mode AI Theme
- **oklch color space** for perceptually uniform colors
- Deep space background with violet primary accent
- Glow effects on active elements and cards
- Custom thin scrollbars
- Gradient text utility
- Subtle noise texture for depth
- Inter (body) + JetBrains Mono (code) font pairing
- Backdrop blur on cards and overlays

### 10. Developer Experience
- **TypeScript strict mode** across the entire codebase
- **Prisma ORM** with typed queries and relations
- **shadcn/ui** component library (Accordion, Avatar, Badge, Button, Card, Input, ScrollArea, Select, Separator, Textarea, Tooltip)
- **Loading skeletons** on every route
- **Error boundary** with retry button
- **404 page** with gradient styling
- **Recharts** for all data visualizations
- **React Markdown** with GFM support for message rendering

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐ │
│  │ Dashboard │  │   Chat   │  │ Agents │  │Usage/Evals│ │
│  │  page.tsx │  │ page.tsx │  │page.tsx│  │  page.tsx  │ │
│  └──────────┘  └────┬─────┘  └────────┘  └───────────┘ │
│                      │                                    │
│              ┌───────▼────────┐                           │
│              │  useChatStream  │  ◄── SSE Client Hook     │
│              └───────┬────────┘                           │
│                      │ POST /api/chat                     │
├──────────────────────┼────────────────────────────────────┤
│  API Layer           │                                    │
│  ┌───────────────────▼──────────────────────────────┐    │
│  │              /api/chat (SSE)                       │    │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ │    │
│  │  │Rate    │ │Sanitizer │ │Inject  │ │Output   │ │    │
│  │  │Limiter │→│          │→│Detect  │→│Filter   │ │    │
│  │  └────────┘ └──────────┘ └────────┘ └─────────┘ │    │
│  └──────────────────┬───────────────────────────────┘    │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐    │
│  │           Agent Registry                          │    │
│  │  DB Config (system prompt, model, settings)       │    │
│  │  + Code Handlers (tool execute functions)         │    │
│  │  = Hydrated AgentConfig                           │    │
│  └──────────────────┬───────────────────────────────┘    │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐    │
│  │         runAgentStream() — Unified Loop            │    │
│  │  while (iterations < max) {                        │    │
│  │    stream = anthropic.messages.stream(...)          │    │
│  │    if stop_reason == "tool_use" → execute tools    │    │
│  │    if stop_reason == "end_turn" → break            │    │
│  │  }                                                 │    │
│  └──────────────────┬───────────────────────────────┘    │
│                      │                                    │
├──────────────────────┼────────────────────────────────────┤
│  Data Layer          │                                    │
│  ┌───────────────────▼──────────────────────────────┐    │
│  │              Prisma (SQLite / PostgreSQL)          │    │
│  │  Agent │ Conversation │ Message │ ToolCall         │    │
│  │  UsageLog │ EvalTestCase │ EvalRun │ EvalResult    │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **AI SDK** | Anthropic SDK (`@anthropic-ai/sdk`) |
| **Database** | Prisma 6 + SQLite (dev) / PostgreSQL (prod) |
| **Charts** | Recharts 3 |
| **Markdown** | react-markdown + remark-gfm |
| **GitHub API** | Octokit (`@octokit/rest`) |
| **Icons** | Lucide React |
| **Fonts** | Inter + JetBrains Mono |

---

## Project Structure

```
agent-platform-dashboard/
├── prisma/
│   ├── schema.prisma          # 8-model database schema
│   └── seed.ts                # Seeds 4 agents with configs
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard home (stats, quick start)
│   │   ├── layout.tsx         # Root layout (sidebar + main)
│   │   ├── loading.tsx        # Global loading skeleton
│   │   ├── error.tsx          # Global error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── chat/
│   │   │   └── page.tsx       # Chat interface with Suspense
│   │   ├── agents/
│   │   │   ├── page.tsx       # Agent cards grid
│   │   │   └── [agentId]/
│   │   │       └── page.tsx   # Agent config editor
│   │   ├── usage/
│   │   │   └── page.tsx       # Usage analytics dashboard
│   │   ├── evals/
│   │   │   ├── page.tsx       # Eval test cases + runs
│   │   │   └── runs/[runId]/
│   │   │       └── page.tsx   # Run detail with results
│   │   └── api/
│   │       ├── chat/route.ts          # SSE streaming + security
│   │       ├── agents/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   └── [id]/route.ts      # GET, PUT, DELETE
│   │       ├── conversations/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   └── [id]/route.ts      # GET detail, DELETE
│   │       ├── usage/route.ts         # Analytics with date range
│   │       └── evals/
│   │           ├── route.ts           # CRUD test cases
│   │           ├── run/route.ts       # Trigger eval batch
│   │           └── runs/
│   │               ├── recent/route.ts # Recent runs list
│   │               └── [id]/route.ts   # Run details
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-container.tsx     # Main chat orchestrator
│   │   │   ├── chat-input.tsx         # Input + agent selector + new chat
│   │   │   ├── message-list.tsx       # Scrollable message feed
│   │   │   ├── message-bubble.tsx     # User/assistant message rendering
│   │   │   ├── thinking-block.tsx     # Collapsible thinking display
│   │   │   ├── tool-call-block.tsx    # Tool execution visualization
│   │   │   ├── streaming-indicator.tsx # "Agent is working..." animation
│   │   │   ├── agent-selector.tsx     # Agent dropdown
│   │   │   └── conversation-sidebar.tsx # History sidebar with search
│   │   ├── agents/
│   │   │   └── agent-config-form.tsx  # Full agent editor form
│   │   ├── usage/
│   │   │   ├── usage-dashboard.tsx    # Analytics page with date picker
│   │   │   └── usage-charts.tsx       # Cost, token, latency, pie charts
│   │   ├── evals/
│   │   │   └── eval-dashboard.tsx     # Test case CRUD + run trigger
│   │   ├── layout/
│   │   │   └── sidebar.tsx            # Navigation sidebar
│   │   └── ui/                        # shadcn/ui components (11)
│   ├── hooks/
│   │   └── use-chat-stream.ts         # SSE client hook
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── base-agent.ts          # Unified agentic loop
│   │   │   ├── agent-registry.ts      # DB + code config merger
│   │   │   └── configs/
│   │   │       ├── cli-assistant.ts   # CLI tools + handlers
│   │   │       ├── code-review.ts     # GitHub tools + handlers
│   │   │       ├── rag-docs.ts        # RAG tools (placeholder)
│   │   │       └── app-generator.ts   # File tools + handlers
│   │   ├── evals/
│   │   │   ├── runner.ts             # Eval batch execution engine
│   │   │   └── scorer.ts             # 6-type criteria scorer
│   │   ├── security/
│   │   │   ├── sanitizer.ts          # HTML/unicode/length sanitization
│   │   │   ├── injection-detector.ts # Score-based injection detection
│   │   │   ├── output-filter.ts      # PII/API key redaction
│   │   │   └── rate-limiter.ts       # Token bucket per IP
│   │   ├── utils/
│   │   │   └── cost-calculator.ts    # Per-model token pricing
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── anthropic.ts             # Anthropic SDK singleton
│   │   └── utils.ts                 # cn() utility
│   └── types/
│       ├── agent.ts                  # AgentConfig, ToolHandler types
│       └── chat.ts                   # SSEEvent, ChatMessage types
├── .env.example
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** (or pnpm/yarn)
- **Anthropic API Key** from [console.anthropic.com](https://console.anthropic.com)
- *(Optional)* **GitHub Token** for the Code Review agent
- *(Optional)* **Pinecone API Key** for the RAG Docs agent

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/agent-platform-dashboard.git
cd agent-platform-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# 4. Initialize the database
npx prisma migrate dev --name init

# 5. Seed the database with 4 default agents
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed agents into database |
| `npm run db:reset` | Reset database and re-run migrations |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."

# Optional — for Code Review agent
GITHUB_TOKEN="ghp_..."

# Optional — for RAG Docs agent (not yet implemented)
PINECONE_API_KEY=""
PINECONE_ENVIRONMENT=""
PINECONE_INDEX=""
```

---

## Database

### Schema

The database has **8 models**:

| Model | Purpose |
|-------|---------|
| `Agent` | Agent configs (name, system prompt, model, tools, thinking settings) |
| `Conversation` | Chat sessions linked to an agent |
| `Message` | Individual messages (user/assistant) with thinking content |
| `ToolCall` | Tool executions with input, result, timing, error state |
| `UsageLog` | Per-request metrics (tokens, cost, latency, success) |
| `EvalTestCase` | Test definitions with input and pass criteria |
| `EvalRun` | Batch run records with pass/fail counts |
| `EvalResult` | Per-test results with output and criterion details |

### Switching to PostgreSQL

For production deployment, change one line in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then update `DATABASE_URL` to your PostgreSQL connection string and run `npx prisma migrate dev`.

---

## Agents

### Agent Registry Pattern

Agent configuration is split between **database** and **code**:

- **Database** stores: name, system prompt, model, max tokens, temperature, thinking settings, tool schemas (JSON)
- **Code** defines: tool handler functions (the actual logic that executes when a tool is called)
- **`agent-registry.ts`** merges both at runtime into a hydrated `AgentConfig`

This means you can edit system prompts and model settings from the UI, while tool logic stays in version-controlled TypeScript files.

### Adding a New Agent

1. Create a config file at `src/lib/agents/configs/my-agent.ts`:

```typescript
import { ToolDefinition, ToolHandler } from "@/types/agent";

export const MY_AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "my_tool",
    description: "Does something useful",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

export const MY_AGENT_HANDLERS: ToolHandler[] = [
  {
    name: "my_tool",
    execute: async (input) => {
      const { query } = input as { query: string };
      return `Result for: ${query}`;
    },
  },
];
```

2. Register in `src/lib/agents/agent-registry.ts`
3. Add to `prisma/seed.ts` and run `npm run db:seed`

---

## API Reference

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message, receive SSE stream |

**Request body:**
```json
{ "agentId": "...", "conversationId": "...", "message": "Hello" }
```

**SSE event types:** `text_start`, `text_delta`, `thinking_start`, `thinking_delta`, `tool_start`, `tool_input_delta`, `tool_result`, `usage`, `error`, `done`

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List active agents |
| `POST` | `/api/agents` | Create agent |
| `GET` | `/api/agents/:id` | Get agent details |
| `PUT` | `/api/agents/:id` | Update agent config |
| `DELETE` | `/api/agents/:id` | Deactivate/delete agent |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations` | List (with `?agentId` filter) |
| `POST` | `/api/conversations` | Create conversation |
| `GET` | `/api/conversations/:id` | Get with messages + tool calls |
| `DELETE` | `/api/conversations/:id` | Delete conversation |

### Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/usage` | Analytics with `?from`, `?to`, `?agentId`, `?granularity` |

### Evaluations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/evals` | List test cases |
| `POST` | `/api/evals` | Create test case |
| `DELETE` | `/api/evals?id=...` | Delete test case |
| `POST` | `/api/evals/run` | Trigger eval batch |
| `GET` | `/api/evals/runs/recent` | Recent runs |
| `GET` | `/api/evals/runs/:id` | Run details with results |

---

## Security

### Defense-in-Depth Architecture

Every message to `/api/chat` passes through 4 security layers in order:

```
User Input → Rate Limiter → Sanitizer → Injection Detector → Agent → Output Filter → User
```

1. **Rate Limiter** — Token bucket per IP (10/min, 50/hr). Protects against abuse.
2. **Input Sanitizer** — Strips HTML/script, removes zero-width unicode, enforces 10K char limit.
3. **Injection Detector** — 14 weighted regex patterns score the input. High-confidence attacks are blocked (400), medium-confidence are logged.
4. **Output Filter** — Scans Claude's responses for API keys, PII (emails, phones, SSNs, credit cards), JWTs, and private keys. Redacts before sending to client.

### Tool Sandboxing

- File operations use `resolveSafe()` which validates paths against a whitelist directory
- Path traversal attempts (`../`) are blocked
- Each agent has its own workspace directory

---

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Switch database to PostgreSQL (see [Database](#database) section)
5. Deploy

### Self-Hosted

```bash
npm run build
npm run start
```

Set `DATABASE_URL` to your PostgreSQL connection string and ensure `ANTHROPIC_API_KEY` is configured.

---

## Roadmap

### Implemented

- [x] Real-time streaming chat with SSE
- [x] Unified agentic loop (`runAgentStream`)
- [x] 4 pre-configured agents with tool execution
- [x] Conversation persistence with sidebar and search
- [x] URL-based conversation routing
- [x] Agent configuration editor UI
- [x] Usage analytics with interactive charts (Recharts)
- [x] Evaluation suite with 6 criteria types
- [x] Eval runner using same code path as production chat
- [x] Input sanitization + injection detection
- [x] Output filtering (PII/key redaction)
- [x] Rate limiting (token bucket per IP)
- [x] Path traversal protection on file tools
- [x] Dark mode AI theme with oklch colors
- [x] Loading skeletons and error boundaries
- [x] Markdown rendering with syntax highlighting

### Planned

- [ ] **Pinecone integration** for RAG Docs agent (vector search)
- [ ] **Multi-agent delegation** — App Generator delegates to sub-agents
- [ ] **LLM Judge** criteria type for evals (Claude evaluates Claude)
- [ ] **Conversation export** (JSON, Markdown)
- [ ] **Agent cloning** — duplicate an agent config
- [ ] **Webhook notifications** on eval failures
- [ ] **Redis rate limiter** (Upstash) for distributed deployments
- [ ] **User authentication** (NextAuth / Clerk)
- [ ] **Team workspaces** with role-based access
- [ ] **Prompt versioning** — track system prompt changes over time
- [ ] **A/B testing** — compare two agent configs side by side
- [ ] **Cost alerts** — notify when spend exceeds threshold
- [ ] **Custom tool builder** — define tools from the UI

---

## License

This project is private. All rights reserved.

---

<p align="center">
  Built with Next.js 15, TypeScript, Anthropic Claude SDK, Prisma, Tailwind CSS, and Recharts.
</p>
