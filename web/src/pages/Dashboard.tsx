import { useEffect, useState } from "react";
import { Card, CardLabel, CardTitle } from "@/components/Card";
import { api } from "@/lib/api";
import { krw, pct, pnlColor } from "@/lib/format";

export default function Dashboard() {
  const [market, setMarket] = useState<Awaited<ReturnType<typeof api.marketSummary>> | null>(
    null,
  );
  const [pf, setPf] = useState<Awaited<ReturnType<typeof api.portfolioSummary>> | null>(null);
  const usesDemoData = market?.source === "mock" || pf?.source === "mock";

  useEffect(() => {
    api.marketSummary().then(setMarket);
    api.portfolioSummary().then(setPf);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-fg-muted">
            {market ? `${market.market_date} 시장 브리핑` : "시장 브리핑을 불러오는 중..."}
          </p>
          {usesDemoData && (
            <span className="rounded-xs border border-warn px-2 py-0.5 text-xs text-fg-secondary">
              데모 데이터
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold leading-snug">
          {market?.daily_market_summary ?? "시장 데이터 불러오는 중"}
        </h1>
        {usesDemoData && (
          <p className="mt-2 text-xs text-fg-muted">
            API 연결 전 또는 호출 실패 시 표시되는 샘플 데이터입니다.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardLabel>포트폴리오 요약</CardLabel>
          <CardTitle className="mt-2">
            {pf ? (
              <>
                <span className="num">{krw(pf.total_value_krw)}</span>
                <span className="ml-1 text-sm text-fg-muted">원</span>
              </>
            ) : (
              "—"
            )}
          </CardTitle>
          {pf && (
            <div className="num text-sm">
              <span className={pnlColor(pf.total_pnl_krw)}>
                {pf.total_pnl_krw >= 0 ? "+" : ""}
                {krw(pf.total_pnl_krw)}원
              </span>
              <span className={`ml-2 ${pnlColor(pf.pnl_pct)}`}>{pct(pf.pnl_pct)}</span>
            </div>
          )}
          {pf && (
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-muted">
                  <th className="pb-2 font-normal">종목</th>
                  <th className="pb-2 text-right font-normal">비중</th>
                  <th className="pb-2 text-right font-normal">수익률</th>
                </tr>
              </thead>
              <tbody>
                {pf.positions.map((p) => (
                  <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                    <td className="py-2">
                      <div>{p.name}</div>
                      <div className="num text-xs text-fg-muted">{p.ticker}</div>
                    </td>
                    <td className="num py-2 text-right">{p.weight}%</td>
                    <td className={`num py-2 text-right ${pnlColor(p.pnl_pct)}`}>
                      {pct(p.pnl_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardLabel>오늘의 키워드</CardLabel>
          <ul className="mt-3 space-y-2">
            {market?.trending_keywords.map((k) => (
              <li
                key={k.keyword}
                className="flex items-baseline justify-between rounded-sm px-2 py-1.5 transition hover:bg-bg-muted"
              >
                <span className="text-sm">{k.keyword}</span>
                <span className="num text-xs text-fg-muted">
                  {k.score}
                  <span className={`ml-2 ${pnlColor(k.delta)}`}>
                    {k.delta > 0 ? "+" : ""}
                    {k.delta}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardLabel>차트 자리</CardLabel>
        <CardTitle className="mt-2">누적 수익 vs KOSPI</CardTitle>
        <div className="mt-4 flex h-48 items-center justify-center rounded-sm border border-dashed border-border text-sm text-fg-muted">
          차트 구현 자리 (현태 모듈 연결 예정)
        </div>
      </Card>
    </div>
  );
}
