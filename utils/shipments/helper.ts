export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function sign(n: number): string {
  return n >= 0 ? "+" : "";
}
