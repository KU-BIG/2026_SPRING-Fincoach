/* 토스 결 미니차트 빌더 — /site/index.html 인라인 <script> 의 함수들을 그대로 이식.
   출력(SVG 문자열)은 원본과 동일하다. dangerouslySetInnerHTML 로 렌더한다. */

export function seededRand(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function genSeries(targetPct: number, days: number, vol: number, seed: number): number[] {
  const r = seededRand(seed);
  const drift = targetPct / (days - 1);
  const out = [0];
  for (let i = 1; i < days; i++) {
    const noise = (r() - 0.5) * 2 * vol;
    const jump = r() > 0.92 ? (r() - 0.5) * 3 * vol : 0;
    out.push(out[i - 1] + drift + noise + jump);
  }
  const last = out[out.length - 1];
  const adj = (targetPct - last) / (days - 1);
  return out.map((v, i) => +(v + adj * i).toFixed(3));
}

export type MiniChartOpts = {
  pad?: number;
  strokeWidth?: number;
  showEndDot?: boolean;
  fillOpacity?: number;
  showAvg?: boolean;
  avgAlpha?: number;
  avgDash?: string;
};

export function buildMiniChart(
  series: number[],
  color: string,
  W: number,
  H: number,
  opts?: MiniChartOpts,
): string {
  opts = opts || {};
  const pad = opts.pad || 3;
  const max = Math.max(...series),
    min = Math.min(...series);
  const range = max - min || 1;
  const xStep = (W - pad * 2) / (series.length - 1);
  const ys = series.map((v) => pad + (H - pad * 2) * (1 - (v - min) / range));
  const pts = series.map((_v, i) => [pad + i * xStep, ys[i]] as [number, number]);
  const lp = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const ap = lp + ` L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  const gid = "g" + Math.random().toString(36).slice(2, 9);
  const strokeW = opts.strokeWidth || 1.6;
  const showEndDot = opts.showEndDot === true;
  const fillTop = opts.fillOpacity || 0.24;
  const showAvg = opts.showAvg === true;
  const avgAlpha = opts.avgAlpha || 0.32;
  const avgDash = opts.avgDash || "2 2";
  const buyIdx = Math.max(0, Math.floor(series.length * 0.12));
  const buyY = pad + (H - pad * 2) * (1 - (series[buyIdx] - min) / range);
  return `
        <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">
          <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="${fillTop}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
          <path d="${ap}" fill="url(#${gid})"/>
          ${showAvg ? `<line x1="${pad}" x2="${W - pad}" y1="${buyY.toFixed(1)}" y2="${buyY.toFixed(1)}" stroke="rgba(255,255,255,${avgAlpha})" stroke-dasharray="${avgDash}" stroke-width="0.9"/>` : ""}
          <path class="spark-line" d="${lp}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round" stroke-linecap="round"/>
          ${showEndDot ? `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="2" fill="${color}"/>` : ""}
        </svg>
      `;
}

/* 종목 데이터 (한국식 색 + 실 브랜드 로고) — /site/ 하드코딩 데이터 그대로 */
export type Stock = {
  name: string;
  ticker: string;
  weight: number;
  pnl: number;
  brand: string;
  seed: number;
};

export const stocks: Stock[] = [
  { name: "삼성전자", ticker: "005930.KS", weight: 22, pnl: 5.2, brand: "samsung", seed: 11 },
  { name: "Apple", ticker: "AAPL", weight: 16, pnl: 3.1, brand: "apple", seed: 22 },
  { name: "NVIDIA", ticker: "NVDA", weight: 14, pnl: 12.7, brand: "nvidia", seed: 33 },
  { name: "카카오", ticker: "035720.KS", weight: 9, pnl: -2.4, brand: "kakao", seed: 44 },
  { name: "NAVER", ticker: "035420.KS", weight: 7, pnl: -1.1, brand: "naver", seed: 55 },
];
