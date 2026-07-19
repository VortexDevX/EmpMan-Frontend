export function score(value: unknown, decimals = 1): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0";
  return num.toFixed(decimals);
}
