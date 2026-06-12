/* /site/portfolio.html 인라인 <script> 를 그대로(verbatim) 이식.
   SVG/HTML 문자열 출력은 원본과 동일하다. React 페이지의 useEffect 에서
   원본과 같은 순서로 호출해 동일 DOM 을 구성한다(dangerouslySetInnerHTML / 직접 주입).
   주의: 이 모듈의 buildMiniChart/genStockSeries 는 홈(lib/charts.ts)과 미묘하게 달라
   별도로 둔다(end-dot r=1.6, avg-line 위치/스타일, svg style 등 portfolio.html 그대로). */

export const krw = (n: number): string => n.toLocaleString();

export type Stock = {
  name: string;
  ticker: string;
  weight: number;
  value: number;
  pnl: number;
  brand: string;
  sector: string;
};

export const stocks: Stock[] = [
  { name: "삼성전자", ticker: "005930.KS", weight: 22, value: 2717000, pnl: 5.2, brand: "samsung", sector: "반도체" },
  { name: "Apple", ticker: "AAPL", weight: 16, value: 1976000, pnl: 3.1, brand: "apple", sector: "빅테크" },
  { name: "NVIDIA", ticker: "NVDA", weight: 14, value: 1729000, pnl: 12.7, brand: "nvidia", sector: "반도체" },
  { name: "Microsoft", ticker: "MSFT", weight: 10, value: 1235000, pnl: 4.8, brand: "microsoft", sector: "빅테크" },
  { name: "카카오", ticker: "035720.KS", weight: 9, value: 1111500, pnl: -2.4, brand: "kakao", sector: "한국 플랫폼" },
  { name: "Tesla", ticker: "TSLA", weight: 8, value: 988000, pnl: 7.1, brand: "tesla", sector: "EV" },
  { name: "NAVER", ticker: "035420.KS", weight: 7, value: 864500, pnl: -1.1, brand: "naver", sector: "한국 플랫폼" },
  { name: "Google", ticker: "GOOGL", weight: 6, value: 741000, pnl: 2.6, brand: "google", sector: "빅테크" },
  { name: "쿠팡", ticker: "CPNG", weight: 6, value: 741000, pnl: -0.5, brand: "coupang", sector: "한국 이커머스" },
  { name: "Coinbase", ticker: "COIN", weight: 2, value: 247000, pnl: 18.4, brand: "coinbase", sector: "가상자산" },
];

// ========= 실제 주식 결 random walk 시리즈 생성 =========
// seed 기반 deterministic random (mulberry32)
export function seededRand(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function genStockSeries(targetPct: number, days: number, vol: number, seed: number): number[] {
  const r = seededRand(seed);
  const drift = targetPct / (days - 1);
  const out = [0];
  for (let i = 1; i < days; i++) {
    // 일별 변동: 트렌드 + 노이즈 (±vol%) + 가끔 점프
    const noise = (r() - 0.5) * 2 * vol;
    const jump = r() > 0.92 ? (r() - 0.5) * 3 * vol : 0;
    out.push(out[i - 1] + drift + noise + jump);
  }
  // 마지막 값이 정확히 targetPct가 되도록 보정
  const last = out[out.length - 1];
  const adjust = (targetPct - last) / (days - 1);
  return out.map((v, i) => +(v + adjust * i).toFixed(3));
}

export const stockSeries: Record<string, number[]> = {
  "005930.KS": genStockSeries(5.2, 30, 0.55, 11),
  AAPL: genStockSeries(3.1, 30, 0.45, 22),
  NVDA: genStockSeries(12.7, 30, 1.2, 33),
  MSFT: genStockSeries(4.8, 30, 0.5, 44),
  "035720.KS": genStockSeries(-2.4, 30, 0.55, 55),
  TSLA: genStockSeries(7.1, 30, 1.4, 66),
  "035420.KS": genStockSeries(-1.1, 30, 0.45, 77),
  GOOGL: genStockSeries(2.6, 30, 0.45, 88),
  CPNG: genStockSeries(-0.5, 30, 0.65, 99),
  COIN: genStockSeries(18.4, 30, 1.8, 110),
};

export type MiniOpts = {
  pad?: number;
  strokeWidth?: number;
  showEndDot?: boolean;
  showAvg?: boolean;
  fillOpacity?: number;
  avgAlpha?: number;
  avgDash?: string;
  avgWidth?: number;
};

// ========= sparkline 빌더 (토스증권 지수 카드 결: 라인 + 면적 gradient) =========
export function buildMiniChart(
  series: number[],
  color: string,
  W: number,
  H: number,
  opts: MiniOpts = {},
): string {
  const pad = opts.pad || 3;
  const max = Math.max(...series),
    min = Math.min(...series);
  const range = max - min || 1;
  const xStep = (W - pad * 2) / (series.length - 1);
  const ys = series.map((v) => pad + (H - pad * 2) * (1 - (v - min) / range));
  const pts = series.map((_v, i) => [pad + i * xStep, ys[i]] as [number, number]);
  const lp = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const ap = lp + ` L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  const buyIdx = Math.floor(series.length * 0.12);
  const buyY = pad + (H - pad * 2) * (1 - (series[buyIdx] - min) / range);
  const gid = "g" + Math.random().toString(36).slice(2, 9);
  const strokeW = opts.strokeWidth || 1.6;
  const showEndDot = opts.showEndDot === true;
  const showAvg = opts.showAvg !== false;
  const fillTop = opts.fillOpacity || 0.24;
  return `
        <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width: 100%; height: ${H}px; display: block;">
          <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="${fillTop}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
          ${showAvg ? `<line x1="${pad}" x2="${W - pad}" y1="${buyY.toFixed(1)}" y2="${buyY.toFixed(1)}" stroke="rgba(255,255,255,${opts.avgAlpha || 0.14})" stroke-dasharray="${opts.avgDash || "1.5 2"}" stroke-width="${opts.avgWidth || 0.7}"/>` : ""}
          <path d="${ap}" fill="url(#${gid})"/>
          <path class="spark-line" d="${lp}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linejoin="round" stroke-linecap="round"/>
          ${showEndDot ? `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="1.6" fill="${color}"/>` : ""}
        </svg>
      `;
}

// ========= 보유 종목 표 (sparkline + 클릭 펼침) =========
export function buildStockRow(s: Stock, idx: number): string {
  const series = stockSeries[s.ticker] || [];
  const sign = s.pnl >= 0 ? "+" : "";
  const color = s.pnl >= 0 ? "#F04452" : "#3B9EFF";
  const buyPrice = Math.round(s.value / (1 + s.pnl / 100));

  const arrowUp = `<svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 10L7 4L11 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const arrowDn = `<svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M3 4L7 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const arrow = s.pnl >= 0 ? arrowUp : arrowDn;
  const caret = `<svg class="row-caret" viewBox="0 0 14 14" fill="none"><path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
        <tr class="stock-tr" data-idx="${idx}">
          <td style="width: 200px;">
            <div class="stock-row">
              <div class="brand-mark ${s.brand}"><span class="logo"></span></div>
              <div>
                <div class="nm">${s.name} ${caret}</div>
                <div class="tk">${s.ticker} · ${s.sector || ""}</div>
              </div>
            </div>
          </td>
          <td style="padding-right: 4px; text-align: right;"><div style="width: 88px; height: 32px; display: inline-block; vertical-align: middle;">${buildMiniChart(series, color, 88, 32, { pad: 2, strokeWidth: 1.5, showAvg: true, avgAlpha: 0.32, avgDash: "2 2" })}</div></td>
          <td style="text-align:right; padding-right: 18px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; color: ${color}; font-size: 16px;">
              ${arrow}<span class="num" style="font-weight: 700;">${sign}${s.pnl.toFixed(2)}%</span>
            </div>
            <div style="font-size: 11.5px; color: var(--fg-muted); margin-top: 3px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em;">매수 ${krw(buyPrice)}</div>
          </td>
          <td style="text-align:right; padding: 0 0 0 0; font-size: 15px;" class="num">${s.weight}%</td>
          <td style="text-align:right; padding: 14px 64px 14px 4px; font-size: 15.5px;" class="num">${krw(s.value)}원</td>
        </tr>
        <tr class="expand-tr"><td colspan="5"><div class="expand-panel" id="ep${idx}"></div></td></tr>
      `;
}

// 클릭 시 펼침 (토스증권 결 종목 상세)
export function buildExpandPanel(s: Stock): string {
  const series = stockSeries[s.ticker] || [];
  const cls = s.pnl >= 0 ? "pos" : "neg";
  const sign = s.pnl >= 0 ? "+" : "";
  const color = s.pnl >= 0 ? "#F04452" : "#3B9EFF";
  const buyPrice = Math.round(s.value / (1 + s.pnl / 100));
  const last = series[series.length - 1];
  const day1Pct = (last - series[series.length - 2]).toFixed(2);
  const day7Pct = (last - series[series.length - 8]).toFixed(2);
  const day30Pct = s.pnl.toFixed(2);
  const chip = (k: string, v: string) => {
    const num = parseFloat(v);
    const c = num >= 0 ? "pos" : "neg";
    const sn = num >= 0 ? "+" : "";
    return `<div class="expand-chip ${c}">${k} <span class="v">${sn}${v}%</span></div>`;
  };
  return `
        <div class="expand-inner">
          <div class="expand-chart">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span class="lbl">30D 가격 추이</span>
              <span class="lbl" style="color: ${color};">${sign}${s.pnl.toFixed(2)}%</span>
            </div>
            ${buildMiniChart(series, color, 320, 64, { pad: 5, strokeWidth: 1.6, fillOpacity: 0.28, showEndDot: true, avgAlpha: 0.32 })}
            <div class="expand-chips" style="margin-top: 10px;">
              ${chip("1D", day1Pct)}
              ${chip("7D", day7Pct)}
              ${chip("30D", day30Pct)}
            </div>
          </div>
          <div class="expand-stats">
            <div class="expand-stat"><span class="k">매수 평균가</span><span class="v num">${krw(buyPrice)}원</span></div>
            <div class="expand-stat"><span class="k">현재 평가액</span><span class="v num">${krw(s.value)}원</span></div>
            <div class="expand-stat"><span class="k">평가 손익</span><span class="v num ${cls}">${sign}${krw(s.value - buyPrice)}원</span></div>
            <div class="expand-stat"><span class="k">섹터</span><span class="v" style="font-size:12px; font-weight:600;">${s.sector || "-"}</span></div>
          </div>
        </div>
      `;
}

// ========= KPI 1: 평가금액 7일 sparkbars =========
export function buildBars7d(): string {
  const bars7d = [
    { v: 0.4, up: true },
    { v: -0.2, up: false },
    { v: 0.6, up: true },
    { v: 1.1, up: true },
    { v: -0.3, up: false },
    { v: 0.8, up: true },
    { v: 1.2, up: true }, // 오늘
  ];
  const maxBar = Math.max(...bars7d.map((b) => Math.abs(b.v)));
  return bars7d
    .map(
      (b) => `
      <div class="bar ${b.up ? "up" : "dn"}" style="height: ${Math.max(8, (Math.abs(b.v) / maxBar) * 40)}px;" title="${b.up ? "+" : ""}${b.v}%"></div>
    `,
    )
    .join("");
}

// ========= KPI 2: 평가 손익 — 일별 막대 + 누적 라인 콤보 =========
export function buildPnlCombo(): string {
  const daily = [60, -30, 90, 120, -40, 80, 200]; // 천원 단위
  const cum = daily.reduce((a: number[], v, i) => {
    a.push((a[i - 1] || 0) + v);
    return a;
  }, []);
  const W = 220,
    H = 56,
    pad = 4;
  const xStep = (W - pad * 2) / daily.length;
  const dailyMax = Math.max(...daily.map(Math.abs));
  const cumMax = Math.max(...cum),
    cumMin = Math.min(...cum, 0);
  const cumRange = cumMax - cumMin || 1;
  // 막대 (각 일자)
  const bars = daily
    .map((v, i) => {
      const x = pad + i * xStep + 2;
      const w = xStep - 4;
      const h = Math.max(2, (Math.abs(v) / dailyMax) * (H * 0.4));
      const baseY = H * 0.55;
      const y = v >= 0 ? baseY - h : baseY;
      const fill = v >= 0 ? "rgba(240,68,82,0.45)" : "rgba(59,130,246,0.45)";
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${fill}"/>`;
    })
    .join("");
  // 누적 라인 (오버레이)
  const cumPts = cum.map((v, i) => {
    const x = pad + i * xStep + xStep / 2;
    const y = pad + (H - pad * 2) * (1 - (v - cumMin) / cumRange);
    return [x, y] as [number, number];
  });
  const cumPath = cumPts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const endX = cumPts[cumPts.length - 1][0],
    endY = cumPts[cumPts.length - 1][1];

  return `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%; height:${H}px;">
          <line x1="${pad}" x2="${W - pad}" y1="${H * 0.55}" y2="${H * 0.55}" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
          ${bars}
          <path d="${cumPath}" fill="none" stroke="#F04452" stroke-width="1.8"/>
          <circle cx="${endX}" cy="${endY}" r="3" fill="#F04452"/>
          <circle cx="${endX}" cy="${endY}" r="6" fill="#F04452" opacity="0.28"/>
        </svg>
      `;
}

// ========= KPI 3: 수익률 — 반원 게이지 + 벤치마크 마커 =========
export function buildRetGauge(): string {
  const my = 4.05;
  const bench = 1.2;
  const minR = -5,
    maxR = 10;
  const valToAngle = (v: number) => Math.PI * (1 - (v - minR) / (maxR - minR)); // π → 0
  const W = 220,
    H = 56,
    cx = W / 2,
    cy = H * 0.92,
    r = 48;

  // arc path util
  const pt = (a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)] as [number, number];
  const arc = (a1: number, a2: number, sweep = 0) => {
    const [x1, y1] = pt(a1),
      [x2, y2] = pt(a2);
    const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  };

  // 배경 트랙 (반원)
  const bgPath = arc(Math.PI, 0, 1);
  // 값 채움 (시작 π, 끝 valToAngle(my))
  const valPath = arc(Math.PI, valToAngle(my), 1);

  // 벤치 마커 위치
  const ba = valToAngle(bench);
  const [bx, by] = pt(ba);

  return `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%; max-width:220px; height:${H}px; display:block; margin: 0 auto;">
          <defs>
            <linearGradient id="gaugeG" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stop-color="#3B9EFF"/>
              <stop offset="50%" stop-color="#FFC53D"/>
              <stop offset="100%" stop-color="#F04452"/>
            </linearGradient>
          </defs>
          <path d="${bgPath}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6" stroke-linecap="round"/>
          <path d="${valPath}" fill="none" stroke="url(#gaugeG)" stroke-width="6" stroke-linecap="round"/>
          <line x1="${bx.toFixed(1)}" y1="${(by - 7).toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(by + 4).toFixed(1)}" stroke="rgba(255,255,255,0.6)" stroke-width="1.4" stroke-dasharray="2 2"/>
          <text x="${bx.toFixed(1)}" y="${(by - 10).toFixed(1)}" text-anchor="middle" style="font-family: 'JetBrains Mono'; font-size: 8px; fill: rgba(255,255,255,0.5);">KOSPI</text>
          <text x="${pt(valToAngle(minR))[0].toFixed(1)}" y="${(cy + 12).toFixed(1)}" text-anchor="middle" style="font-family: 'JetBrains Mono'; font-size: 8px; fill: var(--fg-muted);">${minR}%</text>
          <text x="${pt(valToAngle(maxR))[0].toFixed(1)}" y="${(cy + 12).toFixed(1)}" text-anchor="middle" style="font-family: 'JetBrains Mono'; font-size: 8px; fill: var(--fg-muted);">+${maxR}%</text>
        </svg>
      `;
}

// ========= 차트 데이터 =========
// 30일 평가액 (단위: 원) + 벤치마크 (KOSPI 상대) — 마지막 일은 오늘
export type LinePoint = { date: Date; value: number; bench: number };

const today = new Date("2026-06-11");
export const fmtDate = (d: Date): string =>
  `${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
export const compact = (n: number): string => {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + "억";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "만";
  return n.toLocaleString();
};

export function buildLineData(): LinePoint[] {
  const base = 11870000;
  const benchBase = 11870000;
  // 30일 평가액 + KOSPI 벤치마크도 random walk로 자연스럽게
  const seed = genStockSeries(4.05, 30, 0.55, 707);
  const benchSeed = genStockSeries(1.2, 30, 0.35, 808);
  return seed.map((p, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (seed.length - 1 - i));
    return {
      date: d,
      value: Math.round(base * (1 + p / 100)),
      bench: Math.round(benchBase * (1 + benchSeed[i] / 100)),
    };
  });
}

// ========= 도넛 차트 (비중 분포) =========
export function buildDonut(): { donut: string; legend: string } {
  // brand color 사용
  const palette: Record<string, string> = {
    samsung: "#1428A0",
    apple: "#F0F0F0",
    nvidia: "#76B900",
    microsoft: "#00A4EF",
    kakao: "#FEE500",
    tesla: "#E82127",
    naver: "#03C75A",
    google: "#4285F4",
    coupang: "#FF3A45",
    coinbase: "#0052FF",
  };
  let offset = 25;
  const C = 100;
  const arcs = stocks.map((s) => {
    const len = s.weight;
    const gap = 0.4;
    const arc = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="${palette[s.brand]}" stroke-width="3.6" stroke-dasharray="${(len - gap).toFixed(2)} ${(C - len + gap).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 18 18)"/>`;
    offset += len;
    return arc;
  });
  const donut = `
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" stroke-width="3.6"/>
        ${arcs.join("")}
        <text x="18" y="17" text-anchor="middle" style="font-family: Inter; font-size: 3.5px; font-weight: 700; fill: var(--fg-primary);">10</text>
        <text x="18" y="21.2" text-anchor="middle" style="font-family: 'JetBrains Mono'; font-size: 1.7px; fill: var(--fg-muted); letter-spacing: 0.08em;">STOCKS</text>
      `;
  const legend = stocks
    .map(
      (s) => `
        <div class="legend-row"><span class="swatch" style="background:${palette[s.brand]}"></span>${s.name}<span class="right num">${s.weight}%</span></div>
      `,
    )
    .join("");
  return { donut, legend };
}

// 헤더 통계
export function buildHeaderStats(data: LinePoint[]): {
  high: string;
  low: string;
  avg: string;
  vol: string;
} {
  const values = data.map((d) => d.value);
  const high = Math.max(...values),
    low = Math.min(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const vol = (
    Math.sqrt(values.map((v) => Math.pow((v - avg) / avg, 2)).reduce((a, b) => a + b, 0) / values.length) * 100
  ).toFixed(2);
  return {
    high: compact(high) + "원",
    low: compact(low) + "원",
    avg: compact(avg) + "원",
    vol: vol + "%",
  };
}

// ========= 차트 빌더 (라인 + tooltip / crosshair) =========
export type ChartOpts = {
  data: LinePoint[];
  height?: number;
  padding?: { l: number; r: number; t: number; b: number };
  showAxisY?: boolean;
  showAxisX?: boolean;
  showBench?: boolean;
  lineColor?: string;
  endLabel?: boolean;
  showVolume?: boolean;
};

type ChartHost = HTMLElement & { _volumes?: number[] };

export function buildChart(host: ChartHost, opts: ChartOpts): void {
  const {
    data,
    height = 200,
    padding = { l: 56, r: 16, t: 18, b: 28 },
    showAxisY = true,
    showAxisX = true,
    showBench = false,
    lineColor = "var(--green)",
    endLabel = true,
    showVolume = false,
  } = opts;

  const W = 800; // logical width
  const H = height;
  const volH = showVolume ? Math.round(H * 0.22) : 0; // 하단 거래량 영역
  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b - volH;

  const all = data.flatMap((d) => (showBench ? [d.value, d.bench] : [d.value]));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min;
  const pad = range * 0.1;
  const yMin = min - pad;
  const yMax = max + pad;
  const xStep = innerW / (data.length - 1);
  const yScale = (v: number) => padding.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const xPos = (i: number) => padding.l + i * xStep;

  const points = data.map((d, i) => [xPos(i), yScale(d.value)] as [number, number]);
  const linePath = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaPath = linePath + ` L${points[points.length - 1][0]},${padding.t + innerH} L${points[0][0]},${padding.t + innerH} Z`;
  const benchPoints: [number, number][] = showBench ? data.map((d, i) => [xPos(i), yScale(d.bench)]) : [];
  const benchPath = benchPoints.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

  // Y축 ticks (5개)
  const yTicks: { v: number; y: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (yMax - yMin) * (1 - i / 4);
    yTicks.push({ v, y: padding.t + (innerH * i) / 4 });
  }
  // X축 ticks (5개)
  const xTickCount = 5;
  const xTicks: { d: Date; x: number }[] = [];
  for (let i = 0; i < xTickCount; i++) {
    const idx = Math.round((data.length - 1) * (i / (xTickCount - 1)));
    xTicks.push({ d: data[idx].date, x: xPos(idx) });
  }

  const endX = points[points.length - 1][0];
  const endY = points[points.length - 1][1];
  const endVal = data[data.length - 1].value;

  // FILL gradient id 고유화
  const gid = "g" + Math.random().toString(36).slice(2, 8);

  // 거래량 mock (가격 변동 크기에 비례)
  const volumes = data.map((d, i) => {
    const change = i === 0 ? 0 : Math.abs(d.value - data[i - 1].value);
    return Math.max(50, change + Math.round(Math.random() * 200000));
  });
  const volMax = Math.max(...volumes);
  const volBaseY = H - padding.b;
  const volTopY = volBaseY - volH + 8;
  const volBars = showVolume
    ? volumes
        .map((v, i) => {
          const x = xPos(i);
          const w = Math.max(2, xStep * 0.65);
          const h = (v / volMax) * (volH - 12);
          const isUp = i === 0 || data[i].value >= data[i - 1].value;
          const fill = isUp ? "rgba(240,68,82,0.32)" : "rgba(59,130,246,0.32)";
          return `<rect x="${(x - w / 2).toFixed(1)}" y="${(volBaseY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${fill}"/>`;
        })
        .join("")
    : "";

  host.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" style="width: 100%; height: ${H}px;">
          <defs>
            <linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${lineColor === "var(--green)" ? "#F04452" : lineColor}" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="${lineColor === "var(--green)" ? "#F04452" : lineColor}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${yTicks
            .map(
              (t, i) => `
            <line class="chart-grid ${i === yTicks.length - 1 ? "zero" : ""}" x1="${padding.l}" x2="${W - padding.r}" y1="${t.y}" y2="${t.y}" />
            ${showAxisY ? `<text class="chart-axis-y" x="${padding.l - 8}" y="${t.y + 3}" text-anchor="end">${compact(Math.round(t.v))}</text>` : ""}
          `,
            )
            .join("")}
          ${xTicks
            .map(
              (t) => `
            ${showAxisX ? `<text class="chart-axis-x" x="${t.x}" y="${H - 8}" text-anchor="middle">${fmtDate(t.d)}</text>` : ""}
          `,
            )
            .join("")}
          ${showBench ? `<path class="chart-bench" d="${benchPath}" />` : ""}
          <path d="${areaPath}" fill="url(#${gid})" />
          <path class="chart-line" d="${linePath}" style="stroke:${lineColor === "var(--green)" ? "#F04452" : lineColor};" />
          ${
            showVolume
              ? `
            <line x1="${padding.l}" x2="${W - padding.r}" y1="${volTopY - 4}" y2="${volTopY - 4}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2 3"/>
            <text class="chart-axis-y" x="${padding.l - 8}" y="${volTopY + 4}" text-anchor="end">VOL</text>
            ${volBars}
          `
              : ""
          }
          <circle class="chart-end-halo" cx="${endX}" cy="${endY}" r="9" />
          <circle class="chart-end-dot" cx="${endX}" cy="${endY}" r="4" />
          ${
            endLabel
              ? (() => {
                  const labelW = 56,
                    labelH = 18,
                    gap = 10;
                  const fitRight = endX + gap + labelW <= W - padding.r;
                  const rectX = fitRight ? endX + gap : endX - gap - labelW;
                  const textX = rectX + labelW / 2;
                  const textY = endY + 4;
                  return `
              <rect x="${rectX}" y="${endY - labelH / 2}" width="${labelW}" height="${labelH}" rx="5" fill="#F04452" />
              <text x="${textX}" y="${textY}" text-anchor="middle" style="font-family: Inter; font-size: 11px; font-weight: 700; fill: #000;">${compact(endVal)}</text>
            `;
                })()
              : ""
          }
          <line class="chart-crosshair" x1="0" x2="0" y1="${padding.t}" y2="${showVolume ? volBaseY : padding.t + innerH}" id="${gid}-cx" />
          <circle class="chart-cursor-dot" cx="0" cy="0" r="4" id="${gid}-cd" />
        </svg>
        <div class="chart-tooltip" id="${gid}-tt"></div>
      `;
  host._volumes = volumes;

  // 호버
  const svg = host.querySelector("svg")!;
  const tt = host.querySelector<HTMLElement>(`#${gid}-tt`)!;
  const cx = host.querySelector<SVGLineElement>(`#${gid}-cx`)!;
  const cd = host.querySelector<SVGCircleElement>(`#${gid}-cd`)!;
  svg.addEventListener("mousemove", (e: MouseEvent) => {
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((px - padding.l) / xStep)));
    const d = data[idx];
    const xx = xPos(idx);
    const yy = yScale(d.value);
    cx.setAttribute("x1", String(xx));
    cx.setAttribute("x2", String(xx));
    cx.style.opacity = "1";
    cd.setAttribute("cx", String(xx));
    cd.setAttribute("cy", String(yy));
    cd.style.opacity = "1";
    const ttLeft = (xx / W) * rect.width + 10;
    const ttTop = (yy / H) * rect.height - 8;
    const benchTxt = showBench
      ? `<div class="t-row"><span class="dot" style="background: var(--fg-muted);"></span><span>KOSPI</span><span class="val">${compact(d.bench)}원</span></div>`
      : "";
    const volTxt = showVolume
      ? `<div class="t-row"><span class="dot" style="background: rgba(255,255,255,0.4);"></span><span>거래량</span><span class="val">${compact(volumes[idx])}</span></div>`
      : "";
    const prevVal = idx > 0 ? data[idx - 1].value : d.value;
    const dailyChange = d.value - prevVal;
    const dailyPct = prevVal ? ((dailyChange / prevVal) * 100).toFixed(2) : "0.00";
    const sign = dailyChange >= 0 ? "+" : "";
    const dailyCls = dailyChange >= 0 ? "pos" : "neg";
    tt.innerHTML = `
          <div class="t-date">${d.date.getFullYear()}.${fmtDate(d.date)}</div>
          <div class="t-row"><span class="dot" style="background: ${lineColor === "var(--green)" ? "#F04452" : lineColor};"></span><span>포트폴리오</span><span class="val">${compact(d.value)}원</span></div>
          <div class="t-row"><span class="dot" style="background: ${dailyChange >= 0 ? "#F04452" : "#3B9EFF"}; opacity: 0.55;"></span><span>일변동</span><span class="val ${dailyCls}">${sign}${dailyPct}%</span></div>
          ${benchTxt}
          ${volTxt}
        `;
    tt.style.left = ttLeft + "px";
    tt.style.top = ttTop + "px";
    tt.style.opacity = "1";
    // 우측 가장자리에서 잘림 방지 — cursor가 차트 우측 절반이면 tooltip을 좌측으로 flip
    const ttRect = tt.getBoundingClientRect();
    const ttW = ttRect.width || 180;
    if (ttLeft + ttW > rect.width - 8) {
      tt.style.left = Math.max(8, (xx / W) * rect.width - ttW - 12) + "px";
    }
  });
  svg.addEventListener("mouseleave", () => {
    cx.style.opacity = "0";
    cd.style.opacity = "0";
    tt.style.opacity = "0";
  });
}
