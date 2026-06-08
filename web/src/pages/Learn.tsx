import { useState } from "react";

type Concept = {
  key: string;
  name: string;
  category: "기초" | "종목 분석" | "리스크" | "거시";
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
      { title: "개념", text: "주가수익비율. 주가를 EPS로 나눈 값. 한 주가 1년치 이익의 몇 배에 거래되는지." },
      { title: "지금 시장에서는", text: "반도체주는 사이클상 이익 변동이 커서 단순 비교가 어렵습니다. 동종업계 평균과 함께 보세요." },
      { title: "코치가 짚는 것", text: "보유 종목의 PER만 보지 말고, ROE·매출 성장과 같이 봐야 의미가 살아납니다." },
    ],
  },
  {
    key: "inflation",
    name: "인플레이션",
    category: "거시",
    body: [
      { title: "개념", text: "물가 상승. 같은 돈으로 살 수 있는 게 줄어드는 현상." },
      { title: "지금 시장에서는", text: "금리 인상 사이클이 끝나는지가 핵심 이슈. 인플레 둔화가 확인되면 성장주에 우호적." },
      { title: "코치가 짚는 것", text: "현금 비중이 높은 포트폴리오는 인플레이션에 가장 약합니다. 실물 자산이나 배당주 비중을 점검하세요." },
    ],
  },
  {
    key: "rate",
    name: "금리",
    category: "거시",
    body: [
      { title: "개념", text: "돈을 빌리는 가격. 중앙은행이 정책금리를 조정해 시중 자금 흐름을 조절." },
      { title: "지금 시장에서는", text: "고금리 환경은 성장주에 부담, 배당주·금융주에 우호적입니다." },
      { title: "코치가 짚는 것", text: "포트폴리오가 성장주 한쪽으로 쏠려있다면 금리 민감도 점검이 필요합니다." },
    ],
  },
  {
    key: "semiconductor",
    name: "반도체 사이클",
    category: "종목 분석",
    related: "SK하이닉스",
    body: [
      { title: "개념", text: "메모리 가격이 수년 단위로 호황과 침체를 반복하는 패턴. 공급·수요·재고가 핵심 변수." },
      { title: "지금 시장에서는", text: "AI 수요로 HBM 공급이 빠듯합니다. 메모리 가격 반등 신호가 누적되는 중." },
      { title: "코치가 짚는 것", text: "반도체주는 실적보다 사이클 위치가 먼저입니다. 재고 사이클 지표를 같이 보세요." },
    ],
  },
  {
    key: "fx",
    name: "환율",
    category: "리스크",
    body: [
      { title: "개념", text: "원/달러 환율. 1달러를 사기 위해 필요한 원화 금액." },
      { title: "지금 시장에서는", text: "원화 약세는 해외 종목 평가액을 끌어올리지만, 환차익은 미실현이라 환차손 위험도 같이 옵니다." },
      { title: "코치가 짚는 것", text: "해외 비중이 크면 환율 시나리오를 같이 보세요. 헤지가 필요한 수준인지 점검 가능합니다." },
    ],
  },
  {
    key: "backtest",
    name: "백테스트",
    category: "리스크",
    body: [
      { title: "개념", text: "현재 전략을 과거 데이터에 대입해 수익률·낙폭·변동성을 추정." },
      { title: "지금 시장에서는", text: "최근 5년은 저금리·고성장 구간이 길어 결과가 과장될 수 있어요. 최소 10년 단위로 보세요." },
      { title: "코치가 짚는 것", text: "백테스트 결과는 보장이 아닙니다. 최대 낙폭(MDD)을 받아들일 수 있는지가 더 중요해요." },
    ],
  },
];

const categories: Concept["category"][] = ["기초", "종목 분석", "리스크", "거시"];

export default function Learn() {
  const [activeKey, setActiveKey] = useState(concepts[0].key);
  const active = concepts.find((c) => c.key === activeKey) ?? concepts[0];

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <p className="caption">학습</p>
        <h2 className="serif mt-1 text-xl font-semibold leading-snug">개념 짚기</h2>
        <p className="mt-2 text-sm text-fg-secondary">
          포트폴리오와 연관된 개념을 우선으로 정리합니다.
        </p>
        <div className="mt-8 space-y-6">
          {categories.map((cat) => {
            const items = concepts.filter((c) => c.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="caption">{cat}</p>
                <ul className="mt-2 space-y-px">
                  {items.map((c) => (
                    <li key={c.key}>
                      <button
                        onClick={() => setActiveKey(c.key)}
                        className={
                          "block w-full py-1.5 text-left text-[15px] transition " +
                          (c.key === activeKey
                            ? "font-medium text-accent"
                            : "text-fg-primary hover:text-accent")
                        }
                      >
                        {c.name}
                        {c.related && (
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
      </aside>

      <article className="lg:col-span-9">
        <p className="caption">{active.category}</p>
        <h1 className="serif mt-2 text-[44px] font-semibold leading-[1.1]">
          {active.name}
        </h1>
        {active.related && (
          <p className="mt-3 text-sm text-fg-secondary">관련: {active.related}</p>
        )}

        <div className="mt-10 space-y-10">
          {active.body.map((section, i) => (
            <section key={i}>
              <p className="caption text-accent">{section.title}</p>
              <p className="mt-2 max-w-[65ch] text-[17px] leading-[1.85] text-fg-primary">
                {section.text}
              </p>
            </section>
          ))}
        </div>

        <p className="caption mt-12 border-t border-border pt-4">
          정보 제공 · 투자 권유 아님
        </p>
      </article>
    </div>
  );
}
