import { useState } from "react";

type Concept = {
  key: string;
  name: string;
  category: "기본" | "종목 분석" | "리스크" | "거시 경제";
  related?: string;
  body: { title: string; text: string }[];
};

const concepts: Concept[] = [
  {
    key: "per",
    name: "PER",
    category: "종목 분석",
    related: "삼성전자 12.5배",
    body: [
      { title: "정의", text: "주가수익비율(Price Earnings Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 한 주가 1년치 이익의 몇 배에 거래되는지를 나타냅니다." },
      { title: "현재 시장 흐름", text: "반도체주는 사이클상 이익 변동이 커서 단순 비교가 어렵습니다. 동종 업계 평균과 함께 보는 것이 합리적입니다." },
      { title: "포트폴리오 적용", text: "보유 종목의 PER은 단독으로 판단하지 말고, ROE와 매출 성장률과 함께 해석해야 합니다." },
    ],
  },
  {
    key: "inflation",
    name: "인플레이션",
    category: "거시 경제",
    body: [
      { title: "정의", text: "물가가 지속적으로 상승하는 현상. 화폐의 실질 구매력이 감소합니다." },
      { title: "현재 시장 흐름", text: "금리 인상 사이클의 종료 여부가 핵심 변수입니다. 물가 둔화가 확인되면 성장주에 우호적인 환경이 형성됩니다." },
      { title: "포트폴리오 적용", text: "현금 비중이 높은 포트폴리오는 인플레이션에 가장 취약합니다. 실물 자산 또는 배당주 비중을 점검할 필요가 있습니다." },
    ],
  },
  {
    key: "rate",
    name: "금리",
    category: "거시 경제",
    body: [
      { title: "정의", text: "자금 차입에 대한 가격. 중앙은행이 정책금리를 조정해 시중 유동성을 통제합니다." },
      { title: "현재 시장 흐름", text: "고금리 환경은 성장주에 부담을 주는 반면, 배당주와 금융주에는 우호적으로 작용합니다." },
      { title: "포트폴리오 적용", text: "성장주 비중이 높다면 금리 민감도 점검이 필요합니다." },
    ],
  },
  {
    key: "semiconductor",
    name: "반도체 사이클",
    category: "종목 분석",
    related: "SK하이닉스",
    body: [
      { title: "정의", text: "메모리 반도체 가격이 수년 단위로 호황과 침체를 반복하는 패턴. 공급, 수요, 재고가 핵심 변수입니다." },
      { title: "현재 시장 흐름", text: "AI 수요로 HBM(고대역폭 메모리) 공급이 빠듯합니다. 메모리 가격 반등 신호가 누적되는 국면입니다." },
      { title: "포트폴리오 적용", text: "반도체주는 단기 실적보다 사이클 위치가 우선합니다. 재고 사이클 지표를 함께 확인해야 합니다." },
    ],
  },
  {
    key: "fx",
    name: "환율",
    category: "리스크",
    body: [
      { title: "정의", text: "원/달러 환율. 1달러를 매입하기 위해 필요한 원화 금액입니다." },
      { title: "현재 시장 흐름", text: "원화 약세는 해외 종목의 평가액을 끌어올리지만, 환차익은 미실현 상태이며 환차손 위험이 동반됩니다." },
      { title: "포트폴리오 적용", text: "해외 비중이 크다면 환율 시나리오를 함께 검토하고, 헤지 필요성을 점검해야 합니다." },
    ],
  },
  {
    key: "backtest",
    name: "백테스트",
    category: "리스크",
    body: [
      { title: "정의", text: "현재 투자 전략을 과거 데이터에 적용해 수익률, 최대 낙폭, 변동성을 추정하는 방법론입니다." },
      { title: "현재 시장 흐름", text: "최근 5년은 저금리, 고성장 구간이 길어 결과가 과장될 가능성이 있습니다. 최소 10년 단위 검증이 권장됩니다." },
      { title: "포트폴리오 적용", text: "백테스트 결과는 미래 성과를 보장하지 않습니다. 최대 낙폭(MDD)을 감내할 수 있는지가 우선 판단 기준입니다." },
    ],
  },
];

const categories: Concept["category"][] = ["기본", "종목 분석", "리스크", "거시 경제"];

export default function Learn() {
  const [activeKey, setActiveKey] = useState(concepts[0].key);
  const active = concepts.find((c) => c.key === activeKey) ?? concepts[0];

  return (
    <div className="space-y-4">
      <h1 className="headline text-xl">금융 용어</h1>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-lg border border-border bg-bg-surface p-5">
            <p className="text-sm font-medium text-fg-primary">전체 용어</p>
            <p className="mt-1 text-xs text-fg-muted">관련 종목이 있는 경우 표시됩니다</p>
            <div className="mt-4 space-y-4">
              {categories.map((cat) => {
                const items = concepts.filter((c) => c.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="caption">{cat}</p>
                    <ul className="mt-1.5 space-y-px">
                      {items.map((c) => (
                        <li key={c.key}>
                          <button
                            onClick={() => setActiveKey(c.key)}
                            className={
                              "w-full rounded-sm px-2 py-1.5 text-left text-sm transition " +
                              (c.key === activeKey
                                ? "bg-accent text-accent-fg font-medium"
                                : "text-fg-primary hover:bg-bg-muted")
                            }
                          >
                            <span>{c.name}</span>
                            {c.related && c.key !== activeKey && (
                              <span className="ml-2 text-xs text-fg-muted">{c.related}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <article className="rounded-lg border border-border bg-bg-base p-6 lg:p-8">
            <p className="caption">{active.category}</p>
            <h2 className="headline mt-1 text-2xl">{active.name}</h2>
            {active.related && (
              <p className="mt-1 text-sm text-fg-secondary">관련 종목: {active.related}</p>
            )}
            <div className="mt-6 space-y-6">
              {active.body.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-fg-primary">{section.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-7 text-fg-secondary">{section.text}</p>
                </div>
              ))}
            </div>
          </article>
          <p className="mt-3 text-xs text-fg-muted">
            본 자료는 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </p>
        </main>
      </div>
    </div>
  );
}
