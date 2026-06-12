import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./Home";

describe("Home (verbatim /site/ 이식)", () => {
  afterEach(() => cleanup());

  it("hero 헤드라인·서브카피를 그대로 렌더한다", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    // hero 헤드라인 단어
    expect(screen.getByText("보유")).toBeInTheDocument();
    expect(screen.getByText("같이")).toBeInTheDocument();
    expect(screen.getByText("읽어드립니다.")).toBeInTheDocument();
    // trust-strip 데이터 소스
    expect(screen.getByText("Anthropic Claude")).toBeInTheDocument();
    // CTA 카피
    expect(screen.getByText("자주 묻는 질문")).toBeInTheDocument();
  });

  it("종목 리스트(ppGrid/featPort)에 하드코딩 종목명이 들어간다", () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const grid = container.querySelector("#ppGrid");
    expect(grid).not.toBeNull();
    expect(grid!.innerHTML).toContain("삼성전자");
    expect(grid!.innerHTML).toContain("NVIDIA");
    const feat = container.querySelector("#featPort");
    expect(feat).not.toBeNull();
    expect(feat!.innerHTML).toContain("NAVER");
    // sparkline SVG 가 주입됐는지
    expect(grid!.querySelector("svg.spark")).not.toBeNull();
  });
});
