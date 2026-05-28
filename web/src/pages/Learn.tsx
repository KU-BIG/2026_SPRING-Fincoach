import { Card, CardLabel } from "@/components/Card";

const topics = [
  { keyword: "인플레이션", summary: "물가 상승이 자산에 미치는 영향" },
  { keyword: "PER", summary: "주가수익비율로 보는 종목 평가" },
  { keyword: "반도체 사이클", summary: "메모리 가격과 시장 흐름" },
  { keyword: "금리", summary: "금리 변화가 포트폴리오에 미치는 영향" },
  { keyword: "환율", summary: "원/달러 변동과 해외 종목" },
  { keyword: "백테스트", summary: "과거 데이터로 전략 점검" },
];

export default function Learn() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">학습</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          개념 → 현재 시장 사례 → 투자자 대응 3단 구조로 설명. (수빈 모듈에서 LLM 연결 예정)
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <Card
            key={t.keyword}
            className="cursor-pointer transition hover:border-border-strong hover:shadow-hover"
          >
            <CardLabel>키워드</CardLabel>
            <h3 className="mt-2 text-lg font-semibold">{t.keyword}</h3>
            <p className="mt-2 text-sm text-fg-secondary">{t.summary}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
