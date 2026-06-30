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
        "주가수익비율(Price Earnings Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 한 주가 1년치 이익의 몇 배에 거래되는지 나타냅니다. 예: 주가 70,000원 / EPS 5,000원 = PER 14배 — 현재 이익 기준으로 투자금을 회수하는 데 14년이 걸린다는 의미입니다.",
      ],
      [
        "현재 시장 흐름",
        "코스피 평균 PER은 약 10~12배 수준입니다. 반도체주는 이익 변동성이 크기 때문에 단일 연도 PER보다 <b>정상화 이익 기준 PER(Normalized PER)</b>을 더 많이 참고합니다. 동종 업계 평균 PER과 비교하는 상대 가치 접근이 합리적입니다.",
      ],
      [
        "포트폴리오 적용",
        "PER만 보지 말고 <b>ROE·EPS 성장률</b>과 함께 해석해야 합니다. 성장주는 높은 PER이 정당화될 수 있고, 가치주는 낮은 PER이 함정일 수도 있습니다(이익의 질 저하). PER을 EPS 성장률로 나눈 PEG 지표도 함께 참고하세요.",
      ],
    ],
  },
  eps: {
    cat: "종목 분석",
    nm: "EPS",
    rel: null,
    body: [
      [
        "정의",
        "주당순이익(Earnings Per Share). 기업의 순이익 ÷ 발행 주식 수로 계산합니다. PER 계산의 분모가 되는 핵심 지표로, EPS가 오르면 같은 PER에서 주가도 함께 오르는 구조입니다.",
      ],
      [
        "현재 시장 흐름",
        "실적 시즌마다 EPS 컨센서스(애널리스트 예상치) 대비 <b>어닝 서프라이즈/쇼크</b>가 단기 주가의 핵심 드라이버입니다. AI 수요 확대로 엔비디아·SK하이닉스의 EPS 상향 조정이 이어지는 반면, 내수 소비재 기업들은 EPS 하향 조정 압력을 받고 있습니다.",
      ],
      [
        "포트폴리오 적용",
        "보유 종목의 EPS 추정치 변화를 분기마다 체크하는 습관이 중요합니다. <b>EPS 성장률이 주가 상승의 기본 동력</b>이며, PER을 EPS 성장률로 나눈 PEG(PER/EPS 성장률) 지표를 활용하면 성장 대비 가격 수준을 비교적 직관적으로 파악할 수 있습니다.",
      ],
    ],
  },
  roe: {
    cat: "종목 분석",
    nm: "ROE",
    rel: null,
    body: [
      [
        "정의",
        "자기자본이익률(Return on Equity). 순이익 ÷ 자기자본 × 100으로 계산합니다. 주주가 맡긴 자본으로 기업이 1년에 얼마를 벌었는지 나타내는 수익성 지표입니다. ROE 15%라면 자본 100원으로 15원의 이익을 창출했다는 뜻입니다.",
      ],
      [
        "현재 시장 흐름",
        "S&P 500 평균 ROE는 약 18~20%, 코스피 평균은 8~10%대로 상대적으로 낮습니다. AI·반도체 관련 기업들은 ROE 급등 추세입니다. 자사주 매입이 늘면 자기자본이 줄어 ROE가 자동 상승하는 구조적 특성도 있습니다.",
      ],
      [
        "포트폴리오 적용",
        "ROE가 높고 지속 가능하다면 높은 PER도 정당화될 수 있습니다. PER과 ROE를 연결한 <b>PBR(주가순자산비율)</b>로 저평가 여부를 추가 확인할 수 있습니다. 단, 부채를 늘려 자기자본을 줄이는 방식으로 ROE를 부풀리는 경우도 있으므로 부채비율을 반드시 함께 점검하세요.",
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
        "메모리 반도체 가격이 수년 단위로 호황(업사이클)과 침체(다운사이클)를 반복하는 패턴입니다. <b>공급(CAPEX), 수요(데이터센터·스마트폰), 재고</b>가 3대 핵심 변수입니다.",
      ],
      [
        "현재 시장 흐름",
        "AI 서버용 HBM(고대역폭 메모리) 수요가 급증하며 공급이 빠듯합니다. 엔비디아 GPU 1개에 HBM이 6~8개 탑재되는 구조로 수요 패턴이 변화 중이며, 일반 DRAM은 여전히 재고 조정 국면에 있습니다.",
      ],
      [
        "포트폴리오 적용",
        "반도체주는 단기 이익보다 <b>사이클 위치</b>가 우선 판단 기준입니다. 재고/출하 비율, 고객사 CAPEX 발표, 메모리 현물가 동향을 분기마다 체크하고, 사이클 저점 매수·고점 경계 전략이 역사적으로 유효했습니다.",
      ],
    ],
  },
  fx: {
    cat: "리스크",
    nm: "환율",
    rel: null,
    body: [
      [
        "정의",
        "원/달러 환율. 1달러를 매입하는 데 필요한 원화 금액입니다. 환율 상승(원화 약세)은 수출 기업 원화 매출 증가와 수입 물가 상승이라는 이중 효과를 동시에 가져옵니다.",
      ],
      [
        "현재 시장 흐름",
        "미 연준의 금리 정책과 달러 강세 사이클이 원/달러 환율의 핵심 드라이버입니다. 1,400원대 이상 구간에서는 수입 인플레이션 압박과 외국인 자금 이탈 우려가 동반될 수 있습니다.",
      ],
      [
        "포트폴리오 적용",
        "해외 종목 비중이 크다면 <b>원화 기준 수익률 = 달러 수익률 + 환율 변동률</b>임을 항상 염두에 두어야 합니다. 환헤지 ETF와 비헤지 ETF의 차이를 이해하고, 환노출 규모가 클 경우 헤지 비용 대비 효과를 검토하세요.",
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
        "현재 투자 전략을 과거 데이터에 적용해 수익률, 최대 낙폭(MDD), 변동성, 샤프 비율 등을 추정하는 방법론입니다. '이 전략을 과거에 썼더라면'을 시뮬레이션하는 것입니다.",
      ],
      [
        "현재 시장 흐름",
        "최근 5년(2019~2024)은 저금리·양적완화·AI 랠리가 겹쳐 대부분의 성장 전략이 과장된 성과를 보입니다. 이 구간만 포함하면 <b>과적합(overfitting)</b> 위험이 높으므로, 금리 정상화 구간(2022~2023)을 반드시 포함하고 최소 10년 단위로 검증하는 것이 권장됩니다.",
      ],
      [
        "포트폴리오 적용",
        "<b>MDD(Maximum Drawdown, 최대 낙폭)</b>를 실제로 견딜 수 있는지가 핵심입니다. 연평균 20% 수익이어도 -50% 낙폭을 감내해야 한다면 대부분 중간에 손절하게 됩니다. 백테스트 전에 본인의 MDD 허용 범위를 먼저 정하는 것이 순서입니다.",
      ],
    ],
  },
  inf: {
    cat: "거시 경제",
    nm: "인플레이션",
    rel: null,
    body: [
      [
        "정의",
        "물가가 지속적으로 상승해 화폐의 실질 구매력이 감소하는 현상입니다. 소비자물가지수(CPI)와 생산자물가지수(PPI)로 측정하며, 대부분의 중앙은행은 연 2%를 목표치로 삼습니다.",
      ],
      [
        "현재 시장 흐름",
        "2022년 미국 CPI 9.1% 정점 이후 하락 중이나, 서비스 물가(임대·의료)의 점착성으로 완전한 안정화까지 시간이 걸리고 있습니다. 물가 둔화가 확인되면 성장주에 우호적인 환경이 형성됩니다.",
      ],
      [
        "포트폴리오 적용",
        "인플레이션이 높을수록 현금과 채권의 실질 가치가 하락합니다. <b>실물 자산(부동산·원자재), 인플레이션 연동 채권(TIPS), 배당 성장주</b>가 헤지 수단으로 거론됩니다. 현금 비중이 높은 포트폴리오는 인플레이션에 가장 취약합니다.",
      ],
    ],
  },
  rate: {
    cat: "거시 경제",
    nm: "금리",
    rel: null,
    body: [
      [
        "정의",
        "자금 차입에 대한 가격입니다. 중앙은행이 정책금리(기준금리)를 조정해 시중 유동성을 통제합니다. 금리 인상 → 대출 비용 증가 → 소비·투자 위축 → 물가 하락의 경로로 작동합니다.",
      ],
      [
        "현재 시장 흐름",
        "미 연준 기준금리는 2023년 5.5%까지 인상 후 인하 사이클에 진입했습니다. 고금리 구간에서는 성장주 밸류에이션 디레이팅이 발생하고, 인하 시 반등이 나타나는 경향이 있습니다.",
      ],
      [
        "포트폴리오 적용",
        "성장주 비중이 높다면 금리 방향성을 반드시 점검하세요. <b>금리 인하기에는 리츠(REITs)·장기채·성장주</b>가 유리하고, 인상기에는 은행주·단기채·원자재주가 상대적으로 강세를 보이는 경향이 있습니다.",
      ],
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
        <div style={{ fontSize: "13px", color: "var(--fg-muted)" }}>총 8개 용어 · 3개 카테고리</div>
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
              <a href="#" data-key="eps">
                EPS
              </a>
              <a href="#" data-key="roe">
                ROE
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
