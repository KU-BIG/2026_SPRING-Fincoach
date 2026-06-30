import { useEffect, useRef, useState, useCallback } from "react";
import { streamChat, type ChatMessage, type DataSource, type HoldingInput } from "../lib/api";
import SourceBadge from "../components/SourceBadge";
import { useAuth } from "../auth/context";
import { supabase } from "../lib/supabase";

type Conversation = { id: string; title: string };

export default function Chat() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const aliveRef = useRef(true);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [source, setSource] = useState<DataSource>("demo");
  const { user, loading, configured } = useAuth();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const holdingsRef = useRef<HoldingInput[] | null>(null);

  // 로그인 시 Supabase에서 holdings 로드
  useEffect(() => {
    if (!user || !supabase) {
      holdingsRef.current = null;
      return;
    }
    supabase
      .from("holdings")
      .select("ticker, name, shares, avg_price, currency")
      .then(({ data }) => {
        if (data !== null) {
          holdingsRef.current = data.map((h: { ticker: string; name: string; shares: number; avg_price: number; currency: string }) => ({
            ticker: h.ticker,
            name: h.name,
            shares: h.shares,
            avg_price: h.avg_price,
            currency: h.currency || "KRW",
          }));
        }
      });
  }, [user]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const scrollToBottom = () => {
    const msgs = messagesRef.current;
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  };

  const appendCoachBubble = (): { bubble: HTMLDivElement; content: HTMLSpanElement } => {
    const msgs = messagesRef.current!;
    const bubble = document.createElement("div");
    bubble.className = "bubble coach";
    bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    const content = document.createElement("span");
    content.style.whiteSpace = "pre-wrap";
    msgs.appendChild(bubble);
    scrollToBottom();
    return { bubble, content };
  };

  const swapTypingToContent = (bubble: HTMLDivElement, content: HTMLSpanElement) => {
    bubble.innerHTML = "";
    bubble.appendChild(content);
  };

  const finishCoach = (bubble: HTMLDivElement) => {
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = "FC · 방금";
    bubble.appendChild(meta);
    scrollToBottom();
  };

  const addQuestion = (q: string) => {
    const input = inputRef.current;
    if (!input) return;
    input.value = q;
    input.focus();
  };

  // 로그인 유저의 대화 세션 목록 로드
  const loadConversations = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data && aliveRef.current) {
      setConversations(data);
    }
  }, []);

  // 특정 세션의 메시지 로드
  const loadConversation = useCallback(async (convId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(100);
    const msgs = messagesRef.current;
    if (!msgs || !aliveRef.current) return;
    if (convId !== activeConvIdRef.current) return;
    msgs.innerHTML = "";
    historyRef.current = [];
    if (!data?.length) return;
    for (const msg of data) {
      const bubble = document.createElement("div");
      bubble.className = `bubble ${msg.role === "user" ? "user" : "coach"}`;
      bubble.textContent = msg.content;
      if (msg.role === "assistant") {
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = "FC · 이전";
        bubble.appendChild(meta);
      }
      msgs.appendChild(bubble);
    }
    historyRef.current = data.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    scrollToBottom();
  }, []);

  // 새 대화 세션 생성
  const createConversation = useCallback(async (uid: string): Promise<string | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: uid, title: "새 대화" })
      .select("id")
      .single();
    if (error) {
      console.error("[chat] conversation create failed:", error.message);
      return null;
    }
    return data.id;
  }, []);

  // 로그인 시 최신 세션 목록 + 가장 최근 세션 복원
  useEffect(() => {
    if (!configured || loading || !user || !supabase) return;
    (async () => {
      await loadConversations(user.id);
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0 && aliveRef.current) {
        setActiveConvId(data[0].id);
        await loadConversation(data[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading, configured]);

  // 사이드바 세션 클릭
  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    await loadConversation(convId);
  };

  // 새 대화 버튼
  const startNewConversation = async () => {
    const currentUser = userRef.current;
    const msgs = messagesRef.current;
    if (msgs) msgs.innerHTML = "";
    historyRef.current = [];
    setSource("demo");

    if (currentUser && supabase) {
      const newId = await createConversation(currentUser.id);
      if (newId && aliveRef.current) {
        setActiveConvId(newId);
        setConversations((prev) => [{ id: newId, title: "새 대화" }, ...prev]);
      }
    } else {
      setActiveConvId(null);
    }
  };

  const sendMessage = () => {
    const input = inputRef.current;
    const msgs = messagesRef.current;
    if (!input || !msgs || sendingRef.current) return;
    const text = input.value.trim();
    if (!text) return;

    const bub = document.createElement("div");
    bub.className = "bubble user";
    bub.textContent = text;
    const typing = msgs.querySelector(".bubble.coach .typing");
    if (typing) typing.parentElement!.remove();
    msgs.appendChild(bub);
    input.value = "";
    scrollToBottom();

    sendingRef.current = true;
    setSending(true);
    const prior = [...historyRef.current];
    const isFirstMsg = prior.length === 0;
    const { bubble, content } = appendCoachBubble();
    let acc = "";
    let swapped = false;

    const onText = (delta: string) => {
      acc += delta;
      if (!swapped) {
        swapTypingToContent(bubble, content);
        swapped = true;
      }
      content.textContent = acc;
      scrollToBottom();
    };

    streamChat(text, prior, {
      onDelta: onText,
      onError: (msg) => {
        onText(`\n\n(응답 오류: ${msg})`);
      },
    }, 30000, holdingsRef.current ?? undefined)
      .then(async () => {
        const isDemo = acc.includes("[데모 모드]") || acc === "";
        if (aliveRef.current) setSource(isDemo ? "demo" : "live");
        if (!swapped) {
          swapTypingToContent(bubble, content);
          content.textContent =
            "지금은 데모 모드예요. 백엔드를 연결하면 실시간으로 답해드릴게요.";
        }
        historyRef.current = [
          ...prior,
          { role: "user", content: text },
          { role: "assistant", content: acc },
        ];
        const currentUser = userRef.current;
        let convId = activeConvIdRef.current;

        if (currentUser && supabase && acc) {
          // 세션이 없으면 새로 생성
          if (!convId) {
            convId = await createConversation(currentUser.id);
            if (convId) {
              setActiveConvId(convId);
              setConversations((prev) => [{ id: convId!, title: "새 대화" }, ...prev]);
            }
          }
          if (convId) {
            const updates: { title?: string; updated_at: string } = {
              updated_at: new Date().toISOString(),
            };
            if (isFirstMsg) updates.title = text.slice(0, 20);
            supabase
              .from("conversations")
              .update(updates)
              .eq("id", convId)
              .then(({ error }) => {
                if (error) {
                  console.error("[chat] conv update failed:", error.message);
                } else {
                  if (isFirstMsg && aliveRef.current) {
                    setConversations((prev) =>
                      prev.map((c) => (c.id === convId ? { ...c, title: updates.title! } : c))
                    );
                  }
                  loadConversations(currentUser.id);
                }
              });
            supabase
              .from("chat_messages")
              .insert([
                { user_id: currentUser.id, conversation_id: convId, role: "user" as const, content: text },
                { user_id: currentUser.id, conversation_id: convId, role: "assistant" as const, content: acc },
              ])
              .then(({ error }) => {
                if (error) console.error("[chat] DB insert failed:", error.message);
              });
          }
        }
        finishCoach(bubble);
      })
      .catch(() => {
        if (!swapped) swapTypingToContent(bubble, content);
        content.textContent =
          "지금은 데모 모드로 동작 중이에요. 백엔드(API)를 연결하면 보유 종목과 시장을 함께 보고 실시간으로 답해드립니다.";
        if (aliveRef.current) setSource("demo");
        finishCoach(bubble);
      })
      .finally(() => {
        sendingRef.current = false;
        if (aliveRef.current) setSending(false);
      });
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") sendMessage();
    };
    input.addEventListener("keydown", onKeyDown);
    return () => input.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-head reveal">
        <div>
          <div className="caption">AI COACH / SESSION</div>
          <h1 style={{ marginTop: "6px" }}>코치에게 묻기</h1>
        </div>
        <span className="context-card">
          <span className="dot"></span>포트폴리오 컨텍스트 연결됨
        </span>
      </div>

      <div className="chat-layout">
        {/* SIDEBAR */}
        <aside className="card sidebar reveal">
          <button className="new-chat" onClick={() => startNewConversation()}>
            + 새 대화
          </button>

          <div className="side-label">최근 대화</div>
          <div className="side-list">
            {user && conversations.length > 0 ? (
              conversations.map((conv) => (
                <a
                  key={conv.id}
                  href="#"
                  className={conv.id === activeConvId ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    selectConversation(conv.id);
                  }}
                >
                  {conv.title}
                </a>
              ))
            ) : (
              <>
                {[
                  "PER이 높으면 무슨 의미예요?",
                  "반도체 사이클 어디쯤일까요?",
                  "환율이 떨어지면 어떻게 되나요?",
                  "NVIDIA 비중을 더 늘려도 될까요?",
                ].map((q) => (
                  <a
                    key={q}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      addQuestion(q);
                    }}
                  >
                    {q}
                  </a>
                ))}
              </>
            )}
          </div>

          <div className="side-label">자주 묻는 질문</div>
          <div>
            <div className="sample-q" onClick={() => addQuestion("PER이 높으면 무슨 의미예요?")}>
              PER이 높으면 무슨 의미예요?
            </div>
            <div className="sample-q" onClick={() => addQuestion("내 포트폴리오 리스크는 뭐예요?")}>
              내 포트폴리오 리스크는 뭐예요?
            </div>
            <div className="sample-q" onClick={() => addQuestion("반도체 비중을 늘려도 될까요?")}>
              반도체 비중을 늘려도 될까요?
            </div>
            <div className="sample-q" onClick={() => addQuestion("백테스트는 어떻게 보나요?")}>
              백테스트는 어떻게 보나요?
            </div>
          </div>
        </aside>

        {/* MAIN CHAT */}
        <section className="card chat-main reveal" style={{ transitionDelay: "100ms" }}>
          <div className="chat-top">
            <div className="info">
              <div className="av">FC</div>
              <div>
                <div className="ttl">FinCoach</div>
                <div className="sub">AI · CLAUDE HAIKU 4.5 · KO</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <SourceBadge source={source} liveLabel="실시간 응답" demoLabel="데모 응답" />
              <button
                className="nav-ghost"
                style={{ padding: "5px 12px", fontSize: "12px" }}
                onClick={() => startNewConversation()}
              >
                대화 비우기
              </button>
            </div>
          </div>

          <div className="messages" id="messages" ref={messagesRef}>
            <div className="bubble user">PER이 높으면 무슨 의미예요?</div>
            <div className="bubble coach">
              <b>PER(주가수익비율)</b>은 주가를 EPS(주당순이익)으로 나눈 값으로, 한 주가 1년치 이익의
              몇 배에 거래되는지 나타내요. 일반적으로 PER이 높다는 건 시장이 그 종목의 미래 성장을
              크게 기대하고 있다는 신호예요.
              <br />
              <br />
              보유 중인 <b>NVIDIA</b>는 현재 PER이 시장 평균보다 높아요. AI 인프라 수요가 빠르게
              늘면서 이익이 지속적으로 성장할 거란 기대가 반영된 결과예요.
              <br />
              <br />
              다만 PER만 보지 말고 <b>ROE, 매출 성장률, 동종 업계 평균</b>도 함께 비교하는 게 좋아요.
              <div className="meta">FC · 9초 전</div>
            </div>
            <div className="bubble user">반도체 비중이 큰가요?</div>
            <div className="bubble coach">
              현재 보유 종목 중 반도체 관련주는 <b>삼성전자(32%)</b>와 <b>NVIDIA(18%)</b>로 합산{" "}
              <b>50%</b>예요. 단일 섹터 비중으로는 다소 높은 편이에요.
              <br />
              <br />
              지금 반도체 사이클 회복 신호가 누적되는 국면이라 단기 기대는 있지만, 사이클이 하강
              국면에 진입하면 두 종목이 동시에 흔들릴 위험이 있어요.
              <div className="meta">FC · 4초 전</div>
            </div>
          </div>

          <div className="input-bar">
            <input
              type="text"
              id="msgInput"
              ref={inputRef}
              placeholder="질문을 입력하세요"
              disabled={sending}
            />
            <button onClick={() => sendMessage()} disabled={sending} aria-busy={sending}>
              {sending ? "전송 중…" : "보내기"}
            </button>
          </div>
          <div className="disclaimer-bar">
            본 응답은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </div>
        </section>
      </div>
    </>
  );
}
