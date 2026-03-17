import Anthropic from "@anthropic-ai/sdk";
import { Octokit } from "@octokit/rest";
import { ToolHandler } from "@/types/agent";

const MAX_DIFF_LENGTH = 30_000;
const MAX_PATCH_LENGTH = 3_000;

export const codeReviewTools: Anthropic.Messages.Tool[] = [
  {
    name: "fetch_pr_diff",
    description:
      "Fetches the full unified diff of a pull request. Returns the raw diff text showing all changed files.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner (user or org)" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
      },
      required: ["owner", "repo", "pull_number"],
    },
  },
  {
    name: "get_file_content",
    description:
      "Retrieves the full content of a specific file at a specific git ref.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "File path relative to repo root" },
        ref: { type: "string", description: "Git ref (branch name or commit SHA)" },
      },
      required: ["owner", "repo", "path", "ref"],
    },
  },
  {
    name: "list_pr_files",
    description:
      "Lists all files changed in a pull request with status, additions/deletions, and patch content.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
      },
      required: ["owner", "repo", "pull_number"],
    },
  },
  {
    name: "post_review_comment",
    description:
      "Posts a review comment on the pull request. Use when review is complete.",
    input_schema: {
      type: "object" as const,
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        pull_number: { type: "number", description: "Pull request number" },
        body: { type: "string", description: "Markdown-formatted review comment" },
      },
      required: ["owner", "repo", "pull_number", "body"],
    },
  },
];

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN environment variable is required");
  return new Octokit({ auth: token });
}

export const codeReviewHandlers: ToolHandler[] = [
  {
    name: "fetch_pr_diff",
    execute: async (input) => {
      const octokit = getOctokit();
      const { data } = await octokit.rest.pulls.get({
        owner: input.owner as string,
        repo: input.repo as string,
        pull_number: input.pull_number as number,
        mediaType: { format: "diff" },
      });
      let diff = data as unknown as string;
      if (diff.length > MAX_DIFF_LENGTH) {
        diff = diff.substring(0, MAX_DIFF_LENGTH) +
          "\n\n... [diff truncated. Use get_file_content to inspect specific files.]";
      }
      return diff;
    },
  },
  {
    name: "get_file_content",
    execute: async (input) => {
      const octokit = getOctokit();
      const { data } = await octokit.rest.repos.getContent({
        owner: input.owner as string,
        repo: input.repo as string,
        path: input.path as string,
        ref: input.ref as string,
      });
      if (Array.isArray(data)) return `Error: "${input.path}" is a directory.`;
      if (!("content" in data) || !data.content)
        return `Error: No content available for "${input.path}".`;
      return Buffer.from(data.content, "base64").toString("utf-8");
    },
  },
  {
    name: "list_pr_files",
    execute: async (input) => {
      const octokit = getOctokit();
      const { data } = await octokit.rest.pulls.listFiles({
        owner: input.owner as string,
        repo: input.repo as string,
        pull_number: input.pull_number as number,
        per_page: 100,
      });
      const files = data.map((file) => {
        let patch = file.patch || "";
        if (patch.length > MAX_PATCH_LENGTH)
          patch = patch.substring(0, MAX_PATCH_LENGTH) + "\n... [truncated]";
        return `## ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})\n${patch ? "```diff\n" + patch + "\n```" : "(binary)"}`;
      });
      return `${data.length} files changed:\n\n${files.join("\n\n")}`;
    },
  },
  {
    name: "post_review_comment",
    execute: async (input) => {
      const octokit = getOctokit();
      const { data } = await octokit.rest.issues.createComment({
        owner: input.owner as string,
        repo: input.repo as string,
        issue_number: input.pull_number as number,
        body: input.body as string,
      });
      return `Review comment posted: ${data.html_url}`;
    },
  },
];

export const codeReviewSystemPrompt = `You are a senior software engineer conducting a thorough code review of a GitHub pull request.

## Review Criteria
1. **Security vulnerabilities** — injection flaws, auth issues, secrets in code
2. **Bugs and correctness** — logic errors, null/undefined risks, race conditions
3. **Performance issues** — N+1 queries, unnecessary allocations, blocking calls
4. **Error handling** — uncaught exceptions, missing validation, silent failures
5. **Code quality** — readability, duplication, overly complex logic
6. **Best practices** — API design, architectural patterns, test coverage gaps

## Workflow
1. Call \`list_pr_files\` to understand the scope of changes
2. Call \`fetch_pr_diff\` to see the full diff
3. For complex files, call \`get_file_content\` to read full source
4. When review is complete, call \`post_review_comment\` with formatted markdown

## Review Comment Format
Structure your review as:
- **Overall Assessment**: Approve / Request Changes / Comment
- **Summary**: Brief overview
- **Findings**: List each with severity (Critical/Warning/Info), file, line, description
- **Suggestions**: Actionable improvements

Be constructive and specific. Suggest fixes, don't just point out problems.`;

export const codeReviewSeed = {
  slug: "code-review",
  name: "Code Review Agent",
  description:
    "Autonomous GitHub PR reviewer. Analyzes diffs, inspects files, and posts structured review comments with findings categorized by severity.",
  systemPrompt: codeReviewSystemPrompt,
  model: "claude-sonnet-4-20250514",
  maxTokens: 16000,
  tools: JSON.stringify(codeReviewTools),
  maxIterations: 20,
  isActive: true,
  useThinking: true,
  thinkingBudget: 10000,
};
