export function unwrapGeneratedCopy<T>(input: T | { content: T }): T {
  return typeof input === "object" && input && "content" in input
    ? (input as any).content
    : input as T;
}
