import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Chat from "./Chat";

describe("Chat (verbatim /site/chat.html 이식)", () => {
  afterEach(() => cleanup());

  it("초기 메시지·면책 문구를 그대로 렌더한다", () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    expect(screen.getByText("코치에게 묻기")).toBeInTheDocument();
    expect(screen.getByText("포트폴리오 컨텍스트 연결됨")).toBeInTheDocument();
    expect(
      screen.getByText("본 응답은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("자주 묻는 질문을 클릭하면 입력창에 채워진다", () => {
    const { container } = render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    const sample = screen.getByText("백테스트는 어떻게 보나요?");
    fireEvent.click(sample);
    const input = container.querySelector<HTMLInputElement>("#msgInput")!;
    expect(input.value).toBe("백테스트는 어떻게 보나요?");
  });

  it("보내기를 누르면 user 버블이 추가된다", () => {
    const { container } = render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>,
    );
    const input = container.querySelector<HTMLInputElement>("#msgInput")!;
    fireEvent.change(input, { target: { value: "테스트 질문" } });
    fireEvent.click(screen.getByText("보내기"));
    const msgs = container.querySelector("#messages")!;
    expect(msgs.textContent).toContain("테스트 질문");
    expect(input.value).toBe("");
  });
});
