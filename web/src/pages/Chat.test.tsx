import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Chat from "./Chat";

const STORAGE_KEY = "fincoach-chat-history";

vi.mock("@/lib/api", () => ({
  api: {
    chatStream: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Chat localStorage 영속화", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("마운트 시 저장된 히스토리를 불러옴", () => {
    const history = [
      { role: "assistant", content: "안녕하세요." },
      { role: "user", content: "삼성전자 어때?" },
      { role: "assistant", content: "정보 제공 목적으로 안내드립니다." },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    render(<Chat />);

    expect(screen.getByText("삼성전자 어때?")).toBeTruthy();
    expect(screen.getByText("정보 제공 목적으로 안내드립니다.")).toBeTruthy();
  });

  it("localStorage가 비어있으면 인사 메시지로 시작함", () => {
    render(<Chat />);
    expect(screen.getByText(/시장 개념, 보유 포트폴리오/)).toBeTruthy();
  });

  it("localStorage가 깨진 JSON이면 인사 메시지로 안전하게 시작함", () => {
    localStorage.setItem(STORAGE_KEY, "{ invalid json");
    render(<Chat />);
    expect(screen.getByText(/시장 개념, 보유 포트폴리오/)).toBeTruthy();
  });

  it("새 대화 버튼 클릭 시 storage를 초기화함", async () => {
    const history = [
      { role: "user", content: "이전 질문" },
      { role: "assistant", content: "이전 답변" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    render(<Chat />);
    expect(screen.getByText("이전 질문")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByText("새 대화"));
    });

    expect(screen.queryByText("이전 질문")).toBeNull();
    // 초기화 후 useEffect가 인사 메시지만 저장 — 이전 대화는 없어야 함
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as { role: string }[];
    expect(stored.every((m) => m.role === "assistant")).toBe(true);
    expect(stored.length).toBe(1);
  });

  it("unmount 후 remount 시 메시지가 유지됨", async () => {
    const history = [
      { role: "assistant", content: "안녕하세요." },
      { role: "user", content: "PER이란?" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    const { unmount } = render(<Chat />);
    expect(screen.getByText("PER이란?")).toBeTruthy();

    unmount();

    render(<Chat />);
    expect(screen.getByText("PER이란?")).toBeTruthy();
  });
});
