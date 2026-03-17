const MAX_INPUT_LENGTH = 10_000;

/**
 * Sanitizes user input before sending to the LLM.
 * Strips dangerous HTML/script content, enforces length limits, normalizes unicode.
 */
export function sanitizeInput(input: string): { safe: string; warnings: string[] } {
  const warnings: string[] = [];
  let safe = input;

  // Enforce length limit
  if (safe.length > MAX_INPUT_LENGTH) {
    safe = safe.slice(0, MAX_INPUT_LENGTH);
    warnings.push(`Input truncated to ${MAX_INPUT_LENGTH} characters`);
  }

  // Strip HTML tags
  const htmlTagPattern = /<\/?[a-z][^>]*>/gi;
  if (htmlTagPattern.test(safe)) {
    safe = safe.replace(htmlTagPattern, "");
    warnings.push("HTML tags stripped from input");
  }

  // Strip script content entirely
  const scriptPattern = /<script[\s\S]*?<\/script>/gi;
  if (scriptPattern.test(safe)) {
    safe = safe.replace(scriptPattern, "");
    warnings.push("Script tags removed from input");
  }

  // Normalize unicode homoglyphs (common attack vector)
  // Replace common lookalike characters with ASCII equivalents
  const homoglyphMap: Record<string, string> = {
    "\u200B": "", // zero-width space
    "\u200C": "", // zero-width non-joiner
    "\u200D": "", // zero-width joiner
    "\uFEFF": "", // zero-width no-break space
    "\u00A0": " ", // non-breaking space
    "\u2028": "\n", // line separator
    "\u2029": "\n", // paragraph separator
  };

  let hadHidden = false;
  for (const [char, replacement] of Object.entries(homoglyphMap)) {
    if (safe.includes(char)) {
      safe = safe.split(char).join(replacement);
      hadHidden = true;
    }
  }
  if (hadHidden) {
    warnings.push("Hidden unicode characters removed");
  }

  // Trim whitespace
  safe = safe.trim();

  return { safe, warnings };
}
