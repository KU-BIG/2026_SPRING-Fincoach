export function krw(v: number) {
  return v.toLocaleString("ko-KR");
}
export function pct(v: number, digits = 2) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}
export function pnlColor(v: number) {
  return v >= 0 ? "text-positive" : "text-negative";
}
