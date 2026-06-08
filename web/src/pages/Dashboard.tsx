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

  return (
    <div className="space-y-10">
      {/* 매거진 1면 헤드라인 */}
      <section>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="caption">{market ? `${market.market_date} · 시장` : "오늘 시장"}</p>
          {usesDemoData && (
            <span className="caption text-warn">데모 데이터</span>
          )}
        </div>
        <h1 className="serif mt-3 text-[40px] font-semibold leading-[1.15] tracking-tight">
          {market?.daily_market_summary ?? "시장 데이터를 가져오는 중"}
        </h1>
      </section>

      {/* 가로 지표 띠 — 매거진 디지스트 */}
      {pf && (
        <section className="border-y border-border-strong">
          <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
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
        </section>
      )}

      {/* 본문 2컬럼: 보유 종목 / 시장 주목 */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="caption">내가 보유한 종목</p>
          <h2 className="serif mt-1 text-2xl font-semibold">지금 내 포트폴리오의 무게중심</h2>
          {pf && (
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="rule-strong border-t text-left">
                  <th className="caption py-2 font-medium">종목</th>
                  <th className="caption py-2 text-right font-medium">비중</th>
                  <th className="caption py-2 text-right font-medium">수익률</th>
                </tr>
              </thead>
              <tbody>
                {pf.positions.map((p) => (
                  <tr key={p.ticker} className="border-t border-border">
                    <td className="py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="num mt-0.5 text-xs text-fg-muted">{p.ticker}</div>
                    </td>
                    <td className="num py-3 text-right">{p.weight}%</td>
                    <td className={`num py-3 text-right ${pnlColor(p.pnl_pct)}`}>
                      {pct(p.pnl_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside>
          <p className="caption">시장이 주목하는</p>
          <h2 className="serif mt-1 text-2xl font-semibold">이번 주 키워드</h2>
          <ol className="mt-5 space-y-3">
            {market?.trending_keywords.map((k, i) => (
              <li
                key={k.keyword}
                className="flex items-baseline justify-between border-b border-border pb-3 last:border-0"
              >
                <span className="flex items-baseline gap-4">
                  <span className="serif num w-5 text-lg font-medium text-fg-muted">
                    {i + 1}
                  </span>
                  <span className="text-[15px]">{k.keyword}</span>
                </span>
                <span className={`num text-xs ${pnlColor(k.delta)}`}>
                  {k.delta > 0 ? "+" : ""}
                  {k.delta}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* 본문 2컬럼: 시장 흐름 / 코치 한마디 */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <article>
          <p className="caption">오늘 짚어볼 것</p>
          <h2 className="serif mt-1 text-2xl font-semibold leading-snug">
            시장 흐름 한 줄
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-fg-secondary">
            {market?.daily_market_summary ??
              "시장 데이터가 들어오면 여기에 핵심 흐름을 짚어드립니다."}
          </p>
        </article>

        <article className="border-l-0 lg:border-l lg:border-border lg:pl-10">
          <p className="caption">코치 한마디</p>
          <blockquote className="serif mt-1 text-xl italic leading-[1.6] text-fg-primary">
            {pf
              ? `보유 종목 ${pf.positions.length}개 중 비중이 가장 큰 종목은 ${
                  pf.positions[0]?.name ?? "—"
                }입니다. 한 종목 비중이 30%를 넘으면 집중 위험을 점검할 시점이에요.`
              : "포트폴리오가 들어오면 여기에 짚어볼 것을 정리합니다."}
          </blockquote>
          <p className="caption mt-4">정보 제공 · 투자 권유 아님</p>
        </article>
      </section>
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
    <div className="px-5 py-4">
      <p className="caption">{label}</p>
      <p className={`num mt-2 text-[22px] font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
