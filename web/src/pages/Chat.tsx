import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage } from "@/lib/api";

type Msg = ChatMessage;

const SUGGESTED = [
  "PER이 높으면 무슨 의미인가요?",
  "내 포트폴리오의 리스크는 뭐예요?",
  "반도체 섹터 비중을 더 늘려도 될까요?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "안녕하세요. FinCoach 학습 도우미입니다. 시장 개념, 포트폴리오, 종목에 대해 물어보세요. 매수/매도 직접 추천은 하지 않습니다.",
};

export default function Chat() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question || loading) return;

    const userMsg: Msg = { role: "user", content: question };
    const nextMessages = [...messages, userMsg];
    const assistantIdx = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const prev = nextMessages.slice(0, -1);
    const firstUserIdx = prev.findIndex((m) => m.role === "user");
    const history = firstUserIdx >= 0 ? prev.slice(firstUserIdx) : [];

    try {
      await api.chatStream(question, history, (delta) => {
        setMessages((cur) => {
          const next = [...cur];
          next[assistantIdx] = {
            role: "assistant",
            content: (next[assistantIdx]?.content ?? "") + delta,
          };
          return next;
        });
      });
    } catch {
      setMessages((cur) => {
        const next = [...cur];
        next[assistantIdx] = {
          role: "assistant",
          content: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <p className="caption">코치에게 묻기</p>
        <h2 className="serif mt-1 text-xl font-semibold">대화</h2>
        <button
          onClick={() => setMessages([GREETING])}
          className="mt-5 w-full rounded-md border border-fg-primary bg-fg-primary px-3 py-2 text-sm text-bg-base transition hover:opacity-90"
        >
          새 대화 시작
        </button>
        <div className="mt-8">
          <p className="caption">이런 질문은 어떨까요</p>
          <ul className="mt-3 space-y-2 text-sm">
            {SUGGESTED.map((q) => (
              <li key={q}>
                <button
                  onClick={() => setInput(q)}
                  className="block w-full text-left text-fg-secondary transition hover:text-accent"
                >
                  · {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="lg:col-span-9">
        <p className="caption">코치</p>
        <h1 className="serif mt-1 text-3xl font-semibold leading-tight">
          시장과 내 포트폴리오를 함께 짚어요
        </h1>

        <div className="mt-8 flex h-[68vh] flex-col border border-border bg-bg-surface">
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <p className="caption">{m.role === "user" ? "나" : "코치"}</p>
                <p
                  className={
                    "mt-2 inline-block max-w-[85%] whitespace-pre-wrap text-[15px] leading-[1.75] " +
                    (m.role === "user"
                      ? "border-l-2 border-accent pl-3 text-fg-primary"
                      : "text-fg-primary")
                  }
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.content === "" && (
              <p className="text-sm text-fg-muted">입력 중…</p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input.trim())}
                disabled={loading}
                aria-label="질문 입력"
                placeholder="질문을 입력하세요…"
                className="flex-1 rounded-md border border-border bg-bg-base px-3 py-2 text-[15px] outline-none transition focus:border-accent disabled:opacity-50"
              />
              <button
                onClick={() => send(input.trim())}
                disabled={loading}
                className="rounded-md border border-accent bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
              >
                보내기
              </button>
            </div>
            <p className="caption mt-3">정보 제공 · 투자 권유 아님</p>
          </div>
        </div>
      </section>
    </div>
  );
}
