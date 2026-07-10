export function getErrorMessage(
  error: unknown,
  fallback: string = "An error occurred",
): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
