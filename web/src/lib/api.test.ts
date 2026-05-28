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
