export function isSisuApiEnabled(): boolean {
  return Boolean(process.env.SISU_API_KEY?.trim());
}
