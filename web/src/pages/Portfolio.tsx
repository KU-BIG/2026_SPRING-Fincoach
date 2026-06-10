import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { krw, pct, pnlColor } from "@/lib/format";

export default function Portfolio() {
  const [pf, setPf] = useState<Awaited<ReturnType<typeof api.portfolioSummary>> | null>(null);
  const [analysis, setAnalysis] = useState<Awaited<
    ReturnType<typeof api.portfolioAnalysis>
  > | null>(null);

  useEffect(() => {
    api.portfolioSummary().then(setPf);
    api.portfolioAnalysis().then(setAnalysis);
  }, []);

  if (!pf) return <div className="text-fg-muted">불러오는 중</div>;

  const pnlSign = pf.total_pnl_krw >= 0 ? "+" : "";
  const domestic = pf.positions.filter((p) => /^\d/.test(p.ticker)).length;
  const overseas = pf.positions.length - domestic;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="headline text-xl">포트폴리오</h1>
        {pf.source === "mock" && (
          <span className="rounded-sm border border-warn px-2 py-0.5 text-[10px] font-medium text-warn">
            데모 데이터
          </span>
        )}
      </div>

      {/* 평가금액 */}
      <section className="rounded-lg border border-border bg-bg-surface p-6">
        <p className="caption">총 평가금액</p>
        <p className="num mt-2 text-3xl font-bold sm:text-4xl">
          {krw(pf.total_value_krw)}
          <span className="ml-1 text-base font-medium text-fg-secondary">원</span>
        </p>
        <p className={`num mt-1 text-sm font-medium ${pnlColor(pf.total_pnl_krw)}`}>
          {pnlSign}
          {krw(pf.total_pnl_krw)}원 · {pct(pf.pnl_pct)}
        </p>
      </section>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <Tile label="보유 종목" value={`${pf.positions.length}개`} />
        <Tile label="국내" value={`${domestic}개`} />
        <Tile label="해외" value={`${overseas}개`} />
      </div>

      {/* 표 */}
      <section className="rounded-lg border border-border bg-bg-base p-6">
        <h2 className="subhead mb-4 text-base">보유 종목 상세</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th className="pb-2 font-medium">종목명</th>
              <th className="pb-2 text-right font-medium">티커</th>
              <th className="pb-2 text-right font-medium">비중</th>
              <th className="pb-2 text-right font-medium">수익률</th>
            </tr>
          </thead>
          <tbody>
            {pf.positions.map((p) => (
              <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{p.name}</td>
                <td className="num py-2.5 text-right text-fg-muted">{p.ticker}</td>
                <td className="num py-2.5 text-right">{p.weight}%</td>
                <td className={`num py-2.5 text-right font-medium ${pnlColor(p.pnl_pct)}`}>
                  {pct(p.pnl_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* AI 분석 */}
      {analysis && (
        <section className="rounded-lg border border-border bg-bg-base p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="subhead text-base">AI 분석</h2>
            <span className="text-xs text-fg-muted">
              {analysis.source === "mock" ? "데모 분석" : "AI 자동 생성"}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-7 text-fg-primary">{analysis.summary}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnalysisBlock label="특성" items={analysis.characteristics} />
            <AnalysisBlock label="강점" items={analysis.strengths} />
            <AnalysisBlock label="리스크" items={analysis.risks} />
            <AnalysisBlock label="점검 포인트" items={analysis.suggestions} />
          </div>

          <p className="mt-5 text-xs text-fg-muted">
            본 분석은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
          </p>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-5">
      <p className="caption">{label}</p>
      <p className="num mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function AnalysisBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border bg-bg-surface p-5">
      <p className="caption">{label}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-fg-primary">
            <span className="num shrink-0 text-fg-muted">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
