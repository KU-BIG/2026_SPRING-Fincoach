import { useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/Card";
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
      {/* 히어로: 시장 한 줄 요약 */}
      <section className="border-b border-border pb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-xs uppercase tracking-wide text-fg-muted">
            {market ? `${market.market_date} 시장` : "오늘 시장"}
          </p>
          {usesDemoData && (
            <span className="rounded-xs border border-warn px-2 py-0.5 text-[10px] font-medium text-warn">
              데모 데이터
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold leading-snug">
          {market?.daily_market_summary ?? "시장 데이터를 가져오는 중"}
        </h1>
      </section>

      {/* 4지표 가로 띠 */}
      {pf && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
          <KPI label="평가금액" value={`${krw(pf.total_value_krw)}원`} />
          <KPI
            label="총 손익"
            value={`${pf.total_pnl_krw >= 0 ? "+" : ""}${krw(pf.total_pnl_krw)}원`}
            valueClass={pnlColor(pf.total_pnl_krw)}
          />
          <KPI
            label="수익률"
            value={pct(pf.pnl_pct)}
            valueClass={pnlColor(pf.pnl_pct)}
          />
          <KPI label="보유 종목" value={`${pf.positions.length}개`} />
        </div>
      )}

      {/* 메인 영역: 좌 보유 종목 표 (2/3) + 우 시장 키워드 (1/3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">내가 보유한 종목</h2>
            <span className="text-xs text-fg-muted">{pf?.positions.length ?? 0}개</span>
          </div>
          {pf && (
            <table className="w-full text-sm">
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
                      <div className="font-medium">{p.name}</div>
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
          <CardLabel>지금 시장이 주목하는</CardLabel>
          <ol className="mt-3 space-y-1.5">
            {market?.trending_keywords.map((k, i) => (
              <li
                key={k.keyword}
                className="flex items-baseline justify-between rounded-sm px-2 py-1.5 transition hover:bg-bg-muted"
              >
                <span className="flex items-baseline gap-3 text-sm">
                  <span className="num w-4 text-xs text-fg-muted">{i + 1}</span>
                  <span>{k.keyword}</span>
                </span>
                <span className={`num text-xs ${pnlColor(k.delta)}`}>
                  {k.delta > 0 ? "+" : ""}
                  {k.delta}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* 하단: 시장 인사이트 + 코치 코멘트 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardLabel>오늘 짚어볼 것</CardLabel>
          <h3 className="mt-2 text-base font-semibold">시장 흐름 요약</h3>
          <p className="mt-3 text-[15px] leading-7 text-fg-secondary">
            {market?.daily_market_summary ??
              "시장 데이터가 들어오면 여기에 핵심 흐름을 정리합니다."}
          </p>
        </Card>

        <Card className="bg-accent-soft/50">
          <CardLabel>코치가 짚는 것</CardLabel>
          <h3 className="mt-2 text-base font-semibold">
            {pf && pf.total_pnl_krw >= 0 ? "지금 잘 가고 있어요" : "한 번 돌아볼 시점"}
          </h3>
          <p className="mt-3 text-[15px] leading-7 text-fg-secondary">
            {pf
              ? `보유 종목 ${pf.positions.length}개 중 비중이 가장 큰 종목은 ${
                  pf.positions[0]?.name ?? "—"
                }입니다. 한 종목 비중이 30%를 넘으면 집중 위험을 점검할 시점이에요.`
              : "포트폴리오가 들어오면 여기에 짚어볼 것을 정리합니다."}
          </p>
          <p className="mt-3 text-xs text-fg-muted">
            정보 제공 목적이며 투자 권유가 아닙니다.
          </p>
        </Card>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-bg-surface p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={`num mt-1 text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
