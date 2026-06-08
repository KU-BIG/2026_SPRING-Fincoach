import { useEffect, useState } from "react";
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

  const totalKrw = pf ? krw(pf.total_value_krw) : "—";
  const pnlSign = pf && pf.total_pnl_krw >= 0 ? "+" : "";
  const top = pf?.positions[0];

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-5">
      {/* Hero: 평가금액 + 시장 한 줄 */}
      <section className="col-span-12 rounded-xl border border-border bg-bg-surface p-8 lg:p-10">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="caption">{market ? `${market.market_date} 시장` : "오늘"}</p>
          {usesDemoData && (
            <span className="rounded-sm border border-warn px-2 py-0.5 text-[10px] font-medium text-warn">
              데모 데이터
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="caption mb-2">지금 내 포트폴리오</p>
            <p className="num display text-[56px] sm:text-[72px]">
              {totalKrw}
              <span className="ml-2 text-2xl font-medium text-fg-secondary">원</span>
            </p>
            {pf && (
              <p className={`num mt-2 text-lg ${pnlColor(pf.total_pnl_krw)}`}>
                {pnlSign}
                {krw(pf.total_pnl_krw)}원 · {pct(pf.pnl_pct)}
              </p>
            )}
          </div>
          <div className="max-w-md">
            <p className="caption mb-2">오늘 시장 한 줄</p>
            <p className="headline text-xl text-fg-primary">
              {market?.daily_market_summary ?? "시장 데이터를 가져오는 중"}
            </p>
          </div>
        </div>
      </section>

      {/* KPI Bento × 4 */}
      <Tile span="col-span-6 lg:col-span-3" label="평가금액" value={`${totalKrw}원`} />
      <Tile
        span="col-span-6 lg:col-span-3"
        label="총 손익"
        value={pf ? `${pnlSign}${krw(pf.total_pnl_krw)}원` : "—"}
        valueClass={pf ? pnlColor(pf.total_pnl_krw) : ""}
      />
      <Tile
        span="col-span-6 lg:col-span-3"
        label="수익률"
        value={pf ? pct(pf.pnl_pct) : "—"}
        valueClass={pf ? pnlColor(pf.pnl_pct) : ""}
      />
      <Tile
        span="col-span-6 lg:col-span-3"
        label="보유 종목"
        value={pf ? `${pf.positions.length}개` : "—"}
      />

      {/* 보유 종목 표 (큰 박스) + 시장 키워드 (작은 박스) */}
      <section className="col-span-12 rounded-xl border border-border bg-bg-base p-7 lg:col-span-7">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="subhead text-lg">내가 보유한 종목</h2>
          <span className="text-xs text-fg-muted">{pf?.positions.length ?? 0}개</span>
        </div>
        {pf && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted">
                <th className="pb-3 font-medium">종목</th>
                <th className="pb-3 text-right font-medium">비중</th>
                <th className="pb-3 text-right font-medium">수익률</th>
              </tr>
            </thead>
            <tbody>
              {pf.positions.map((p) => (
                <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="num text-xs text-fg-muted">{p.ticker}</div>
                  </td>
                  <td className="num py-3 text-right">{p.weight}%</td>
                  <td className={`num py-3 text-right font-medium ${pnlColor(p.pnl_pct)}`}>
                    {pct(p.pnl_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="col-span-12 rounded-xl border border-border bg-bg-surface p-7 lg:col-span-5">
        <p className="caption">지금 시장이 주목하는</p>
        <h2 className="subhead mt-1 text-lg">키워드</h2>
        <ol className="mt-5 space-y-2">
          {market?.trending_keywords.map((k, i) => (
            <li
              key={k.keyword}
              className="flex items-baseline justify-between rounded-sm px-2 py-2 transition hover:bg-bg-muted"
            >
              <span className="flex items-baseline gap-4 text-sm">
                <span className="num w-6 text-fg-muted">0{i + 1}</span>
                <span className="font-medium">{k.keyword}</span>
              </span>
              <span className={`num text-xs font-medium ${pnlColor(k.delta)}`}>
                {k.delta > 0 ? "+" : ""}
                {k.delta}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 코치 한마디 (큰 인용) */}
      <section className="col-span-12 rounded-xl border border-border bg-bg-base p-8 lg:p-10">
        <p className="caption mb-4">코치 한마디</p>
        <p className="headline text-2xl text-fg-primary lg:text-3xl">
          {pf && top
            ? `비중이 가장 큰 종목은 ${top.name}. 한 종목 비중이 30%를 넘으면 집중 위험을 점검할 시점이에요.`
            : "포트폴리오가 들어오면 여기에 짚어볼 것을 정리합니다."}
        </p>
        <p className="mt-5 text-xs text-fg-muted">
          정보 제공 목적이며 투자 권유가 아닙니다.
        </p>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  valueClass = "",
  span,
}: {
  label: string;
  value: string;
  valueClass?: string;
  span: string;
}) {
  return (
    <div className={`${span} rounded-xl border border-border bg-bg-base p-6`}>
      <p className="caption">{label}</p>
      <p className={`num mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
