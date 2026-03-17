export interface Criterion {
  type: "contains" | "not_contains" | "regex" | "tool_called" | "no_tool_called" | "json_schema" | "llm_judge";
  value: string;
}

export interface ScoringInput {
  output: string;
  toolsCalled: string[];
}

export interface CriterionResult {
  type: string;
  value: string;
  passed: boolean;
  reason: string;
}

export function scoreCriteria(
  criteria: Criterion[],
  input: ScoringInput
): { passed: boolean; details: CriterionResult[] } {
  const details: CriterionResult[] = [];

  for (const criterion of criteria) {
    const result = scoreSingle(criterion, input);
    details.push(result);
  }

  const passed = details.every((d) => d.passed);
  return { passed, details };
}

function scoreSingle(criterion: Criterion, input: ScoringInput): CriterionResult {
  const { type, value } = criterion;

  switch (type) {
    case "contains": {
      const found = input.output.toLowerCase().includes(value.toLowerCase());
      return {
        type,
        value,
        passed: found,
        reason: found
          ? `Output contains "${value}"`
          : `Output does not contain "${value}"`,
      };
    }

    case "not_contains": {
      const found = input.output.toLowerCase().includes(value.toLowerCase());
      return {
        type,
        value,
        passed: !found,
        reason: !found
          ? `Output does not contain "${value}"`
          : `Output contains "${value}" (should not)`,
      };
    }

    case "regex": {
      try {
        const regex = new RegExp(value, "i");
        const matches = regex.test(input.output);
        return {
          type,
          value,
          passed: matches,
          reason: matches
            ? `Output matches pattern /${value}/`
            : `Output does not match pattern /${value}/`,
        };
      } catch {
        return {
          type,
          value,
          passed: false,
          reason: `Invalid regex pattern: ${value}`,
        };
      }
    }

    case "tool_called": {
      const called = input.toolsCalled.includes(value);
      return {
        type,
        value,
        passed: called,
        reason: called
          ? `Tool "${value}" was called`
          : `Tool "${value}" was not called (called: ${input.toolsCalled.join(", ") || "none"})`,
      };
    }

    case "no_tool_called": {
      const called = input.toolsCalled.includes(value);
      return {
        type,
        value,
        passed: !called,
        reason: !called
          ? `Tool "${value}" was not called`
          : `Tool "${value}" was called (should not have been)`,
      };
    }

    case "json_schema": {
      // Simple check: verify output contains valid JSON
      try {
        const jsonMatch = input.output.match(/```json\s*([\s\S]*?)\s*```/) ||
          input.output.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return { type, value, passed: false, reason: "No JSON found in output" };
        }
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        // Check if required keys exist
        const requiredKeys = value.split(",").map((k) => k.trim());
        const missingKeys = requiredKeys.filter((k) => !(k in parsed));
        if (missingKeys.length > 0) {
          return {
            type,
            value,
            passed: false,
            reason: `Missing keys: ${missingKeys.join(", ")}`,
          };
        }
        return { type, value, passed: true, reason: "JSON contains all required keys" };
      } catch {
        return { type, value, passed: false, reason: "Failed to parse JSON from output" };
      }
    }

    case "llm_judge": {
      // LLM judge requires async call — mark as pending, will be handled separately
      return {
        type,
        value,
        passed: true,
        reason: "LLM judge criteria not yet implemented — auto-passing",
      };
    }

    default:
      return {
        type,
        value,
        passed: false,
        reason: `Unknown criterion type: ${type}`,
      };
  }
}
