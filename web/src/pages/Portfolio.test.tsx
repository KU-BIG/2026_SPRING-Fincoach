import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "../auth/context";
import Portfolio from "./Portfolio";

const mockAuth: AuthContextValue = {
  configured: false,
  session: null,
  user: null,
  loading: false,
  signUp: async () => ({ error: null, needsConfirm: false }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  openAuth: () => {},
  closeAuth: () => {},
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>{children}</MemoryRouter>
    </AuthContext.Provider>
  );
}

/* 데모 모드(?demo=1) + 로그인 유저: 폼은 숨고 예시 쇼케이스는 블러 없이 보여야 한다 */
function DemoLoggedInWrapper({ children }: { children: ReactNode }) {
  const loggedIn: AuthContextValue = {
    ...mockAuth,
    configured: true,
    user: { id: "u1" } as AuthContextValue["user"],
  };
  return (
    <AuthContext.Provider value={loggedIn}>
      <MemoryRouter initialEntries={["/portfolio?demo=1"]}>{children}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("Portfolio (verbatim /site/portfolio.html 이식)", () => {
  afterEach(() => cleanup());

  it("page-head·KPI 카피와 면책 문구를 그대로 렌더한다", () => {
    render(<Portfolio />, { wrapper: Wrapper });
    expect(screen.getByText("내 포트폴리오")).toBeInTheDocument();
    expect(screen.getByText("보유 종목 상세")).toBeInTheDocument();
    expect(screen.getByText("비중 분포")).toBeInTheDocument();
    expect(screen.getByText("정보 제공 목적이며, 투자 권유가 아닙니다.")).toBeInTheDocument();
  });

  it("보유 종목 표·도넛·차트가 동적으로 주입된다", () => {
    const { container } = render(<Portfolio />, { wrapper: Wrapper });
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
    const { container } = render(<Portfolio />, { wrapper: Wrapper });
    const firstRow = container.querySelector<HTMLElement>(".stock-tr")!;
    fireEvent.click(firstRow);
    expect(firstRow.classList.contains("open")).toBe(true);
    const panel = container.querySelector("#ep0")!;
    expect(panel.classList.contains("show")).toBe(true);
    expect(panel.innerHTML).toContain("매수 평균가");
  });

  it("데모 모드(?demo=1)에서는 배너를 보이고 로그인 폼을 숨기며 쇼케이스를 블러 없이 렌더한다", () => {
    const { container } = render(<Portfolio />, { wrapper: DemoLoggedInWrapper });
    // 데모 배너
    expect(screen.getByText("데모 모드")).toBeInTheDocument();
    expect(screen.getByText("내 포트폴리오 만들기")).toBeInTheDocument();
    // 로그인 유저여도 데모 모드면 입력 폼이 숨겨진다
    expect(screen.queryByText("내 종목 입력")).toBeNull();
    // 예시 쇼케이스(차트/표)는 그대로 렌더된다
    const tbody = container.querySelector("#stockTable");
    expect(tbody!.innerHTML).toContain("삼성전자");
    // 게이트 블러가 즉시 걸리지 않는다(gateActive 초기 false). 쇼케이스 래퍼에 blur 없음
    const blurred = Array.from(container.querySelectorAll<HTMLElement>("div")).some(
      (d) => d.style.filter.includes("blur"),
    );
    expect(blurred).toBe(false);
  });

  it("자동완성: 티커 칸에 '삼성' 입력 시 카탈로그 항목이 드롭다운으로 뜬다", () => {
    const loggedIn: AuthContextValue = {
      ...mockAuth,
      configured: true,
      user: { id: "u1" } as AuthContextValue["user"],
    };
    render(
      <AuthContext.Provider value={loggedIn}>
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    const tickerInput = screen.getByPlaceholderText("종목명·티커 검색 (예: 삼성, AAPL)");
    fireEvent.change(tickerInput, { target: { value: "삼성" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    const samsung = options.find((o) => o.textContent?.includes("삼성전자"))!;
    expect(samsung).toBeTruthy();
    // 항목 선택 시 ticker 가 채워진다
    fireEvent.mouseDown(samsung);
    expect((tickerInput as HTMLInputElement).value).toBe("005930.KS");
  });
});
