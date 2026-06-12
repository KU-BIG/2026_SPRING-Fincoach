import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import Learn from "./Learn";

describe("Learn (verbatim /site/learn.html 이식)", () => {
  beforeAll(() => {
    // jsdom 은 scrollTo 미구현 — TOC 클릭 핸들러가 호출하므로 stub
    window.scrollTo = () => {};
  });
  afterEach(() => cleanup());

  it("초기 PER 용어와 면책 문구를 그대로 렌더한다", () => {
    render(
      <MemoryRouter>
        <Learn />
      </MemoryRouter>,
    );
    expect(screen.getByText("금융 용어")).toBeInTheDocument();
    expect(screen.getByText("관련 종목 · 삼성전자 12.5배")).toBeInTheDocument();
    expect(
      screen.getByText("본 자료는 정보 제공 목적이며, 투자 권유에 해당하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("TOC 항목을 클릭하면 본문이 해당 용어로 교체된다", () => {
    const { container } = render(
      <MemoryRouter>
        <Learn />
      </MemoryRouter>,
    );
    const fxLink = container.querySelector<HTMLAnchorElement>('.toc-list a[data-key="fx"]')!;
    fireEvent.click(fxLink);
    const article = container.querySelector("#article")!;
    expect(article.querySelector("h2")!.textContent).toBe("환율");
    expect(fxLink.classList.contains("active")).toBe(true);
    // rel 이 없는 용어는 related 배지가 없다
    expect(article.querySelector(".related")).toBeNull();
  });
});
