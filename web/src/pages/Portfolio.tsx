import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { krw, pct, pnlColor } from "@/lib/format";

export default function Portfolio() {
  const [pf, setPf] = useState<Awaited<ReturnType<typeof api.portfolioSummary>> | null>(null);
  useEffect(() => {
    api.portfolioSummary().then(setPf);
  }, []);

  if (!pf) return <div className="text-fg-muted">불러오는 중</div>;

  const pnlSign = pf.total_pnl_krw >= 0 ? "+" : "";
  const domestic = pf.positions.filter((p) => /^\d/.test(p.ticker)).length;
  const overseas = pf.positions.length - domestic;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="headline text-xl">내 자산</h1>
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
              <th className="pb-2 font-medium">종목</th>
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
