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
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      {/* 영웅 평가금액 */}
      <section className="col-span-12 rounded-xl border border-border bg-bg-surface p-8 lg:p-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="caption">평가금액</p>
          {pf.source === "mock" && (
            <span className="rounded-sm border border-warn px-2 py-0.5 text-[10px] font-medium text-warn">
              데모 데이터
            </span>
          )}
        </div>
        <p className="num display mt-4 text-[56px] sm:text-[72px]">
          {krw(pf.total_value_krw)}
          <span className="ml-2 text-2xl font-medium text-fg-secondary">원</span>
        </p>
        <p className={`num mt-3 text-xl ${pnlColor(pf.total_pnl_krw)}`}>
          {pnlSign}
          {krw(pf.total_pnl_krw)}원 · {pct(pf.pnl_pct)}
        </p>
      </section>

      {/* KPI 3개 */}
      <Tile span="col-span-12 lg:col-span-4" label="보유 종목" value={`${pf.positions.length}개`} />
      <Tile span="col-span-6 lg:col-span-4" label="국내" value={`${domestic}개`} />
      <Tile span="col-span-6 lg:col-span-4" label="해외" value={`${overseas}개`} />

      {/* 보유 종목 표 */}
      <section className="col-span-12 rounded-xl border border-border bg-bg-base p-7">
        <h2 className="subhead mb-5 text-lg">보유 종목</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th className="pb-3 font-medium">종목</th>
              <th className="pb-3 text-right font-medium">티커</th>
              <th className="pb-3 text-right font-medium">비중</th>
              <th className="pb-3 text-right font-medium">수익률</th>
            </tr>
          </thead>
          <tbody>
            {pf.positions.map((p) => (
              <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="num py-3 text-right text-fg-muted">{p.ticker}</td>
                <td className="num py-3 text-right">{p.weight}%</td>
                <td className={`num py-3 text-right font-medium ${pnlColor(p.pnl_pct)}`}>
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

function Tile({
  label,
  value,
  span,
}: {
  label: string;
  value: string;
  span: string;
}) {
  return (
    <div className={`${span} rounded-xl border border-border bg-bg-base p-6`}>
      <p className="caption">{label}</p>
      <p className="num mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
