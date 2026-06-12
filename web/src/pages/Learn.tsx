import { useEffect, useRef } from "react";

/* /site/learn.html <main class="page-pad"> 를 그대로(verbatim) 이식.
   page-head / learn-layout(toc + article) / 용어 본문 / 면책.
   인라인 <script> 의 terms 데이터 + render(key) + TOC 클릭 핸들러를 그대로 이식한다.
   첫 페인트는 정적 HTML(PER, nav-prev-next 포함)과 동일하고, TOC 클릭 시 render() 가
   #article 의 innerHTML 을 원본과 같은 문자열로 교체한다(출력 동일). */

type Term = { cat: string; nm: string; rel: string | null; body: [string, string][] };

const terms: Record<string, Term> = {
  per: {
    cat: "종목 분석",
    nm: "PER",
    rel: "삼성전자 12.5배",
    body: [
      [
        "정의",
        "주가수익비율(Price Earnings Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 한 주가 1년치 이익의 몇 배에 거래되는지를 나타냅니다.",
      ],
      [
        "현재 시장 흐름",
        "반도체주는 사이클상 이익 변동이 커서 단순 비교가 어렵습니다. 동종 업계 평균과 함께 보는 것이 합리적입니다.",
      ],
      [
        "포트폴리오 적용",
        "보유 종목의 PER은 단독으로 판단하지 말고, <b>ROE와 매출 성장률</b>과 함께 해석해야 합니다.",
      ],
    ],
  },
  semi: {
    cat: "종목 분석",
    nm: "반도체 사이클",
    rel: "SK하이닉스",
    body: [
      [
        "정의",
        "메모리 반도체 가격이 수년 단위로 호황과 침체를 반복하는 패턴. <b>공급, 수요, 재고</b>가 핵심 변수입니다.",
      ],
      [
        "현재 시장 흐름",
        "AI 수요로 HBM(고대역폭 메모리) 공급이 빠듯합니다. 메모리 가격 반등 신호가 누적되는 국면입니다.",
      ],
      [
        "포트폴리오 적용",
        "반도체주는 단기 실적보다 사이클 위치가 우선합니다. 재고 사이클 지표를 함께 확인해야 합니다.",
      ],
    ],
  },
  fx: {
    cat: "리스크",
    nm: "환율",
    rel: null,
    body: [
      ["정의", "원/달러 환율. 1달러를 매입하기 위해 필요한 원화 금액입니다."],
      [
        "현재 시장 흐름",
        "원화 약세는 해외 종목의 평가액을 끌어올리지만, 환차익은 미실현 상태이며 환차손 위험이 동반됩니다.",
      ],
      [
        "포트폴리오 적용",
        "해외 비중이 크다면 환율 시나리오를 함께 검토하고, 헤지 필요성을 점검해야 합니다.",
      ],
    ],
  },
  backtest: {
    cat: "리스크",
    nm: "백테스트",
    rel: null,
    body: [
      [
        "정의",
        "현재 투자 전략을 과거 데이터에 적용해 수익률·최대 낙폭·변동성을 추정하는 방법론입니다.",
      ],
      [
        "현재 시장 흐름",
        "최근 5년은 저금리·고성장 구간이 길어 결과가 과장될 가능성이 있습니다. 최소 10년 단위 검증이 권장됩니다.",
      ],
      [
        "포트폴리오 적용",
        "백테스트 결과는 미래 성과를 보장하지 않습니다. <b>최대 낙폭(MDD)</b>을 감내할 수 있는지가 우선 판단 기준입니다.",
      ],
    ],
  },
  inf: {
    cat: "거시 경제",
    nm: "인플레이션",
    rel: null,
    body: [
      ["정의", "물가가 지속적으로 상승하는 현상. 화폐의 실질 구매력이 감소합니다."],
      [
        "현재 시장 흐름",
        "금리 인상 사이클의 종료 여부가 핵심 변수입니다. 물가 둔화가 확인되면 성장주에 우호적인 환경이 형성됩니다.",
      ],
      [
        "포트폴리오 적용",
        "현금 비중이 높은 포트폴리오는 인플레이션에 가장 취약합니다. 실물 자산 또는 배당주 비중을 점검할 필요가 있습니다.",
      ],
    ],
  },
  rate: {
    cat: "거시 경제",
    nm: "금리",
    rel: null,
    body: [
      ["정의", "자금 차입에 대한 가격. 중앙은행이 정책금리를 조정해 시중 유동성을 통제합니다."],
      [
        "현재 시장 흐름",
        "고금리 환경은 성장주에 부담을 주는 반면, 배당주와 금융주에는 우호적으로 작용합니다.",
      ],
      ["포트폴리오 적용", "성장주 비중이 높다면 금리 민감도 점검이 필요합니다."],
    ],
  },
};

export default function Learn() {
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    function render(key: string) {
      const t = terms[key];
      if (!t || !article) return;
      article.innerHTML = `
        <div class="cat">${t.cat}</div>
        <h2>${t.nm}</h2>
        ${t.rel ? `<span class="related">관련 종목 · ${t.rel}</span>` : ""}
        <div class="body">
          ${t.body.map(([h, p]) => `<section><h3>${h}</h3><p>${p}</p></section>`).join("")}
        </div>
        <p class="footer-disclaimer" style="margin-top: 32px;">본 자료는 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.</p>
      `;
      document
        .querySelectorAll<HTMLAnchorElement>(".toc-list a")
        .forEach((a) => a.classList.toggle("active", a.dataset.key === key));
    }

    const anchors = document.querySelectorAll<HTMLAnchorElement>(".toc-list a");
    const handlers: Array<{ el: HTMLAnchorElement; fn: (e: Event) => void }> = [];
    anchors.forEach((a) => {
      const fn = (e: Event) => {
        e.preventDefault();
        render(a.dataset.key || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      a.addEventListener("click", fn);
      handlers.push({ el: a, fn });
    });

    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
    };
  }, []);

  return (
    <>
      <div className="page-head reveal">
        <div>
          <div className="caption">GLOSSARY / READING</div>
          <h1 style={{ marginTop: "6px" }}>금융 용어</h1>
        </div>
        <div style={{ fontSize: "13px", color: "var(--fg-muted)" }}>총 6개 용어 · 4개 카테고리</div>
      </div>

      <div className="learn-layout">
        <aside className="card toc reveal">
          <h4>목차</h4>
          <div className="toc-section">
            <h5>종목 분석</h5>
            <div className="toc-list">
              <a href="#" className="active" data-key="per">
                PER<span className="rel">삼성전자 12.5배</span>
              </a>
              <a href="#" data-key="semi">
                반도체 사이클<span className="rel">SK하이닉스</span>
              </a>
            </div>
          </div>
          <div className="toc-section">
            <h5>리스크</h5>
            <div className="toc-list">
              <a href="#" data-key="fx">
                환율
              </a>
              <a href="#" data-key="backtest">
                백테스트
              </a>
            </div>
          </div>
          <div className="toc-section">
            <h5>거시 경제</h5>
            <div className="toc-list">
              <a href="#" data-key="inf">
                인플레이션
              </a>
              <a href="#" data-key="rate">
                금리
              </a>
            </div>
          </div>
        </aside>

        <main
          className="card article reveal"
          style={{ transitionDelay: "100ms" }}
          id="article"
          ref={articleRef}
        >
          <div className="cat">종목 분석</div>
          <h2>PER</h2>
          <span className="related">관련 종목 · 삼성전자 12.5배</span>
          <div className="body">
            <section>
              <h3>정의</h3>
              <p>
                주가수익비율(Price Earnings Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 한 주가
                1년치 이익의 몇 배에 거래되는지를 나타냅니다.
              </p>
            </section>
            <section>
              <h3>현재 시장 흐름</h3>
              <p>
                반도체주는 사이클상 이익 변동이 커서 단순 비교가 어렵습니다. 동종 업계 평균과 함께
                보는 것이 합리적입니다.
              </p>
            </section>
            <section>
              <h3>포트폴리오 적용</h3>
              <p>
                보유 종목의 PER은 단독으로 판단하지 말고, <b>ROE와 매출 성장률</b>과 함께 해석해야
                합니다.
              </p>
            </section>
          </div>
          <div className="nav-prev-next">
            <a href="#">
              <div className="lbl">← 이전</div>
              <div className="nm">목차로 돌아가기</div>
            </a>
            <a href="#" style={{ textAlign: "right" }}>
              <div className="lbl">다음 →</div>
              <div className="nm">반도체 사이클</div>
            </a>
          </div>
          <p className="footer-disclaimer">
            본 자료는 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </p>
        </main>
      </div>
    </>
  );
}
