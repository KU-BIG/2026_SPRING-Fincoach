import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Portfolio from "./Portfolio";

describe("Portfolio (verbatim /site/portfolio.html 이식)", () => {
  afterEach(() => cleanup());

  it("page-head·KPI 카피와 면책 문구를 그대로 렌더한다", () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );
    expect(screen.getByText("내 포트폴리오")).toBeInTheDocument();
    expect(screen.getByText("보유 종목 상세")).toBeInTheDocument();
    expect(screen.getByText("비중 분포")).toBeInTheDocument();
    expect(screen.getByText("정보 제공 목적이며, 투자 권유가 아닙니다.")).toBeInTheDocument();
  });

  it("보유 종목 표·도넛·차트가 동적으로 주입된다", () => {
    const { container } = render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );
    const tbody = container.querySelector("#stockTable");
    expect(tbody).not.toBeNull();
    expect(tbody!.innerHTML).toContain("삼성전자");
    expect(tbody!.innerHTML).toContain("Coinbase");
    // 종목 행 sparkline SVG
    expect(tbody!.querySelector("svg.spark")).not.toBeNull();
    // 도넛 + legend
    const legend = container.querySelector("#donutLegend");
    expect(legend!.innerHTML).toContain("NVIDIA");
    expect(container.querySelector("#donutChart circle")).not.toBeNull();
    // 라인 차트 svg
    expect(container.querySelector("#lineChart svg")).not.toBeNull();
  });

  it("종목 행을 클릭하면 상세 패널이 펼쳐진다", () => {
    const { container } = render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );
    const firstRow = container.querySelector<HTMLElement>(".stock-tr")!;
    fireEvent.click(firstRow);
    expect(firstRow.classList.contains("open")).toBe(true);
    const panel = container.querySelector("#ep0")!;
    expect(panel.classList.contains("show")).toBe(true);
    expect(panel.innerHTML).toContain("매수 평균가");
  });
});
