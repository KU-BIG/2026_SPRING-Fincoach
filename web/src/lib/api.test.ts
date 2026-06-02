import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api mock fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks market fallback data as mock", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(api.marketSummary()).resolves.toMatchObject({ source: "mock" });
  });

  it("marks portfolio fallback data as mock", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(api.portfolioSummary()).resolves.toMatchObject({ source: "mock" });
  });
});

describe("api.chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns answer from server", async () => {
    const mockResult = { answer: "답변입니다.", market_date: "2026-05-31", portfolio_loaded: true };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => mockResult }),
    );

    const result = await api.chat("삼성전자 어때?", []);
    expect(result.answer).toBe("답변입니다.");
    expect(result.portfolio_loaded).toBe(true);
  });

  it("sends history in request body", async () => {
    const mockResult = { answer: "ok", market_date: null, portfolio_loaded: false };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResult });
    vi.stubGlobal("fetch", fetchMock);

    await api.chat("질문", [{ role: "user", content: "이전 질문" }]);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.history).toHaveLength(1);
    expect(body.question).toBe("질문");
  });
});
