interface DetectionResult {
  score: number; // 0-1, higher = more suspicious
  flags: string[];
  action: "allow" | "warn" | "reject";
}

const INJECTION_PATTERNS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  // Direct instruction overrides
  {
    pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/i,
    weight: 0.8,
    label: "Instruction override attempt",
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)/i,
    weight: 0.8,
    label: "Instruction disregard attempt",
  },
  {
    pattern: /forget\s+(all\s+)?(previous|your)\s+(instructions|rules|constraints)/i,
    weight: 0.7,
    label: "Instruction forget attempt",
  },

  // System prompt extraction
  {
    pattern: /what\s+(is|are)\s+your\s+(system\s+prompt|instructions|rules)/i,
    weight: 0.5,
    label: "System prompt extraction attempt",
  },
  {
    pattern: /repeat\s+(your\s+)?(system\s+prompt|initial\s+instructions)/i,
    weight: 0.6,
    label: "System prompt repeat attempt",
  },
  {
    pattern: /print\s+(your\s+)?(system|initial)\s+(prompt|message|instructions)/i,
    weight: 0.6,
    label: "System prompt print attempt",
  },

  // Role play attacks
  {
    pattern: /you\s+are\s+now\s+(a|an|the)\s+/i,
    weight: 0.4,
    label: "Role reassignment attempt",
  },
  {
    pattern: /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
    weight: 0.3,
    label: "Role play request",
  },
  {
    pattern: /pretend\s+(you\s+are|to\s+be)\s+/i,
    weight: 0.3,
    label: "Pretend request",
  },

  // Delimiter injection
  {
    pattern: /```system/i,
    weight: 0.7,
    label: "System delimiter injection",
  },
  {
    pattern: /<\/?system>/i,
    weight: 0.7,
    label: "System tag injection",
  },
  {
    pattern: /\[INST\]|\[\/INST\]/i,
    weight: 0.6,
    label: "Instruction tag injection",
  },
  {
    pattern: /<<SYS>>|<\/SYS>/i,
    weight: 0.7,
    label: "System boundary injection",
  },

  // Encoding evasion
  {
    pattern: /base64\s*decode|atob\s*\(/i,
    weight: 0.5,
    label: "Encoding evasion attempt",
  },

  // Direct prompt leaking
  {
    pattern: /output\s+everything\s+(above|before)/i,
    weight: 0.6,
    label: "Prompt leaking attempt",
  },
];

/**
 * Score-based prompt injection detection.
 * score > 0.7 → reject
 * score 0.3-0.7 → warn (log but allow)
 * score < 0.3 → allow
 */
export function detectInjection(input: string): DetectionResult {
  const flags: string[] = [];
  let totalScore = 0;

  for (const { pattern, weight, label } of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push(label);
      totalScore += weight;
    }
  }

  // Cap at 1.0
  const score = Math.min(totalScore, 1.0);

  let action: DetectionResult["action"];
  if (score > 0.7) {
    action = "reject";
  } else if (score > 0.3) {
    action = "warn";
  } else {
    action = "allow";
  }

  return { score, flags, action };
}
