// FinCoach API client. 백엔드 미구현 단계에서는 mock 응답을 명시적으로 표시한다.

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

type DataSource = "api" | "mock";

type MarketSummaryPayload = {
  collected_at: string;
  market_date: string;
  daily_market_summary: string;
  trending_keywords: { keyword: string; score: number; delta: number }[];
};

type PortfolioSummaryPayload = {
  total_value_krw: number;
  total_pnl_krw: number;
  pnl_pct: number;
  positions: { ticker: string; name: string; weight: number; pnl_pct: number }[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatPayload = { question: string; history: ChatMessage[] };

export type ChatResult = {
  answer: string;
  market_date: string | null;
  portfolio_loaded: boolean;
};

type WithSource<T> = T & { source: DataSource };

type MarketSummary = WithSource<MarketSummaryPayload>;
type PortfolioSummary = WithSource<PortfolioSummaryPayload>;

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  async marketSummary(): Promise<MarketSummary> {
    try {
      const data = await jsonFetch<MarketSummaryPayload>("/market/summary");
      return { ...data, source: "api" };
    } catch {
      return mockMarketSummary();
    }
  },
  async portfolioSummary(): Promise<PortfolioSummary> {
    try {
      const data = await jsonFetch<PortfolioSummaryPayload>("/portfolio/summary");
      return { ...data, source: "api" };
    } catch {
      return mockPortfolioSummary();
    }
  },

  async chat(question: string, history: ChatMessage[]): Promise<ChatResult> {
    const body: ChatPayload = { question, history };
    return jsonFetch<ChatResult>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  async chatStream(
    question: string,
    history: ChatMessage[],
    onDelta: (text: string) => void,
  ): Promise<void> {
    const res = await fetch(`${BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history } satisfies ChatPayload),
    });
    if (!res.ok || !res.body) throw new Error(`API /chat/stream: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") return;
        const parsed = JSON.parse(payload) as { delta?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.delta) onDelta(parsed.delta);
      }
    }
  },
};

function mockMarketSummary(): MarketSummary {
  return {
    collected_at: new Date().toISOString(),
    market_date: new Date().toISOString().slice(0, 10),
    daily_market_summary:
      "오늘 시장은 반도체와 AI 관련주 중심으로 강세. 금리 관련 불확실성은 계속됨.",
    source: "mock",
    trending_keywords: [
      { keyword: "반도체", score: 78, delta: 12 },
      { keyword: "AI", score: 85, delta: 5 },
      { keyword: "금리", score: 61, delta: 9 },
    ],
  };
}

function mockPortfolioSummary(): PortfolioSummary {
  return {
    total_value_krw: 12_350_000,
    total_pnl_krw: 480_000,
    pnl_pct: 4.05,
    source: "mock",
    positions: [
      { ticker: "005930.KS", name: "삼성전자", weight: 32, pnl_pct: 5.2 },
      { ticker: "AAPL", name: "Apple", weight: 22, pnl_pct: 3.1 },
      { ticker: "035720.KS", name: "카카오", weight: 15, pnl_pct: -2.4 },
      { ticker: "NVDA", name: "NVIDIA", weight: 18, pnl_pct: 12.7 },
      { ticker: "035420.KS", name: "NAVER", weight: 13, pnl_pct: -1.1 },
    ],
  };
}
