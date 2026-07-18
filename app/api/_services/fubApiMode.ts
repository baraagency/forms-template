export function isFubApiEnabled(): boolean {
  return Boolean(process.env.FUB_API_KEY?.trim());
}
