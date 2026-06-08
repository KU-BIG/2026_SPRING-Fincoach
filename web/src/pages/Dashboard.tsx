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
    <div className="space-y-4">
      {/* 페이지 헤더 */}
      <div className="flex items-baseline justify-between">
        <h1 className="headline text-xl">홈</h1>
        {usesDemoData && (
          <span className="rounded-sm border border-warn px-2 py-0.5 text-[10px] font-medium text-warn">
            데모 데이터
          </span>
        )}
      </div>

      {/* 상단: 평가금액 + 시장 요약 */}
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-lg border border-border bg-bg-surface p-6 lg:col-span-7">
          <p className="caption">총 평가금액</p>
          <p className="num mt-2 text-3xl font-bold sm:text-4xl">
            {totalKrw}
            <span className="ml-1 text-base font-medium text-fg-secondary">원</span>
          </p>
          {pf && (
            <p className={`num mt-1 text-sm font-medium ${pnlColor(pf.total_pnl_krw)}`}>
              {pnlSign}
              {krw(pf.total_pnl_krw)}원 · {pct(pf.pnl_pct)}
            </p>
          )}
        </section>

        <section className="col-span-12 rounded-lg border border-border bg-bg-surface p-6 lg:col-span-5">
          <p className="caption">시장 요약</p>
          <p className="mt-2 text-xs text-fg-muted">
            {market?.market_date ?? ""}
          </p>
          <p className="mt-1 text-[15px] leading-6 text-fg-primary">
            {market?.daily_market_summary ?? "시장 데이터를 가져오는 중입니다."}
          </p>
        </section>
      </div>

      {/* KPI 4개 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="평가금액" value={`${totalKrw}원`} />
        <Tile
          label="평가 손익"
          value={pf ? `${pnlSign}${krw(pf.total_pnl_krw)}원` : "—"}
          valueClass={pf ? pnlColor(pf.total_pnl_krw) : ""}
        />
        <Tile
          label="수익률"
          value={pf ? pct(pf.pnl_pct) : "—"}
          valueClass={pf ? pnlColor(pf.pnl_pct) : ""}
        />
        <Tile label="보유 종목" value={pf ? `${pf.positions.length}개` : "—"} />
      </div>

      {/* 보유 종목 + 주요 키워드 */}
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-lg border border-border bg-bg-base p-6 lg:col-span-7">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="subhead text-base">보유 종목</h2>
            <span className="text-xs text-fg-muted">{pf?.positions.length ?? 0}개</span>
          </div>
          {pf && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-fg-muted">
                  <th className="pb-2 font-medium">종목</th>
                  <th className="pb-2 text-right font-medium">비중</th>
                  <th className="pb-2 text-right font-medium">수익률</th>
                </tr>
              </thead>
              <tbody>
                {pf.positions.map((p) => (
                  <tr key={p.ticker} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5">
                      <div className="font-medium">{p.name}</div>
                      <div className="num text-xs text-fg-muted">{p.ticker}</div>
                    </td>
                    <td className="num py-2.5 text-right">{p.weight}%</td>
                    <td className={`num py-2.5 text-right font-medium ${pnlColor(p.pnl_pct)}`}>
                      {pct(p.pnl_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="col-span-12 rounded-lg border border-border bg-bg-base p-6 lg:col-span-5">
          <h2 className="subhead text-base">주요 키워드</h2>
          <p className="mt-1 text-xs text-fg-muted">시장 거론 빈도 기준</p>
          <ol className="mt-4 space-y-1">
            {market?.trending_keywords.map((k, i) => (
              <li
                key={k.keyword}
                className="flex items-baseline justify-between rounded-sm px-2 py-2 transition hover:bg-bg-muted"
              >
                <span className="flex items-baseline gap-3 text-sm">
                  <span className="num w-5 text-xs text-fg-muted">{i + 1}</span>
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
      </div>

      {/* 포트폴리오 인사이트 */}
      <section className="rounded-lg border border-border bg-bg-base p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="subhead text-base">포트폴리오 인사이트</h2>
          <span className="text-xs text-fg-muted">AI 자동 분석</span>
        </div>
        <p className="mt-3 text-[15px] leading-7 text-fg-primary">
          {pf && top
            ? `최대 비중 종목은 ${top.name}입니다. 단일 종목 비중이 30%를 상회할 경우 집중 위험에 대한 점검이 필요합니다.`
            : "포트폴리오가 입력되면 자동 분석이 표시됩니다."}
        </p>
        <p className="mt-3 text-xs text-fg-muted">
          본 분석은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
        </p>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-5">
      <p className="caption">{label}</p>
      <p className={`num mt-2 text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
