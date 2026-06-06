import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { api, type ChatMessage } from "@/lib/api";

type Msg = ChatMessage;

export default function Chat() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "안녕하세요. FinCoach 학습 도우미입니다. 시장 개념, 포트폴리오, 종목에 대해 물어보세요. 매수/매도 직접 추천은 하지 않습니다.",
    },
  ]);
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
    // placeholder for streaming assistant reply
    const assistantIdx = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    // Anthropic API requires messages to start with "user" — strip leading assistant greeting
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <h3 className="mb-3 text-sm font-semibold">대화</h3>
        <button
          onClick={() => setMessages([{
            role: "assistant",
            content: "안녕하세요. FinCoach 학습 도우미입니다. 시장 개념, 포트폴리오, 종목에 대해 물어보세요. 매수/매도 직접 추천은 하지 않습니다.",
          }])}
          className="w-full rounded-sm bg-accent px-3 py-2 text-sm text-accent-fg transition hover:opacity-90"
        >
          + 새 대화
        </button>
        <ul className="mt-4 space-y-1 text-sm">
          <li className="rounded-sm bg-bg-muted px-2 py-1.5">오늘 시장 브리핑</li>
          <li className="px-2 py-1.5 text-fg-secondary">PER이 뭐예요?</li>
          <li className="px-2 py-1.5 text-fg-secondary">반도체 섹터 비중</li>
        </ul>
      </Card>

      <Card className="flex h-[70vh] flex-col lg:col-span-3">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] rounded-md bg-accent px-3 py-2 text-sm text-accent-fg"
                  : "max-w-[80%] whitespace-pre-wrap rounded-md bg-bg-muted px-3 py-2 text-sm"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.content === "" && (
            <div className="max-w-[80%] rounded-md bg-bg-muted px-3 py-2 text-sm text-fg-muted">
              입력 중…
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
            placeholder="질문을 입력하세요. 예: PER이 뭐예요?"
            className="flex-1 rounded-sm border border-border bg-bg-base px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-sm bg-accent px-4 py-2 text-sm text-accent-fg transition hover:opacity-90 disabled:opacity-50"
          >
            보내기
          </button>
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          FinCoach는 정보 제공 도구입니다. 특정 종목의 매수/매도를 추천하지 않습니다.
        </p>
      </Card>
    </div>
  );
}
