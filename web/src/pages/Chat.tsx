import { useEffect, useRef } from "react";

/* /site/chat.html <main class="page-pad"> 를 그대로(verbatim) 이식.
   page-head / chat-layout(sidebar + chat-main) / 메시지 / 입력창 / 면책.
   인라인 <script> 의 addQuestion / sendMessage / Enter 키 핸들러를 그대로 이식한다.
   메시지 추가는 원본과 동일하게 DOM API(createElement)로 append 한다(출력 동일). */
export default function Chat() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // 자주 묻는 질문 클릭 → 입력창에 채우고 포커스
  const addQuestion = (q: string) => {
    const input = inputRef.current;
    if (!input) return;
    input.value = q;
    input.focus();
  };

  // 보내기 → user 버블 추가 + 0.4s 뒤 코치 타이핑 버블 추가 (원본 시뮬레이션 그대로)
  const sendMessage = () => {
    const input = inputRef.current;
    const msgs = messagesRef.current;
    if (!input || !msgs) return;
    const text = input.value.trim();
    if (!text) return;
    const bub = document.createElement("div");
    bub.className = "bubble user";
    bub.textContent = text;
    // remove existing typing
    const typing = msgs.querySelector(".bubble.coach .typing");
    if (typing) typing.parentElement!.remove();
    msgs.appendChild(bub);
    input.value = "";
    // simulate response
    setTimeout(() => {
      const reply = document.createElement("div");
      reply.className = "bubble coach";
      reply.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
      msgs.appendChild(reply);
      msgs.scrollTop = msgs.scrollHeight;
    }, 400);
    msgs.scrollTop = msgs.scrollHeight;
  };

  // Enter 키로 전송 (원본 keydown 핸들러 그대로)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") sendMessage();
    };
    input.addEventListener("keydown", onKeyDown);
    return () => input.removeEventListener("keydown", onKeyDown);
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
          <button className="new-chat">+ 새 대화</button>

          <div className="side-label">최근 대화</div>
          <div className="side-list">
            <a href="#" className="active">
              PER이 높으면 무슨 의미예요?
            </a>
            <a href="#">반도체 사이클 어디쯤일까요?</a>
            <a href="#">환율이 떨어지면 어떻게 되나요?</a>
            <a href="#">NVIDIA 비중을 더 늘려도 될까요?</a>
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
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="nav-ghost" style={{ padding: "5px 12px", fontSize: "12px" }}>
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
            <div className="bubble user">방어주 비중을 어떻게 늘릴까요?</div>
            <div className="bubble coach">
              <span className="typing">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>

          <div className="input-bar">
            <input type="text" id="msgInput" ref={inputRef} placeholder="질문을 입력하세요" />
            <button onClick={() => sendMessage()}>보내기</button>
          </div>
          <div className="disclaimer-bar">
            본 응답은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </div>
        </section>
      </div>
    </>
  );
}
