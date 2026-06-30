import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { genSeries, buildMiniChart, stocks } from "../lib/charts";
import { useAuth } from "../auth/context";

/* /site/index.html <main> 전체를 그대로(verbatim) 이식한 홈.
   - hero / product-preview / trust-strip / feature 1~3 / how / faq / cta
   - 차트·종목 리스트는 인라인 <script> 의 빌더를 그대로 사용해 동일 SVG 를 dangerouslySetInnerHTML 로 주입
   - 코치 두 번째 답변 타이핑 효과는 useEffect 로 이식(동작 동일) */
export default function Home() {
  const { configured, openAuth } = useAuth();
  // product-preview 큰 sparkline (한 달 추이)
  const ppSparkHtml = useMemo(() => {
    const ppSeries = genSeries(4.05, 30, 0.55, 42);
    return buildMiniChart(ppSeries, "#F04452", 400, 80, {
      pad: 4,
      strokeWidth: 2,
      fillOpacity: 0.28,
      showEndDot: true,
    });
  }, []);

  // product-preview 종목 리스트 (상위 4개)
  const ppGridHtml = useMemo(
    () =>
      stocks
        .slice(0, 4)
        .map((s) => {
          const cls = s.pnl >= 0 ? "pos" : "neg";
          const sign = s.pnl >= 0 ? "+" : "";
          const color = s.pnl >= 0 ? "#F04452" : "#3B9EFF";
          const series = genSeries(s.pnl, 14, 0.55, s.seed);
          return `
        <div class="pp-stock">
          <div class="brand-mark ${s.brand}"><span class="logo"></span></div>
          <div class="text">
            <div class="nm">${s.name}</div>
            <div class="tk">${s.ticker} · ${s.weight}%</div>
          </div>
          <div class="mini-spark">${buildMiniChart(series, color, 88, 28, { pad: 2, strokeWidth: 1.4, showAvg: true, avgAlpha: 0.3, avgDash: "2 2" })}</div>
          <div class="num ${cls}">${sign}${s.pnl.toFixed(1)}%</div>
        </div>`;
        })
        .join(""),
    [],
  );

  // 피처 카드의 보유 종목 표
  const featPortHtml = useMemo(
    () =>
      stocks
        .map((s) => {
          const cls = s.pnl >= 0 ? "pos" : "neg";
          const sign = s.pnl >= 0 ? "+" : "";
          const color = s.pnl >= 0 ? "#F04452" : "#3B9EFF";
          const series = genSeries(s.pnl, 14, 0.5, s.seed + 100);
          return `
        <div class="ftc-port-row">
          <div class="stockcell">
            <div class="brand-mark ${s.brand}" style="width:26px; height:26px; border-radius:6px;"><span class="logo" style="width:14px; height:14px;"></span></div>
            <div><div class="nm">${s.name}</div><div class="tk">${s.ticker}</div></div>
          </div>
          <div class="spark-cell">${buildMiniChart(series, color, 88, 22, { pad: 2, strokeWidth: 1.4, showAvg: true, avgAlpha: 0.3, avgDash: "2 2" })}</div>
          <div class="w">${s.weight}%</div>
          <div class="pl ${cls}">${sign}${s.pnl.toFixed(1)}%</div>
        </div>`;
        })
        .join(""),
    [],
  );

  // 코치 두 번째 답변 타이핑 효과 — viewport 진입 시 무한 반복 (인라인 <script> IIFE 이식)
  const typeTargetRef = useRef<HTMLSpanElement | null>(null);
  const typeBubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = typeTargetRef.current;
    const bubble = typeBubbleRef.current;
    if (!target || !bubble) return;
    // One-time coach typing intro is FORCED ON even under prefers-reduced-motion
    // (product decision): the intro animation must play for everyone.
    const html =
      "현재 포트폴리오에서 반도체 비중은 약 <b>36%</b>로 비교적 높은 편이에요. 삼성전자 22%와 NVIDIA 14%가 큰 축을 차지하고 있어요. AI·HBM 사이클이 길어지면 유리하지만, 반대로 한 섹터에 무게가 쏠려있어 변동성도 큰 점을 같이 봐주세요.";

    // 토큰화: 텍스트 글자(char=true)와 태그(char=false)로 분리.
    const tokens: { s: string; char: boolean }[] = [];
    let buf = "",
      inTag = false;
    for (const ch of html) {
      if (ch === "<") {
        inTag = true;
        buf = ch;
        continue;
      }
      if (ch === ">") {
        buf += ch;
        tokens.push({ s: buf, char: false });
        buf = "";
        inTag = false;
        continue;
      }
      if (inTag) {
        buf += ch;
        continue;
      }
      tokens.push({ s: ch, char: true });
    }
    const totalChars = tokens.filter((t) => t.char).length;

    function renderUpTo(visible: number) {
      let out = "",
        seen = 0;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.char) {
          if (seen >= visible) break;
          out += t.s;
          seen++;
        } else {
          if (/^<\//.test(t.s) || seen < visible) out += t.s;
        }
      }
      return out;
    }

    let inView = false;
    let running = false;
    let timer: number | null = null;

    function cycle() {
      if (!inView) {
        running = false;
        return;
      }
      running = true;
      bubble!.classList.remove("done");
      let visible = 0;
      const step = () => {
        if (!inView) {
          running = false;
          return;
        }
        visible++;
        target!.innerHTML = renderUpTo(visible);
        if (visible >= totalChars) {
          bubble!.classList.add("done");
          timer = window.setTimeout(() => {
            bubble!.classList.remove("done");
            if (inView) cycle();
            else running = false;
          }, 2600);
          return;
        }
        const justTyped = tokens.filter((t) => t.char)[visible - 1];
        const ch = justTyped ? justTyped.s : "";
        let delay = 34 + Math.random() * 30;
        if (/[.,·]/.test(ch)) delay += 220;
        timer = window.setTimeout(step, delay);
      };
      step();
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          inView = e.isIntersecting;
          if (inView && !running) {
            timer = window.setTimeout(cycle, 300);
          } else if (!inView) {
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            running = false;
          }
        });
      },
      // Lower threshold + a small bottom rootMargin so the type-in reliably
      // fires while the bubble is scrolling into view (the previous 0.3 could be
      // skipped on a fast scroll-past, which read as "the typing disappeared").
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(bubble);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <section className="hero reveal">
        <div className="hero-glow"></div>
        <div className="hero-halo"></div>
        <span className="hero-pill">
          <span className="dot"></span>
          정보 제공 도구
          <span className="sep">·</span>
          매수 매도 추천 없음
        </span>
        <h1 className="hero-headline">
          <span className="line">
            <span className="word" style={{ animationDelay: "200ms" }}>
              보유
            </span>{" "}
            <span className="word" style={{ animationDelay: "400ms" }}>
              종목과
            </span>{" "}
            <span className="word" style={{ animationDelay: "600ms" }}>
              시장을
            </span>
          </span>
          <span className="line">
            <em className="word" style={{ animationDelay: "820ms" }}>
              같이
            </em>{" "}
            <span className="word" style={{ animationDelay: "1020ms" }}>
              읽어드립니다.
            </span>
          </span>
        </h1>
        <p className="hero-sub">
          한국·미국 주식을 한 화면에. 비중과 수익률, 오늘의 시장 흐름까지 본 다음{" "}
          <span style={{ whiteSpace: "nowrap" }}>AI 코치</span>에게 바로 물어볼 수 있어요.
        </p>
        <div className="hero-cta">
          {configured ? (
            <button className="btn-white" onClick={() => openAuth("signup")}>
              무료로 시작
            </button>
          ) : (
            <Link to="/portfolio" className="btn-white">
              무료로 시작
            </Link>
          )}
          <Link to="/portfolio?demo=1" className="btn-frost">
            데모 보기
          </Link>
        </div>

        <div className="product-preview">
          <div className="pp-fade-top"></div>
          <div className="pp-fade-bottom"></div>
          <div className="pp-fade-left"></div>
          <div className="pp-fade-right"></div>
          <div className="pp-fade-corners"></div>
          <div className="pp-body">
            <div className="pp-card">
              <div className="pp-label">
                총 평가금액 <span className="badge">+4.05%</span>
              </div>
              <div className="pp-big num" data-counter="12350000">
                0
              </div>
              <div className="pp-diff num pos">+480,000원 오늘</div>
              <div
                className="pp-spark"
                id="ppSparkHost"
                dangerouslySetInnerHTML={{ __html: ppSparkHtml }}
              ></div>
            </div>
            <div
              className="pp-grid"
              id="ppGrid"
              dangerouslySetInnerHTML={{ __html: ppGridHtml }}
            ></div>
          </div>
        </div>

        <div className="trust-strip">
          <div className="label">실데이터로 동작합니다</div>
          <div className="row">
            <span className="src">KRX</span>
            <span className="src">pykrx</span>
            <span className="src">yfinance</span>
            <span className="src">한국경제 RSS</span>
            <span className="src">Anthropic Claude</span>
          </div>
        </div>
      </section>

      <div id="features"></div>

      <section className="feature reveal">
        <div className="ft-text">
          <div className="ft-mark blue">
            <span className="num-tag">01</span>
            <span className="bar"></span>
            <span>Portfolio</span>
          </div>
          <h3 className="ft-title">
            국내·해외 종목을
            <br />한 화면에서.
          </h3>
          <p className="ft-desc">
            한국과 미국 주식을 KRW 환산으로 같이 봅니다. 비중, 손익, 수익률, 30일 추이까지 한 번에.
          </p>
          <ul className="ft-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#3B9EFF" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#3B9EFF" strokeWidth="1.6" fill="none" />
              </svg>
              실 종가 기준 · 매일 갱신
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#3B9EFF" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#3B9EFF" strokeWidth="1.6" fill="none" />
              </svg>
              종목별 30일 추이 미니 차트
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#3B9EFF" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#3B9EFF" strokeWidth="1.6" fill="none" />
              </svg>
              비중·손익·수익률 한 표에
            </li>
          </ul>
          <Link to="/portfolio" className="ft-link">
            포트폴리오 보기 →
          </Link>
        </div>
        <div className="ft-visual ft-stack">
          <div
            className="ft-illust-float"
            style={{ backgroundImage: "url('/site/assets/portfolio-illust.png')" }}
          ></div>
          <div className="ft-card blue-glow">
            <div className="ftc-port-head">
              <div className="ttl">보유 종목</div>
              <div className="ag">5개 · 30일</div>
            </div>
            <div
              className="ftc-port-rows"
              id="featPort"
              dangerouslySetInnerHTML={{ __html: featPortHtml }}
            ></div>
          </div>
        </div>
      </section>

      <section className="feature reverse reveal">
        <div className="ft-text">
          <div className="ft-mark green">
            <span className="num-tag">02</span>
            <span className="bar"></span>
            <span>AI Coach</span>
          </div>
          <h3 className="ft-title">
            내 종목을 알고
            <br />
            답하는 코치.
          </h3>
          <p className="ft-desc">
            시장 개념·종목·리스크 무엇이든. 보유 데이터를 같이 보고 답하기 때문에 내 상황에 맞는
            설명을 들을 수 있어요.
          </p>
          <ul className="ft-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#F04452" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#F04452" strokeWidth="1.6" fill="none" />
              </svg>
              SSE 스트리밍 · 실시간 답변
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#F04452" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#F04452" strokeWidth="1.6" fill="none" />
              </svg>
              매수·매도 직접 추천 없음
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#F04452" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#F04452" strokeWidth="1.6" fill="none" />
              </svg>
              대화 기록 자동 저장
            </li>
          </ul>
          <Link to="/chat" className="ft-link">
            코치에게 묻기 →
          </Link>
        </div>
        <div className="ft-visual ft-stack">
          <div
            className="ft-illust-float"
            style={{
              backgroundImage: "url('/site/assets/chat-illust.png')",
              right: "auto",
              left: "-40px",
            }}
          ></div>
          <div className="ft-card green-glow">
            <div className="chat-demo">
              <div className="bubble user">PER이 높으면 무슨 의미예요?</div>
              <div className="bubble coach">
                <b>PER(주가수익비율)</b>은 주가를 EPS로 나눈 값으로, 한 주가 1년치 이익의 몇 배에
                거래되는지 보여줘요. 보유 중인 NVIDIA의 PER이 시장 평균보다 높은 건 미래 성장 기대가
                큰 영향이에요.
              </div>
              <div className="bubble user">반도체 비중이 큰가요?</div>
              <div className="bubble coach" id="typeBubble" ref={typeBubbleRef}>
                <span id="typeTarget" ref={typeTargetRef}></span>
                <span className="caret"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature reveal">
        <div className="ft-text">
          <div className="ft-mark yellow">
            <span className="num-tag">03</span>
            <span className="bar"></span>
            <span>Glossary</span>
          </div>
          <h3 className="ft-title">
            처음 보는 단어도
            <br />한 줄로.
          </h3>
          <p className="ft-desc">
            PER·인플레이션·반도체 사이클·환율 등 자주 마주치는 용어를 정의·현재 시장 흐름·내
            포트폴리오 적용 3단 구조로.
          </p>
          <ul className="ft-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#FFC53D" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#FFC53D" strokeWidth="1.6" fill="none" />
              </svg>
              정의 · 현재 시장 흐름 · 포트폴리오 적용
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#FFC53D" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#FFC53D" strokeWidth="1.6" fill="none" />
              </svg>
              보유 종목과의 연결
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" stroke="#FFC53D" strokeOpacity="0.3" />
                <path d="M5 8L7 10L11 6" stroke="#FFC53D" strokeWidth="1.6" fill="none" />
              </svg>
              기초·종목 분석·리스크·거시
            </li>
          </ul>
          <Link to="/learn" className="ft-link">
            용어 사전 →
          </Link>
        </div>
        <div className="ft-visual ft-stack">
          <div
            className="ft-illust-float"
            style={{ backgroundImage: "url('/site/assets/glossary-illust.png')" }}
          ></div>
          <div className="ft-card yellow-glow">
            <div className="term-grid">
              <div className="term-card">
                <div className="cat">종목 분석</div>
                <div className="nm">PER</div>
                <div className="ds">주가가 1년치 이익의 몇 배에 거래되는지.</div>
              </div>
              <div className="term-card">
                <div className="cat">거시 경제</div>
                <div className="nm">인플레이션</div>
                <div className="ds">물가가 지속적으로 상승하는 현상.</div>
              </div>
              <div className="term-card">
                <div className="cat">리스크</div>
                <div className="nm">환율</div>
                <div className="ds">해외 종목 평가액에 직접 영향.</div>
              </div>
              <div className="term-card">
                <div className="cat">리스크</div>
                <div className="nm">백테스트</div>
                <div className="ds">과거 데이터로 전략 검증.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="reveal">
        <div className="sec-head">
          <span className="eyebrow">3단계로 시작</span>
          <h2>
            몇 번의 클릭으로
            <br />
            준비됩니다.
          </h2>
          <p>가입과 종목 입력 후 바로 코치에게 물어볼 수 있어요.</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="step">01 / GET STARTED</div>
            <div className="ttl">계정 만들기</div>
            <div className="ds">이메일로 무료 가입. 신용카드 등록 없이 바로.</div>
          </div>
          <div className="how-card">
            <div className="step">02 / IMPORT</div>
            <div className="ttl">종목 입력</div>
            <div className="ds">한국·미국 주식 티커를 입력하면 KRW 환산으로 같이.</div>
          </div>
          <div className="how-card">
            <div className="step">03 / ASK</div>
            <div className="ttl">코치에게 묻기</div>
            <div className="ds">시장·종목·용어 무엇이든. 보유 종목을 같이 보고 답합니다.</div>
          </div>
        </div>
      </section>

      <section id="faq" className="reveal">
        <div className="sec-head">
          <span className="eyebrow">FAQ</span>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className="faq-grid">
          <div className="faq-item">
            <div className="faq-q">매수·매도 추천을 받을 수 있나요?</div>
            <div className="faq-a">
              아니요. FinCoach는 정보 제공 도구로, 특정 종목의 매수 또는 매도를 직접 추천하지
              않습니다.
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-q">어떤 데이터를 사용하나요?</div>
            <div className="faq-a">
              한국 주식은 KRX(pykrx), 미국 주식은 yfinance, 시장 뉴스는 RSS, AI 답변은 Anthropic
              Claude를 사용합니다.
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-q">유료 서비스인가요?</div>
            <div className="faq-a">컨퍼런스 데모 단계로, 현재 무료로 제공됩니다.</div>
          </div>
          <div className="faq-item">
            <div className="faq-q">실시간 시세인가요?</div>
            <div className="faq-a">
              일일 종가 기준으로 동작합니다. 실시간 호가는 제공하지 않습니다.
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section reveal">
        <h2>
          코치에게
          <br />
          물어볼 준비가 됐어요.
        </h2>
        <p>가입 5초. 신용카드 등록 없이 시작합니다.</p>
        <div className="actions">
          {configured ? (
            <button className="btn-white" onClick={() => openAuth("signup")}>
              무료로 시작
            </button>
          ) : (
            <Link to="/portfolio" className="btn-white">
              무료로 시작
            </Link>
          )}
          <Link to="/chat" className="btn-frost">
            코치에게 묻기
          </Link>
        </div>
      </section>
    </>
  );
}
