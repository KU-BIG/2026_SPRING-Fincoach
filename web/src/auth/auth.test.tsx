import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./context";

function Opener() {
  const { openAuth } = useAuth();
  return (
    <button onClick={() => openAuth("login")} data-testid="open">
      open
    </button>
  );
}

describe("Auth modal", () => {
  afterEach(() => cleanup());

  it("openAuth 로 로그인 모달이 열리고 로그인↔가입 전환된다", () => {
    render(
      <AuthProvider>
        <Opener />
      </AuthProvider>,
    );
    // 처음엔 모달 없음
    expect(screen.queryByText("다시 오셨네요")).toBeNull();

    fireEvent.click(screen.getByTestId("open"));
    // 로그인 모달
    expect(screen.getByText("다시 오셨네요")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

    // 가입으로 전환
    fireEvent.click(screen.getByRole("button", { name: "가입하기" }));
    expect(screen.getByText("지금 시작하기")).toBeInTheDocument();
  });

  it("빈 입력 제출 시 검증 메시지를 보여준다", () => {
    render(
      <AuthProvider>
        <Opener />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByTestId("open"));
    // 로그인 모드 제출 버튼 (switch 링크 '가입하기'와 구분 위해 submit 타입)
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(screen.getByText("이메일과 비밀번호를 입력해주세요.")).toBeInTheDocument();
  });
});
