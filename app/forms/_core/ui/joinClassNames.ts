export function joinClassNames(
  ...parts: Array<string | undefined | false>
): string {
  return parts.filter(Boolean).join(" ");
}
