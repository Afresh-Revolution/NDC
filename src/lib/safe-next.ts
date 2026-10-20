export function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/workspace";
  return value;
}
