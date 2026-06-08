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
      { title: "이게 뭐예요", text: "주가수익비율. 주가를 EPS(주당순이익)로 나눈 값으로, 한 주가 1년치 이익의 몇 배에 거래되는지를 뜻해요." },
      { title: "지금 시장에서는", text: "반도체주는 사이클상 이익 변동이 커서 단순 비교가 어려워요. 동종업계 평균과 함께 보는 게 좋아요." },
      { title: "내 포트폴리오엔", text: "보유 종목의 PER만 보지 말고, ROE와 매출 성장과 같이 봐야 의미가 살아나요." },
    ],
  },
  {
    key: "inflation",
    name: "인플레이션",
    category: "거시 경제",
    body: [
      { title: "이게 뭐예요", text: "물가가 오르는 현상. 같은 돈으로 살 수 있는 게 줄어들어요." },
      { title: "지금 시장에서는", text: "금리 인상 사이클이 끝나는지가 핵심 이슈예요. 인플레가 둔화되면 성장주에 우호적." },
      { title: "내 포트폴리오엔", text: "현금 비중이 높으면 인플레이션에 가장 약해요. 실물 자산이나 배당주 비중을 점검해 보세요." },
    ],
  },
  {
    key: "rate",
    name: "금리",
    category: "거시 경제",
    body: [
      { title: "이게 뭐예요", text: "돈을 빌리는 가격. 중앙은행이 정책금리를 조정해 시중 자금 흐름을 조절해요." },
      { title: "지금 시장에서는", text: "고금리 환경은 성장주에 부담, 배당주와 금융주에 우호적이에요." },
      { title: "내 포트폴리오엔", text: "성장주에 쏠려있다면 금리 민감도 점검이 필요해요." },
    ],
  },
  {
    key: "semiconductor",
    name: "반도체 사이클",
    category: "종목 분석",
    related: "SK하이닉스",
    body: [
      { title: "이게 뭐예요", text: "메모리 가격이 수년 단위로 호황과 침체를 반복하는 패턴. 공급·수요·재고가 핵심 변수." },
      { title: "지금 시장에서는", text: "AI 수요로 HBM 공급이 빠듯해요. 메모리 가격 반등 신호가 누적되는 중." },
      { title: "내 포트폴리오엔", text: "반도체주는 실적보다 사이클 위치가 먼저예요. 재고 사이클 지표를 같이 보세요." },
    ],
  },
  {
    key: "fx",
    name: "환율",
    category: "리스크",
    body: [
      { title: "이게 뭐예요", text: "원/달러 환율. 1달러를 사기 위해 필요한 원화 금액이에요." },
      { title: "지금 시장에서는", text: "원화 약세는 해외 종목 평가액을 끌어올리지만, 환차익은 미실현이라 환차손 위험도 같이 와요." },
      { title: "내 포트폴리오엔", text: "해외 비중이 크면 환율 시나리오를 같이 보세요. 헤지가 필요한 수준인지 점검할 수 있어요." },
    ],
  },
  {
    key: "backtest",
    name: "백테스트",
    category: "리스크",
    body: [
      { title: "이게 뭐예요", text: "현재 전략을 과거 데이터에 대입해 수익률·낙폭·변동성을 추정하는 방법." },
      { title: "지금 시장에서는", text: "최근 5년은 저금리·고성장 구간이 길어서 결과가 과장될 수 있어요. 최소 10년 단위로 보세요." },
      { title: "내 포트폴리오엔", text: "백테스트 결과는 보장이 아니에요. 최대 낙폭(MDD)을 받아들일 수 있는지가 더 중요해요." },
    ],
  },
];

const categories: Concept["category"][] = ["기본", "종목 분석", "리스크", "거시 경제"];

export default function Learn() {
  const [activeKey, setActiveKey] = useState(concepts[0].key);
  const active = concepts.find((c) => c.key === activeKey) ?? concepts[0];

  return (
    <div className="space-y-4">
      <h1 className="headline text-xl">용어 사전</h1>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-lg border border-border bg-bg-surface p-5">
            <p className="text-sm font-medium text-fg-primary">전체 용어</p>
            <p className="mt-1 text-xs text-fg-muted">관련 종목이 있으면 표시돼요</p>
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
              <p className="mt-1 text-sm text-fg-secondary">관련: {active.related}</p>
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
            정보 제공 목적이며 투자 권유가 아닙니다.
          </p>
        </main>
      </div>
    </div>
  );
}
