import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage } from "@/lib/api";

type Msg = ChatMessage;

const GREETING =
  "안녕하세요. FinCoach 학습 도우미입니다. 시장 개념, 포트폴리오, 종목에 대해 물어보세요. 매수/매도 직접 추천은 하지 않습니다.";

const SAMPLES = [
  "PER이 높으면 무슨 의미인가요?",
  "내 포트폴리오의 리스크는 뭐예요?",
  "반도체 섹터 비중을 더 늘려도 될까요?",
];

export default function Chat() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
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
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      <section className="col-span-12">
        <p className="caption">학습 코치</p>
        <h1 className="display mt-2 text-[44px] sm:text-[56px]">코치</h1>
        <p className="mt-3 max-w-2xl text-base text-fg-secondary">
          시장 개념과 내 포트폴리오에 대한 질문을 풀어드립니다. 정보 제공 목적입니다.
        </p>
      </section>

      <aside className="col-span-12 lg:col-span-3">
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <button
            onClick={() => setMessages([{ role: "assistant", content: GREETING }])}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            새 대화
          </button>
          <p className="caption mt-6">예시 질문</p>
          <ul className="mt-3 space-y-1">
            {SAMPLES.map((s) => (
              <li key={s}>
                <button
                  onClick={() => setInput(s)}
                  className="w-full rounded-sm px-2 py-2 text-left text-sm text-fg-secondary transition hover:bg-bg-muted hover:text-fg-primary"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="col-span-12 flex h-[68vh] flex-col rounded-xl border border-border bg-bg-base p-7 lg:col-span-9">
        <div className="flex-1 space-y-5 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div key={i} className="flex gap-3">
              <div className="caption w-12 shrink-0 pt-1">
                {m.role === "user" ? "나" : "코치"}
              </div>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-fg"
                    : "max-w-[80%] whitespace-pre-wrap text-[15px] leading-7 text-fg-primary"
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <div className="caption w-12 shrink-0 pt-1">코치</div>
              <div className="text-sm text-fg-muted">입력 중…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            aria-label="질문 입력"
            placeholder="질문을 입력하세요. 예: PER이 뭐예요?"
            className="flex-1 rounded-md border border-border bg-bg-base px-4 py-3 text-sm outline-none transition focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
          >
            보내기
          </button>
        </div>
      </section>
    </div>
  );
}
