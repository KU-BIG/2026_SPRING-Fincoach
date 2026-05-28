import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a demo data badge when API fallback data is rendered", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<Dashboard />);

    expect(await screen.findByText("데모 데이터")).toBeInTheDocument();
  });
});
