import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage } from "@/lib/api";

type Msg = ChatMessage;

const GREETING =
  "안녕하세요. 시장 개념, 보유 포트폴리오, 종목에 관한 질문을 받습니다. 매수 또는 매도에 대한 직접 추천은 제공하지 않습니다.";

const SAMPLES = [
  "PER이 높다는 것은 어떤 의미인가요?",
  "현재 포트폴리오의 주요 리스크는 무엇인가요?",
  "반도체 섹터 비중을 확대해도 괜찮을까요?",
];

const STORAGE_KEY = "fincoach-chat-history";
const MAX_MESSAGES = 100;

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [{ role: "assistant", content: GREETING }];
    const parsed = JSON.parse(raw) as Msg[];
    return parsed.length > 0 ? parsed : [{ role: "assistant", content: GREETING }];
  } catch {
    return [{ role: "assistant", content: GREETING }];
  }
}

export default function Chat() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
    } catch {
      // 쿼터 초과 또는 프라이빗 모드 등 write 실패는 무시
    }
  }, [messages]);

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
    <div className="space-y-4">
      <h1 className="headline text-xl">AI 코치</h1>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-lg border border-border bg-bg-surface p-5">
            <button
              onClick={() => {
                setMessages([{ role: "assistant", content: GREETING }]);
                try { localStorage.removeItem(STORAGE_KEY); } catch { /* 쿼터/프라이빗 모드 무시 */ }
              }}
              className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              새 대화
            </button>
            <p className="caption mt-5">추천 질문</p>
            <ul className="mt-2 space-y-1">
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

        <section className="col-span-12 flex h-[68vh] flex-col rounded-lg border border-border bg-bg-base p-6 lg:col-span-9">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg"
                      : "max-w-[85%] whitespace-pre-wrap rounded-lg bg-bg-muted px-4 py-2.5 text-[15px] leading-7 text-fg-primary"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-bg-muted px-4 py-2.5 text-sm text-fg-muted">
                  응답 생성 중
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 flex gap-2 border-t border-border pt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              aria-label="질문 입력"
              placeholder="질문을 입력하세요"
              className="flex-1 rounded-md border border-border bg-bg-base px-4 py-2.5 text-sm outline-none transition focus:border-accent disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
            >
              보내기
            </button>
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            본 응답은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
