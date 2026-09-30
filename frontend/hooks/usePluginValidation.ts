"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { pluginService } from "@/services/pluginServices";
import { ValidationError } from "@/types/plugin";

interface UsePluginValidationResult {
  errors: ValidationError[];
  isValidating: boolean;
  isValid: boolean | null;
}

function parseValidationError(error: string): ValidationError {
  const syntaxMatch = /^Syntax error at line (\d+): (.+)$/.exec(error);
  if (syntaxMatch) {
    return {
      line: Number.parseInt(syntaxMatch[1], 10),
      message: syntaxMatch[2],
      severity: "error",
    };
  }

  return {
    line: 1,
    message: error,
    severity: "error",
  };
}

export function usePluginValidation(
  script: string,
  debounceMs: number = 500,
): UsePluginValidationResult {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const currentScriptRef = useRef(script);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEmptyScript = useMemo(() => !script.trim(), [script]);

  const validate = useCallback(async (scriptToValidate: string) => {
    if (!scriptToValidate.trim()) {
      setErrors([]);
      setIsValid(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);

    try {
      const response = await pluginService.validatePlugin({
        script: scriptToValidate,
      });

      if (currentScriptRef.current === scriptToValidate) {
        if (response.valid) {
          setErrors([]);
          setIsValid(true);
        } else {
          let errorMessage = "Validation failed";
          if (response.error && typeof response.error === "string") {
            errorMessage = response.error;
          } else if (response.message && typeof response.message === "string") {
            errorMessage = response.message;
          }
          setErrors([parseValidationError(errorMessage)]);
          setIsValid(false);
        }
      }
    } catch (error: unknown) {
      if (currentScriptRef.current === scriptToValidate) {
        setErrors([
          {
            line: 1,
            message:
              error instanceof Error ? error.message : "Validation failed",
            severity: "error",
          },
        ]);
        setIsValid(false);
      }
    } finally {
      if (currentScriptRef.current === scriptToValidate) {
        setIsValidating(false);
      }
    }
  }, []);

  useEffect(() => {
    currentScriptRef.current = script;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isEmptyScript) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      validate(script);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [script, debounceMs, validate, isEmptyScript]);

  if (isEmptyScript) {
    return { errors: [], isValidating: false, isValid: null };
  }

  return { errors, isValidating, isValid };
}
