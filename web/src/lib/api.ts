/* FinCoach API client.
   Dev: Vite proxies /api -> http://localhost:8000 (see vite.config.ts).
   Prod (Cloudflare Pages): no backend at same origin. Set VITE_API_BASE to a
   tunnel URL to enable live data; otherwise every call fails fast and the
   caller falls back to the demo showcase. */

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type DataSource = "live" | "demo";

export interface Position {
  ticker: string;
  name: string;
  weight: number;
  pnl_pct: number;
  current_value_krw: number;
  pnl_krw: number;
}

export interface PortfolioSummary {
  total_value_krw: number;
  total_pnl_krw: number;
  pnl_pct: number;
  positions: Position[];
}

export interface AnalysisReport {
  summary: string;
  portfolio_type: string;
  investor_match: string;
  characteristics: string[];
  strengths: string[];
  risks: string[];
  suggestions: string[];
  market_context_note: string;
  disclaimer: string;
}

export interface TrendingKeyword {
  keyword: string;
  score: number;
  delta: number;
}

export interface MarketSummary {
  collected_at: string;
  market_date: string;
  daily_market_summary: string;
  trending_keywords: TrendingKeyword[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function getJSON<T>(path: string, timeoutMs = 5000): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

export interface HoldingInput {
  ticker: string;
  name: string;
  shares: number;
  avg_price: number;
  currency?: string;
}

async function postJSON<T>(path: string, body: unknown, timeoutMs = 5000): Promise<T> {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`POST ${path} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function getPortfolioSummary(): Promise<PortfolioSummary> {
  return getJSON<PortfolioSummary>("/api/portfolio/summary");
}

export function postPortfolioSummary(holdings: HoldingInput[]): Promise<PortfolioSummary> {
  return postJSON<PortfolioSummary>("/api/portfolio/summary", { holdings });
}

/* The analysis endpoint is an LLM call (cached server-side). Without an API key
   the backend returns a placeholder report (portfolio_type "-", empty lists);
   callers should treat that as "demo" via isLiveAnalysis(). */
export function getPortfolioAnalysis(timeoutMs = 30000): Promise<AnalysisReport> {
  return getJSON<AnalysisReport>("/api/portfolio/analysis", timeoutMs);
}

export function postPortfolioAnalysis(
  holdings: HoldingInput[],
  timeoutMs = 30000,
): Promise<AnalysisReport> {
  return postJSON<AnalysisReport>("/api/portfolio/analysis", { holdings }, timeoutMs);
}

export function isLiveAnalysis(r: AnalysisReport): boolean {
  return Boolean(
    r.portfolio_type && r.portfolio_type !== "-" && (r.strengths.length || r.risks.length),
  );
}

export function getMarketSummary(): Promise<MarketSummary> {
  return getJSON<MarketSummary>("/api/market/summary");
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onError?: (message: string) => void;
  signal?: AbortSignal;
}

/* POST /api/chat/stream — Server-Sent Events over fetch.
   Resolves when the backend sends `data: [DONE]`. Each SSE event is
   `data: {"delta": "..."}` or `data: {"error": "..."}`. Rejects on transport
   failure so the caller can show a demo fallback. */
export async function streamChat(
  question: string,
  history: ChatMessage[],
  handlers: StreamHandlers,
  timeoutMs = 30000,
): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  if (handlers.signal) {
    if (handlers.signal.aborted) ctrl.abort();
    else handlers.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  try {
    const res = await fetch(API_BASE + "/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`POST /api/chat/stream -> HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buf.indexOf("\n\n")) >= 0) {
        const event = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        for (const line of event.split("\n")) {
          const trimmed = line.trimStart();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const ev = JSON.parse(payload) as { delta?: string; error?: string };
            if (ev.error) {
              handlers.onError?.(ev.error);
              return;
            }
            if (ev.delta) handlers.onDelta(ev.delta);
          } catch {
            /* partial / non-JSON line — ignore */
          }
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
