import { useEffect, useState } from "react";
import { Card, CardLabel, CardTitle } from "@/components/Card";
import { api } from "@/lib/api";
import { krw, pct, pnlColor } from "@/lib/format";

export default function Portfolio() {
  const [pf, setPf] = useState<Awaited<ReturnType<typeof api.portfolioSummary>> | null>(null);
  useEffect(() => {
    api.portfolioSummary().then(setPf);
  }, []);

  if (!pf) return <div className="text-fg-muted">불러오는 중</div>;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">포트폴리오</h1>
          {pf.source === "mock" && (
            <span className="rounded-xs border border-warn px-2 py-0.5 text-xs text-fg-secondary">
              데모 데이터
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-fg-secondary">현태 모듈에서 분석 데이터 공급 예정.</p>
        {pf.source === "mock" && (
          <p className="mt-2 text-xs text-fg-muted">
            API 연결 전 또는 호출 실패 시 표시되는 샘플 데이터입니다.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Card>
          <CardLabel>총 평가</CardLabel>
          <p className="num mt-2 text-xl font-semibold">{krw(pf.total_value_krw)}원</p>
        </Card>
        <Card>
          <CardLabel>총 손익</CardLabel>
          <p className={`num mt-2 text-xl font-semibold ${pnlColor(pf.total_pnl_krw)}`}>
            {pf.total_pnl_krw >= 0 ? "+" : ""}
            {krw(pf.total_pnl_krw)}원
          </p>
        </Card>
        <Card>
          <CardLabel>수익률</CardLabel>
          <p className={`num mt-2 text-xl font-semibold ${pnlColor(pf.pnl_pct)}`}>
            {pct(pf.pnl_pct)}
          </p>
        </Card>
        <Card>
          <CardLabel>종목 수</CardLabel>
          <p className="num mt-2 text-xl font-semibold">{pf.positions.length}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>보유 종목</CardTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th className="pb-2 font-normal">종목</th>
              <th className="pb-2 text-right font-normal">티커</th>
              <th className="pb-2 text-right font-normal">비중</th>
              <th className="pb-2 text-right font-normal">수익률</th>
            </tr>
          </thead>
          <tbody>
            {pf.positions.map((p) => (
              <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                <td className="py-3">{p.name}</td>
                <td className="num py-3 text-right text-fg-muted">{p.ticker}</td>
                <td className="num py-3 text-right">{p.weight}%</td>
                <td className={`num py-3 text-right ${pnlColor(p.pnl_pct)}`}>{pct(p.pnl_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>분석 리포트 자리</CardTitle>
        <div className="rounded-sm border border-dashed border-border p-6 text-sm text-fg-muted">
          현태 모듈에서 LLM 분석 리포트 공급 예정 (특성/투자자 유형/리스크/강점/개선 제안).
        </div>
      </Card>
    </div>
  );
}
