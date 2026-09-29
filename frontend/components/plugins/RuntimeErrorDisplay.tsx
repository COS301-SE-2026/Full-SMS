"use client";

import {
  AlertTriangle,
  Lightbulb,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface RuntimeErrorDisplayProps {
  error: string;
}

const ERROR_SUGGESTIONS: Record<
  string,
  {
    title: string;
    suggestion: string;
    example?: string;
  }
> = {
  NameError: {
    title: "Undefined Variable",
    suggestion:
      "A variable or function name was used before it was defined. Check spelling and make sure you're using the correct function names.",
    example: `# Available functions:
get_parameter("name", default)
get_microtimes()
get_abstimes()
get_data()
set_output("id", value)`,
  },

  TypeError: {
    title: "Type Mismatch",
    suggestion:
      "An operation was attempted on incompatible types. Make sure to convert types when needed (e.g., int(), float(), str()).",
    example: `# Convert parameter types:
num = int(get_parameter("count", 10))
threshold = float(get_parameter("threshold", 0.5))`,
  },

  KeyError: {
    title: "Missing Key",
    suggestion:
      "A dictionary key that doesn't exist was accessed. Use .get() with a default value, or check if the key exists first.",
    example: `# Safe dictionary access:
value = data.get("key", default_value)

# Or check first:
if "key" in data:
    value = data["key"]`,
  },

  IndexError: {
    title: "Index Out of Range",
    suggestion:
      "Tried to access a list/array index that doesn't exist. Check the length of your data before accessing indices.",
    example: `# Check length first:
if len(microtimes) > 0:
    first = microtimes[0]
    last = microtimes[-1]`,
  },

  ValueError: {
    title: "Invalid Value",
    suggestion:
      "A function received a value of the right type but wrong value. Check that your data isn't empty and values are in expected ranges.",
    example: `# Check for empty data:
if len(microtimes) > 0:
    mean = np.mean(microtimes)
else:
    mean = 0`,
  },

  AttributeError: {
    title: "Missing Attribute or Method",
    suggestion:
      "Tried to access an attribute or method that doesn't exist on the object. Check the object type and available methods.",
    example: `# For numpy arrays use .tolist():
set_output("data", array.tolist())

# For getting array stats:
mean = float(np.mean(data))`,
  },

  ZeroDivisionError: {
    title: "Division by Zero",
    suggestion: "Attempted to divide by zero. Add a check to handle this case.",
    example: `# Safe division:
if denominator != 0:
    result = numerator / denominator
else:
    result = 0`,
  },
};

function parseErrorLine(error: string): number | null {
  const lineMatch = error.match(/line\s+(\d+)/i);
  if (lineMatch) {
    return Number.parseInt(lineMatch[1], 10);
  }
  return null;
}

function extractErrorType(error: string): string | null {
  const errorTypes = [
    "NameError",
    "TypeError",
    "KeyError",
    "IndexError",
    "ValueError",
    "AttributeError",
    "ZeroDivisionError",
    "ImportError",
    "ModuleNotFoundError",
    "RuntimeError",
    "SyntaxError",
  ];

  for (const type of errorTypes) {
    if (error.includes(type)) {
      return type;
    }
  }
  return null;
}

function getSpecificSuggestion(error: string): string | null {
  const lowerError = error.toLowerCase();

  if (
    lowerError.includes("output") &&
    (lowerError.includes("not found") || lowerError.includes("undefined"))
  ) {
    return "Make sure the output ID in set_output() exactly matches one defined in the Configuration tab.";
  }

  if (
    lowerError.includes("not json serializable") ||
    lowerError.includes("ndarray")
  ) {
    return "Numpy arrays must be converted to lists using .tolist() before passing to set_output().";
  }

  if (lowerError.includes("empty") || lowerError.includes("zero-size")) {
    return "The measurement data may be empty. Always check len(microtimes) > 0 before processing.";
  }

  if (lowerError.includes("import") || lowerError.includes("module")) {
    return "Only numpy, scipy, pandas, matplotlib, and h5py are available. Check your import statements.";
  }

  return null;
}

export default function RuntimeErrorDisplay({
  error,
}: Readonly<RuntimeErrorDisplayProps>) {
  const [showDetails, setShowDetails] = useState(false);

  const errorType = extractErrorType(error);
  const lineNumber = parseErrorLine(error);
  const suggestion = errorType ? ERROR_SUGGESTIONS[errorType] : null;
  const specificSuggestion = getSpecificSuggestion(error);

  return (
    <div className="space-y-3">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-destructive mb-1">
              {suggestion?.title || "Runtime Error"}
              {lineNumber && (
                <span className="ml-2 text-xs font-normal opacity-75">
                  (Line {lineNumber})
                </span>
              )}
            </h4>
            <p className="text-sm text-destructive/90 break-words">{error}</p>
          </div>
        </div>
      </div>

      {(suggestion || specificSuggestion) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                How to Fix
              </h4>
              <p className="text-sm text-foreground/80">
                {specificSuggestion || suggestion?.suggestion}
              </p>

              {/* Example Code */}
              {suggestion?.example && (
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                >
                  {showDetails ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Code className="h-3 w-3" />
                  {showDetails ? "Hide example" : "Show example code"}
                </button>
              )}

              {showDetails && suggestion?.example && (
                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                  {suggestion.example}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {!suggestion && !specificSuggestion && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Troubleshooting Tips
          </h4>
          <ul className="text-xs text-foreground/70 space-y-1 ml-6 list-disc">
            <li>Check that all variable names are spelled correctly</li>
            <li>Make sure output IDs match the Configuration tab exactly</li>
            <li>
              Convert numpy arrays to lists with{" "}
              <code className="text-primary">.tolist()</code>
            </li>
            <li>
              Always check{" "}
              <code className="text-primary">len(microtimes) &gt; 0</code>{" "}
              before processing
            </li>
            <li>
              Use <code className="text-primary">float()</code> or{" "}
              <code className="text-primary">int()</code> to convert parameter
              values
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
