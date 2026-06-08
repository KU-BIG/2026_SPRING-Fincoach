import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { krw, pct, pnlColor } from "@/lib/format";

export default function Portfolio() {
  const [pf, setPf] = useState<Awaited<ReturnType<typeof api.portfolioSummary>> | null>(null);
  useEffect(() => {
    api.portfolioSummary().then(setPf);
  }, []);

  if (!pf) {
    return <p className="text-fg-muted">불러오는 중…</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="caption">포트폴리오</p>
        <h1 className="serif mt-2 text-[40px] font-semibold leading-[1.15]">
          평가금액 <span className="num">{krw(pf.total_value_krw)}</span>
          <span className="ml-1 text-2xl font-normal text-fg-secondary">원</span>
        </h1>
        <p className={`num mt-3 text-base ${pnlColor(pf.total_pnl_krw)}`}>
          {pf.total_pnl_krw >= 0 ? "+" : ""}
          {krw(pf.total_pnl_krw)}원 · {pct(pf.pnl_pct)}
        </p>
      </section>

      <section className="grid grid-cols-2 border-y border-border-strong md:grid-cols-3">
        <KPI label="보유 종목" value={`${pf.positions.length}개`} />
        <KPI label="국내 종목" value={`${pf.positions.filter((p) => p.ticker.endsWith(".KS") || p.ticker.endsWith(".KQ")).length}개`} />
        <KPI label="해외 종목" value={`${pf.positions.filter((p) => !p.ticker.endsWith(".KS") && !p.ticker.endsWith(".KQ")).length}개`} />
      </section>

      <section>
        <p className="caption">보유 종목</p>
        <h2 className="serif mt-1 text-2xl font-semibold">전체 명세</h2>
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-t border-border-strong text-left">
              <th className="caption py-2 font-medium">종목</th>
              <th className="caption py-2 text-right font-medium">티커</th>
              <th className="caption py-2 text-right font-medium">비중</th>
              <th className="caption py-2 text-right font-medium">수익률</th>
            </tr>
          </thead>
          <tbody>
            {pf.positions.map((p) => (
              <tr key={p.ticker} className="border-t border-border">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="num py-3 text-right text-fg-muted">{p.ticker}</td>
                <td className="num py-3 text-right">{p.weight}%</td>
                <td className={`num py-3 text-right ${pnlColor(p.pnl_pct)}`}>{pct(p.pnl_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="border-t border-border-strong pt-8">
        <p className="caption">코치 분석</p>
        <h2 className="serif mt-1 text-2xl font-semibold">아직 준비 중</h2>
        <p className="mt-3 text-[15px] leading-[1.75] text-fg-secondary">
          포트폴리오 특성·리스크·강점 분석은 현태 모듈에서 LLM 리포트로 공급됩니다.
        </p>
      </section>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border">
      <p className="caption">{label}</p>
      <p className="num mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
