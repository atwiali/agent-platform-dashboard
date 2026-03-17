const REDACTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // AWS keys
  {
    pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
    label: "AWS Access Key",
  },
  // AWS secret keys
  {
    pattern: /[A-Za-z0-9/+=]{40}(?=\s|$|")/g,
    label: "Potential AWS Secret Key",
  },
  // Generic API keys (long hex/alphanumeric strings prefixed with key identifiers)
  {
    pattern: /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{20,}["']?/gi,
    label: "API Key",
  },
  // Anthropic API keys
  {
    pattern: /sk-ant-[A-Za-z0-9_-]{20,}/g,
    label: "Anthropic API Key",
  },
  // OpenAI API keys
  {
    pattern: /sk-[A-Za-z0-9]{20,}/g,
    label: "OpenAI API Key",
  },
  // GitHub tokens
  {
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    label: "GitHub Token",
  },
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    label: "Email Address",
  },
  // Phone numbers (US format)
  {
    pattern: /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    label: "Phone Number",
  },
  // SSN
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: "SSN",
  },
  // Credit card numbers (basic)
  {
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    label: "Credit Card Number",
  },
  // Private keys
  {
    pattern: /-----BEGIN\s(?:RSA\s)?PRIVATE\sKEY-----[\s\S]*?-----END\s(?:RSA\s)?PRIVATE\sKEY-----/g,
    label: "Private Key",
  },
  // JWT tokens
  {
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    label: "JWT Token",
  },
];

interface FilterResult {
  filtered: string;
  redactions: string[];
}

/**
 * Scans output for sensitive data patterns and redacts them.
 */
export function filterOutput(output: string): FilterResult {
  const redactions: string[] = [];
  let filtered = output;

  for (const { pattern, label } of REDACTION_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;

    if (pattern.test(filtered)) {
      pattern.lastIndex = 0;
      filtered = filtered.replace(pattern, `[REDACTED ${label}]`);
      redactions.push(label);
    }
  }

  return { filtered, redactions };
}
