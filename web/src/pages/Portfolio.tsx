import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  stocks,
  buildStockRow,
  buildExpandPanel,
  buildBars7d,
  buildPnlCombo,
  buildRetGauge,
  buildLineData,
  buildDonut,
  buildHeaderStats,
  buildChart,
} from "../lib/portfolioCharts";
import {
  getPortfolioAnalysis,
  postPortfolioAnalysis,
  postPortfolioSummary,
  isLiveAnalysis,
  type DataSource,
  type HoldingInput,
  type PortfolioSummary,
} from "../lib/api";
import { useAuth } from "../auth/context";
import { supabase } from "../lib/supabase";
import SourceBadge from "../components/SourceBadge";

/* AI 분석 카드 기본값 — 백엔드 미연결 시 보여주는 데모 쇼케이스.
   /api/portfolio/analysis 가 실 분석(키 있음)을 주면 이 값을 덮어쓴다. */
interface AnalysisView {
  sub: string;
  summary: string;
  characteristics: string[];
  strengths: string[];
  risks: string[];
  suggestions: string[];
}

const DEMO_ANALYSIS: AnalysisView = {
  sub: "데모 구성 · 백엔드 연결 시 실시간 생성",
  summary: "국내 대형주와 미국 빅테크가 섞인 성장주 포트폴리오. 반도체 사이클과 환율이 핵심 변수.",
  characteristics: ["성장주 비중 약 70%", "반도체·AI 노출 50%", "국내 60% · 해외 40%"],
  strengths: ["AI 수요 수혜 종목 집중", "분기 실적 우상향 사이클", "달러 자산으로 환율 헷지"],
  risks: ["삼성전자 단일 비중 32%", "반도체 사이클 동조 가능", "원화 강세 시 평가액 압축"],
  suggestions: ["반도체 외 섹터 비중 검토", "방어주·배당주 일부 편입", "환율 시나리오 점검"],
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

function rowsToInputs(rows: HoldingRow[]): HoldingInput[] {
  return rows
    .filter((r) => r.ticker.trim())
    .map((r) => ({
      ticker: r.ticker.trim(),
      name: r.name.trim() || r.ticker.trim(),
      shares: Number(r.shares) || 0,
      avg_price: Number(r.avg_price) || 0,
      currency: r.currency || undefined,
    }));
}

/* ── 내 종목 입력 폼 ─────────────────────────────────────────────────────── */

interface HoldingRow {
  ticker: string;
  name: string;
  shares: string;
  avg_price: string;
  currency: string;
}

const EMPTY_ROW: HoldingRow = { ticker: "", name: "", shares: "", avg_price: "", currency: "KRW" };

function HoldingsForm({
  rows,
  setRows,
  onSave,
  saving,
}: {
  rows: HoldingRow[];
  setRows: React.Dispatch<React.SetStateAction<HoldingRow[]>>;
  onSave: () => void;
  saving: boolean;
}) {
  const update = (i: number, field: keyof HoldingRow, value: string) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, j) => j !== i));

  return (
    <section className="card c-12 reveal" style={{ padding: "28px", marginTop: "14px" }}>
      <div className="subhead" style={{ fontSize: "17px", marginBottom: "14px" }}>
        내 종목 입력
      </div>
      <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "14px" }}>
        보유 종목을 입력하면 실제 포트폴리오 기반으로 분석합니다.
      </div>
      <table style={{ width: "100%", maxWidth: "760px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "13px" }}>티커</th>
            <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "13px" }}>종목명</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "13px" }}>수량</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "13px" }}>평균단가</th>
            <th style={{ textAlign: "center", padding: "6px 8px", fontSize: "13px" }}>통화</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="text"
                  placeholder="005930.KS"
                  value={r.ticker}
                  onChange={(e) => update(i, "ticker", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--fg)" }}
                />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="text"
                  placeholder="삼성전자"
                  value={r.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--fg)" }}
                />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="number"
                  placeholder="10"
                  value={r.shares}
                  onChange={(e) => update(i, "shares", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--fg)", textAlign: "right" }}
                />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="number"
                  placeholder="70000"
                  value={r.avg_price}
                  onChange={(e) => update(i, "avg_price", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--fg)", textAlign: "right" }}
                />
              </td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                <select
                  value={r.currency}
                  onChange={(e) => update(i, "currency", e.target.value)}
                  style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--fg)" }}
                >
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                </select>
              </td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                <button
                  onClick={() => removeRow(i)}
                  style={{ background: "none", border: "none", color: "var(--red, #e55)", cursor: "pointer", fontSize: "16px" }}
                  title="삭제"
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button
          className="toggle-btn"
          onClick={addRow}
          style={{ borderColor: "var(--blue)", color: "var(--blue)", fontWeight: 600 }}
        >
          + 종목 추가
        </button>
        <button
          className="toggle-btn active"
          onClick={onSave}
          disabled={saving || (rows.length > 0 && rows.every((r) => !r.ticker.trim()))}
        >
          {saving ? "저장 중..." : "저장 & 분석"}
        </button>
      </div>
    </section>
  );
}

/* ── 유저 실데이터 대시보드 ─────────────────────────────────────────────
   로그인 + 종목 저장 시 데모 쇼케이스 대신 이 대시보드를 보여준다.
   POST /api/portfolio/summary 의 실값(총평가·손익·종목별 비중/수익률/평가액)으로
   히어로 + KPI 4 + 비중 도넛 + 보유종목 표를 채운다.
   30일 시계열 차트는 가격 이력 API 부재로 현재 제외(후속 작업). */

const DONUT_PALETTE = [
  "#FF2047", "#3B9EFF", "#11FF99", "#FFC53D", "#A78BFA",
  "#FF7E36", "#22D3EE", "#F472B6", "#84CC16", "#FB7185",
];

function fmtKRW(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}
function compactKRW(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "억";
  if (a >= 1e4) return Math.round(n / 1e4).toLocaleString("ko-KR") + "만";
  return Math.round(n).toLocaleString("ko-KR");
}

function UserPortfolioDashboard({ summary }: { summary: PortfolioSummary }) {
  const positions = [...summary.positions].sort((a, b) => b.weight - a.weight);
  const pnlCls = summary.pnl_pct >= 0 ? "pos" : "neg";
  const sign = (n: number) => (n >= 0 ? "+" : "");
  const top = positions[0];

  // 도넛 arcs (stroke-dasharray 누적, viewBox 36 · r=15.915 → 둘레 ≈ 100)
  let offset = 0;
  const arcs = positions.map((p, i) => {
    const len = p.weight;
    const gap = 0.6;
    const el = (
      <circle
        key={p.ticker}
        cx="18" cy="18" r="15.915" fill="transparent"
        stroke={DONUT_PALETTE[i % DONUT_PALETTE.length]}
        strokeWidth="3.6"
        strokeDasharray={`${Math.max(0, len - gap).toFixed(2)} ${(100 - len + gap).toFixed(2)}`}
        strokeDashoffset={(-offset).toFixed(2)}
        transform="rotate(-90 18 18)"
      />
    );
    offset += len;
    return el;
  });

  const stats = [
    { l: "보유 종목", v: `${positions.length}개`, c: "" },
    { l: "최대 비중", v: top ? `${top.name} ${top.weight}%` : "—", c: "" },
    { l: "평가 손익", v: `${sign(summary.total_pnl_krw)}${compactKRW(summary.total_pnl_krw)}원`, c: pnlCls },
    { l: "수익률", v: `${sign(summary.pnl_pct)}${summary.pnl_pct}%`, c: pnlCls },
  ];

  return (
    <>
      {/* 히어로 — 실데이터 총평가 + 손익 + 요약 스탯 */}
      <section className="card c-12 reveal" style={{ marginTop: "14px", padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--fg-muted)", marginBottom: "10px" }}>
          내 총 평가금액
          <SourceBadge source="live" liveLabel="실시간" demoLabel="" />
        </div>
        <div className="num" style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {fmtKRW(summary.total_value_krw)}
          <span style={{ fontSize: "20px", color: "var(--fg-muted)", fontWeight: 600, marginLeft: "4px" }}>원</span>
        </div>
        <div className={`num ${pnlCls}`} style={{ fontSize: "16px", fontWeight: 600, marginTop: "8px" }}>
          {sign(summary.total_pnl_krw)}{fmtKRW(summary.total_pnl_krw)}원 · {sign(summary.pnl_pct)}{summary.pnl_pct}%
        </div>
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", marginTop: "22px", paddingTop: "20px", borderTop: "1px solid var(--frost-alt)" }}>
          {stats.map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginBottom: "5px" }}>{s.l}</div>
              <div className={`num ${s.c}`} style={{ fontSize: "15px", fontWeight: 700 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI — 실데이터 */}
      <div className="grid grid-12" style={{ marginTop: "14px" }}>
        <div className="card kpi c-3 reveal">
          <div className="lbl">평가금액</div>
          <div className="val num">
            {fmtKRW(summary.total_value_krw)}
            <span style={{ fontSize: "14px", color: "var(--fg-muted)", fontWeight: 500, marginLeft: "2px" }}>원</span>
          </div>
          <div className="sub">현재 평가액</div>
        </div>
        <div className="card kpi c-3 reveal" style={{ transitionDelay: "80ms" }}>
          <div className="lbl">평가 손익</div>
          <div className={`val num ${pnlCls}`}>{sign(summary.total_pnl_krw)}{fmtKRW(summary.total_pnl_krw)}원</div>
          <div className="sub">매수 평단 대비</div>
        </div>
        <div className="card kpi c-3 reveal" style={{ transitionDelay: "160ms" }}>
          <div className="lbl">수익률</div>
          <div className={`val num ${pnlCls}`}>{sign(summary.pnl_pct)}{summary.pnl_pct}%</div>
          <div className="sub">전체 가중 수익률</div>
        </div>
        <div className="card kpi c-3 reveal" style={{ transitionDelay: "240ms" }}>
          <div className="lbl">보유 종목</div>
          <div className="val num">{positions.length}개</div>
          <div className="sub">{top ? `최대 비중 ${top.name}` : "종목 없음"}</div>
        </div>
      </div>

      {/* 비중 도넛 + 보유 종목 표 — 실데이터 */}
      <div className="grid grid-12" style={{ marginTop: "14px" }}>
        <section className="card c-5 donut-card reveal">
          <div className="subhead" style={{ fontSize: "17px" }}>비중 분포</div>
          <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>{positions.length}개 종목</div>
          <div className="donut-wrap">
            <svg className="donut" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="3.6" />
              {arcs}
              <text x="18" y="17" textAnchor="middle" style={{ fontFamily: "Inter", fontSize: "3.5px", fontWeight: 700, fill: "var(--fg-primary)" }}>
                {positions.length}
              </text>
              <text x="18" y="21.2" textAnchor="middle" style={{ fontFamily: "JetBrains Mono", fontSize: "1.7px", fill: "var(--fg-muted)", letterSpacing: "0.08em" }}>
                STOCKS
              </text>
            </svg>
            <div className="legend">
              {positions.map((p, i) => (
                <div className="legend-row" key={p.ticker}>
                  <span className="swatch" style={{ background: DONUT_PALETTE[i % DONUT_PALETTE.length] }}></span>
                  {p.name}
                  <span className="right num">{p.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card c-7 reveal" style={{ transitionDelay: "100ms" }}>
          <div className="subhead" style={{ fontSize: "17px" }}>보유 종목</div>
          <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>비중 · 수익률 · 평가액</div>
          <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px", fontSize: "13px", color: "var(--fg-muted)" }}>종목</th>
                <th style={{ textAlign: "right", padding: "8px", fontSize: "13px", color: "var(--fg-muted)" }}>비중</th>
                <th style={{ textAlign: "right", padding: "8px", fontSize: "13px", color: "var(--fg-muted)" }}>수익률</th>
                <th style={{ textAlign: "right", padding: "8px", fontSize: "13px", color: "var(--fg-muted)" }}>평가액</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={p.ticker} style={{ borderTop: "1px solid var(--frost-alt)" }}>
                  <td style={{ padding: "11px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: DONUT_PALETTE[i % DONUT_PALETTE.length], flexShrink: 0 }}></span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--fg-muted)", fontFamily: "JetBrains Mono" }}>{p.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: "11px 8px", verticalAlign: "middle" }}>
                    <div className="num" style={{ fontWeight: 600 }}>{p.weight}%</div>
                    <div style={{ height: "3px", background: "var(--bg-elevated-2)", borderRadius: "2px", marginTop: "5px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, p.weight)}%`, background: DONUT_PALETTE[i % DONUT_PALETTE.length] }}></div>
                    </div>
                  </td>
                  <td className={`num ${p.pnl_pct >= 0 ? "pos" : "neg"}`} style={{ textAlign: "right", padding: "11px 8px", fontWeight: 600, verticalAlign: "middle" }}>
                    {p.pnl_pct >= 0 ? "+" : ""}{p.pnl_pct}%
                  </td>
                  <td className="num" style={{ textAlign: "right", padding: "11px 8px", verticalAlign: "middle" }}>
                    {fmtKRW(p.current_value_krw)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

/* /site/portfolio.html <main class="page-pad"> 를 그대로(verbatim) 이식.
   page-head / hero-card / KPI 4 / 보유 종목 표 / 도넛 + 라인차트 / AI 분석.
   인라인 <script> 의 동적 렌더(차트·표·도넛·KPI)는 useEffect 에서 원본과
   같은 순서로 호출해 동일 DOM/SVG 를 주입한다. 종목 행 클릭 펼침도 동일 이식.

   단, hero/KPI/보유종목상세/도넛/차트는 데모용 고정 데이터(예시)다. 실제 보유종목이
   없을 때(비로그인/미입력)는 이 쇼케이스를 흐릿하게(블러) 처리하고 로그인/입력 유도
   오버레이를 덮어 "예시"임을 분명히 한다. 로그인 + 종목 저장 시에는 쇼케이스를 숨기고
   실데이터(내 포트폴리오 요약)를 보여준다. */
export default function Portfolio() {
  const ranRef = useRef(false);
  const [analysis, setAnalysis] = useState<AnalysisView>(DEMO_ANALYSIS);
  const [analysisSource, setAnalysisSource] = useState<DataSource>("demo");

  /* ── 유저 holdings 상태 ──────────────────────────────────────────────── */
  const { user, configured, openAuth } = useAuth();
  const [holdingRows, setHoldingRows] = useState<HoldingRow[]>([{ ...EMPTY_ROW }]);
  const [saving, setSaving] = useState(false);
  const [userSummary, setUserSummary] = useState<PortfolioSummary | null>(null);
  const [holdingsLoaded, setHoldingsLoaded] = useState(false);

  /* 실제 보유종목 보유 여부 → 데모 쇼케이스 게이트 */
  const hasRealPortfolio = !!user && holdingsLoaded && rowsToInputs(holdingRows).length > 0;
  const showDemo = !hasRealPortfolio;

  /* Supabase에서 유저 holdings 로드 */
  useEffect(() => {
    if (!user || !supabase) {
      setHoldingRows([{ ...EMPTY_ROW }]);
      setUserSummary(null);
      setHoldingsLoaded(false);
      return;
    }
    setHoldingsLoaded(false);
    let alive = true;
    supabase
      .from("holdings")
      .select("ticker, name, shares, avg_price, currency")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setHoldingsLoaded(true);
          return;
        }
        if (data && data.length > 0) {
          setHoldingRows(
            data.map((h: { ticker: string; name: string; shares: number; avg_price: number; currency: string }) => ({
              ticker: h.ticker,
              name: h.name,
              shares: String(h.shares),
              avg_price: String(h.avg_price),
              currency: h.currency || "KRW",
            })),
          );
        }
        setHoldingsLoaded(true);
      });
    return () => { alive = false; };
  }, [user]);

  /* holdings 로드 후 자동으로 포트폴리오 요약 + 분석 호출 */
  useEffect(() => {
    if (!holdingsLoaded) return;
    const inputs = rowsToInputs(holdingRows);
    if (!inputs.length) return;

    postPortfolioSummary(inputs)
      .then(setUserSummary)
      .catch(() => {});

    postPortfolioAnalysis(inputs)
      .then((r) => {
        if (!isLiveAnalysis(r)) return;
        setAnalysis({
          sub: [r.portfolio_type, r.investor_match].filter(Boolean).join(" · "),
          summary: r.summary,
          characteristics: r.characteristics?.length ? r.characteristics : DEMO_ANALYSIS.characteristics,
          strengths: r.strengths?.length ? r.strengths : DEMO_ANALYSIS.strengths,
          risks: r.risks?.length ? r.risks : DEMO_ANALYSIS.risks,
          suggestions: r.suggestions?.length ? r.suggestions : DEMO_ANALYSIS.suggestions,
        });
        setAnalysisSource("live");
      })
      .catch(() => {});
  }, [holdingsLoaded, holdingRows]);

  const handleSave = useCallback(async () => {
    const inputs = rowsToInputs(holdingRows);
    setSaving(true);
    try {
      /* Supabase에 저장 (로그인 + 환경 구성 시) */
      if (user && supabase) {
        if (inputs.length > 0) {
          const rows = inputs.map((h) => ({
            user_id: user.id,
            ticker: h.ticker,
            name: h.name,
            shares: h.shares,
            avg_price: h.avg_price,
            currency: h.currency || "KRW",
          }));
          // upsert 먼저, delete 나중에 (실패 시 데이터 유실 방지)
          await supabase.from("holdings").upsert(rows, { onConflict: "user_id,ticker" });
          const keepTickers = rows.map((r) => r.ticker);
          await supabase.from("holdings").delete().eq("user_id", user.id).not("ticker", "in", `(${keepTickers.join(",")})`);
        } else {
          // 전체 삭제
          await supabase.from("holdings").delete().eq("user_id", user.id);
        }
      }

      if (inputs.length === 0) {
        setUserSummary(null);
        setAnalysis(DEMO_ANALYSIS);
        setAnalysisSource("demo");
        return;
      }

      /* 포트폴리오 요약 */
      const summary = await postPortfolioSummary(inputs);
      setUserSummary(summary);

      /* AI 분석 */
      postPortfolioAnalysis(inputs)
        .then((r) => {
          if (!isLiveAnalysis(r)) return;
          setAnalysis({
            sub: [r.portfolio_type, r.investor_match].filter(Boolean).join(" · "),
            summary: r.summary,
            characteristics: r.characteristics?.length ? r.characteristics : DEMO_ANALYSIS.characteristics,
            strengths: r.strengths?.length ? r.strengths : DEMO_ANALYSIS.strengths,
            risks: r.risks?.length ? r.risks : DEMO_ANALYSIS.risks,
            suggestions: r.suggestions?.length ? r.suggestions : DEMO_ANALYSIS.suggestions,
          });
          setAnalysisSource("live");
        })
        .catch(() => {});
    } finally {
      setSaving(false);
    }
  }, [holdingRows, user]);

  // AI 분석 (데모): 유저 holdings가 없을 때만 GET으로 데모 분석 로드
  useEffect(() => {
    if (holdingsLoaded) return; // 유저 데이터가 있으면 POST 분석을 씀
    let alive = true;
    getPortfolioAnalysis()
      .then((r) => {
        if (!alive || !isLiveAnalysis(r)) return;
        setAnalysis({
          sub: [r.portfolio_type, r.investor_match].filter(Boolean).join(" · "),
          summary: r.summary,
          characteristics: r.characteristics?.length ? r.characteristics : DEMO_ANALYSIS.characteristics,
          strengths: r.strengths?.length ? r.strengths : DEMO_ANALYSIS.strengths,
          risks: r.risks?.length ? r.risks : DEMO_ANALYSIS.risks,
          suggestions: r.suggestions?.length ? r.suggestions : DEMO_ANALYSIS.suggestions,
        });
        setAnalysisSource("live");
      })
      .catch(() => {
        /* 백엔드 미연결/타임아웃 → 데모 쇼케이스 유지 */
      });
    return () => {
      alive = false;
    };
  }, [holdingsLoaded]);

  useEffect(() => {
    // 데모 쇼케이스가 렌더된 경우에만(예시 표시) 차트/표를 주입한다.
    if (!showDemo) return;
    // StrictMode 의 dev 이중 마운트에서도 출력은 동일하지만, 클릭 핸들러 중복 바인딩과
    // 차트 hover 리스너 누적을 막기 위해 마운트당 1회만 구성한다.
    const stockTable = document.getElementById("stockTable");
    const donutChart = document.getElementById("donutChart");
    const donutLegend = document.getElementById("donutLegend");
    const bars7d = document.getElementById("bars7d");
    const pnlCombo = document.getElementById("pnlCombo");
    const retGauge = document.getElementById("retGauge");
    const heroChart = document.getElementById("heroChart");
    const lineChart = document.getElementById("lineChart");
    const stHigh = document.getElementById("stHigh");
    const stLow = document.getElementById("stLow");
    const stAvg = document.getElementById("stAvg");
    const stVol = document.getElementById("stVol");

    // ========= 보유 종목 표 (sparkline + 클릭 펼침) =========
    if (stockTable) stockTable.innerHTML = stocks.map((s, i) => buildStockRow(s, i)).join("");

    const onRowClick = (tr: Element) => () => {
      const idx = parseInt((tr as HTMLElement).dataset.idx || "0");
      const panel = document.getElementById("ep" + idx) as HTMLElement | null;
      if (!panel) return;
      const isOpen = tr.classList.toggle("open");
      if (isOpen) {
        if (!panel.innerHTML) panel.innerHTML = buildExpandPanel(stocks[idx]);
        panel.classList.add("show");
      } else {
        panel.classList.remove("show");
      }
    };
    const rowHandlers: Array<{ el: Element; fn: () => void }> = [];
    document.querySelectorAll(".stock-tr").forEach((tr) => {
      const fn = onRowClick(tr);
      tr.addEventListener("click", fn);
      rowHandlers.push({ el: tr, fn });
    });

    // ========= KPI 1: 평가금액 7일 sparkbars =========
    if (bars7d) bars7d.innerHTML = buildBars7d();

    // ========= KPI 2: 평가 손익 — 일별 막대 + 누적 라인 콤보 =========
    if (pnlCombo) pnlCombo.innerHTML = buildPnlCombo();

    // ========= KPI 3: 수익률 — 반원 게이지 + 벤치마크 마커 =========
    if (retGauge) retGauge.innerHTML = buildRetGauge();

    // ========= 차트 데이터 =========
    const data = buildLineData();

    // ========= 도넛 차트 (비중 분포) =========
    if (donutChart && donutLegend) {
      const { donut, legend } = buildDonut();
      donutChart.innerHTML = donut;
      donutLegend.innerHTML = legend;
    }

    // 헤더 통계
    const stats = buildHeaderStats(data);
    if (stHigh) stHigh.textContent = stats.high;
    if (stLow) stLow.textContent = stats.low;
    if (stAvg) stAvg.textContent = stats.avg;
    if (stVol) stVol.textContent = stats.vol;

    // 두 차트 빌드
    if (heroChart)
      buildChart(heroChart, {
        data,
        height: 180,
        padding: { l: 52, r: 16, t: 16, b: 26 },
        showBench: false,
      });
    if (lineChart)
      buildChart(lineChart, {
        data,
        height: 280,
        padding: { l: 56, r: 56, t: 20, b: 30 },
        showBench: true,
        showVolume: true,
      });

    ranRef.current = true;

    return () => {
      rowHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
    };
  }, [showDemo]);

  /* 로그인 후 동적으로 마운트되는 카드(.reveal)는 라우트 진입 시점에 한 번 도는 전역
     IntersectionObserver가 수집하지 못해 opacity:0 으로 남는다. 실데이터 뷰(showDemo=false)가
     렌더된 뒤 아직 노출 안 된 .reveal 에 .in 을 직접 부여해 자연스럽게 페이드인시킨다. */
  useEffect(() => {
    if (showDemo) return;
    const id = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    });
    return () => cancelAnimationFrame(id);
  }, [showDemo, userSummary, holdingRows]);

  return (
    <>
      <div className="page-head reveal">
        <div>
          <div className="caption">PORTFOLIO / 2026.06.11</div>
          <h1 style={{ marginTop: "6px" }}>내 포트폴리오</h1>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="toggle-btn active">전체</button>
          <button className="toggle-btn">국내</button>
          <button className="toggle-btn">해외</button>
        </div>
      </div>

      {/* ── 내 종목 입력 + 실데이터 요약 (로그인 유저) ──────────────────── */}
      {configured && user ? (
        <>
          <div className="grid grid-12">
            <HoldingsForm
              rows={holdingRows}
              setRows={setHoldingRows}
              onSave={handleSave}
              saving={saving}
            />
          </div>
          {userSummary && <UserPortfolioDashboard summary={userSummary} />}
        </>
      ) : null}

      {/* ── 데모 쇼케이스 (예시) — 실제 포트폴리오 없을 때만 흐릿하게 + 오버레이 ── */}
      {showDemo ? (
        <div style={{ position: "relative", marginTop: "14px" }}>
          <div
            aria-hidden="true"
            style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}
          >
            {/* HERO CARD */}
            <section className="hero-card reveal">
              <div className="hero-card-inner">
                <div>
                  <div className="label">총 평가금액</div>
                  <div className="big num">
                    <span data-counter="12350000">0</span>
                    <small>원</small>
                  </div>
                  <div className="diff num pos">+480,000원 · +4.05% (오늘)</div>
                  <div className="stats">
                    <div className="stat">
                      <div className="l">30D 최고</div>
                      <div className="v num pos" id="stHigh">
                        —
                      </div>
                    </div>
                    <div className="stat">
                      <div className="l">30D 최저</div>
                      <div className="v num" id="stLow">
                        —
                      </div>
                    </div>
                    <div className="stat">
                      <div className="l">평균</div>
                      <div className="v num" id="stAvg">
                        —
                      </div>
                    </div>
                    <div className="stat">
                      <div className="l">변동성</div>
                      <div className="v num" id="stVol">
                        —
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chart-host" id="heroChart"></div>
              </div>
            </section>

            {/* KPI */}
            <div className="grid grid-12" style={{ marginTop: "14px" }}>
              <div className="card kpi c-3 reveal">
                <div className="lbl">평가금액</div>
                <div className="val num">
                  <span data-counter="12350000">0</span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "var(--fg-muted)",
                      fontWeight: 500,
                      marginLeft: "2px",
                    }}
                  >
                    원
                  </span>
                </div>
                <div className="sub">7일 일일 변동</div>
                <div className="kpi-visual">
                  <div className="sparkbars" id="bars7d"></div>
                </div>
              </div>
              <div className="card kpi c-3 reveal" style={{ transitionDelay: "80ms" }}>
                <div className="lbl">평가 손익</div>
                <div className="val num pos">+480,000원</div>
                <div className="sub">7일 일별 + 누적</div>
                <div className="kpi-visual">
                  <div className="chart-host" id="pnlCombo" style={{ height: "56px" }}></div>
                </div>
              </div>
              <div className="card kpi c-3 reveal" style={{ transitionDelay: "160ms" }}>
                <div className="lbl">수익률</div>
                <div className="val num pos">+4.05%</div>
                <div className="sub">vs KOSPI +1.20% · 8주 BEST</div>
                <div className="kpi-visual">
                  <div className="chart-host" id="retGauge" style={{ height: "56px" }}></div>
                </div>
              </div>
              <div className="card kpi c-3 reveal" style={{ transitionDelay: "240ms" }}>
                <div className="lbl">보유 종목</div>
                <div className="val num">10개</div>
                <div className="sub">국내 3 · 해외 7 · 6 섹터</div>
                <div className="kpi-stocks">
                  <div className="brand-mark samsung" title="삼성전자">
                    <span className="logo"></span>
                  </div>
                  <div className="brand-mark apple" title="Apple">
                    <span className="logo"></span>
                  </div>
                  <div className="brand-mark nvidia" title="NVIDIA">
                    <span className="logo"></span>
                  </div>
                  <div className="brand-mark microsoft" title="Microsoft">
                    <span className="logo"></span>
                  </div>
                  <div className="more-mark" title="외 6개">
                    +6
                  </div>
                </div>
                <div className="kpi-split">
                  <span>국내 38%</span>
                  <div className="kpi-split-bar">
                    <div className="dom" style={{ width: "38%" }}></div>
                    <div className="ovr" style={{ width: "62%" }}></div>
                  </div>
                  <span>해외 62%</span>
                </div>
              </div>
            </div>

            {/* 보유 종목 표 */}
            <div className="grid grid-12" style={{ marginTop: "14px" }}>
              <section className="card c-12 reveal stock-table-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <div className="subhead" style={{ fontSize: "17px" }}>
                      보유 종목 상세
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                      30일 가격 추이 · 점선 = 매수 평단
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="toggle-btn">이름</button>
                    <button className="toggle-btn active">수익률</button>
                    <button className="toggle-btn">비중</button>
                  </div>
                </div>
                <table
                  style={{ tableLayout: "fixed", width: "100%", maxWidth: "860px", margin: "0 auto" }}
                >
                  <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "26%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>종목</th>
                      <th style={{ textAlign: "center" }}>30D 추이</th>
                      <th style={{ textAlign: "right" }}>30D %</th>
                      <th style={{ textAlign: "right", paddingRight: 0 }}>비중</th>
                      <th style={{ textAlign: "right", paddingRight: "64px" }}>평가액</th>
                    </tr>
                  </thead>
                  <tbody id="stockTable"></tbody>
                </table>
              </section>
            </div>

            {/* 도넛 + 라인 차트 */}
            <div className="grid grid-12" style={{ marginTop: "14px" }}>
              <section className="card c-5 donut-card reveal">
                <div className="subhead" style={{ fontSize: "17px" }}>
                  비중 분포
                </div>
                <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                  10개 종목 · 6 섹터
                </div>
                <div className="donut-wrap">
                  <svg className="donut" viewBox="0 0 36 36" id="donutChart"></svg>
                  <div className="legend" id="donutLegend"></div>
                </div>
              </section>

              <section className="card c-7 reveal" style={{ transitionDelay: "100ms" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div>
                    <div className="subhead" style={{ fontSize: "17px" }}>
                      최근 30일 평가액
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                      일일 종가 + 거래량
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="toggle-btn">1D</button>
                    <button className="toggle-btn">1W</button>
                    <button className="toggle-btn active">1M</button>
                    <button className="toggle-btn">3M</button>
                    <button className="toggle-btn">1Y</button>
                    <button className="toggle-btn">5Y</button>
                  </div>
                </div>
                <div className="chart-host" id="lineChart" style={{ marginTop: "18px" }}></div>
                <div className="chart-legend">
                  <div className="leg">
                    <span className="sw" style={{ background: "var(--green)" }}></span>내 포트폴리오 (+4.05%)
                  </div>
                  <div className="leg dashed">
                    <span className="sw"></span>KOSPI 벤치마크 (+1.20%)
                  </div>
                  <div className="leg">
                    <span className="sw" style={{ background: "var(--fg-muted)", opacity: 0.5 }}></span>
                    거래량 (일별)
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* 예시 오버레이 (로그인 / 입력 유도) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                maxWidth: "440px",
                width: "100%",
                textAlign: "center",
                background: "var(--bg-elevated)",
                border: "1px solid var(--frost)",
                borderRadius: "16px",
                padding: "30px 26px",
                boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--blue)",
                  fontWeight: 600,
                  marginBottom: "12px",
                }}
              >
                예시 미리보기
              </div>
              <h3 style={{ fontSize: "19px", margin: "0 0 10px", lineHeight: 1.4 }}>
                {user ? "내 종목을 입력하면 실제 분석을 봐요" : "로그인하고 내 포트폴리오를 만들어보세요"}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--fg-muted)",
                  lineHeight: 1.7,
                  margin: "0 0 18px",
                }}
              >
                {user
                  ? "지금 화면은 예시 데이터예요. 위 입력란에 보유 종목을 추가하면 내 종목 기준 실제 분석으로 바뀝니다."
                  : "지금 보이는 숫자는 예시예요. 로그인 후 종목을 입력하면 내 포트폴리오로 실제 분석을 받을 수 있어요."}
              </p>
              {!user && (
                <button
                  className="toggle-btn active"
                  onClick={() => openAuth("login")}
                  style={{ padding: "11px 22px", fontSize: "14px" }}
                >
                  로그인하고 시작하기
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* AI 분석 */}
      <div className="grid grid-12" style={{ marginTop: "14px" }}>
        <section className="card c-12 reveal" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div
                className="subhead"
                style={{ fontSize: "17px", display: "flex", alignItems: "center", gap: "10px" }}
              >
                AI 분석
                <SourceBadge source={analysisSource} liveLabel="실시간 분석" demoLabel="데모 분석" />
              </div>
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                {analysis.sub}
              </div>
            </div>
            <Link
              to="/chat"
              style={{ fontSize: "13px", color: "var(--green)", fontWeight: 600 }}
            >
              코치에게 자세히 묻기 →
            </Link>
          </div>
          <p style={{ marginTop: "14px", fontSize: "15px", lineHeight: 1.7 }}>{analysis.summary}</p>
          <div className="insight-grid">
            <div className="insight">
              <div className="label">특성</div>
              <ul>
                {analysis.characteristics.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="insight">
              <div className="label">강점</div>
              <ul>
                {analysis.strengths.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="insight">
              <div className="label">리스크</div>
              <ul>
                {analysis.risks.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="insight">
              <div className="label">점검 포인트</div>
              <ul>
                {analysis.suggestions.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{ marginTop: "14px", fontSize: "11px", color: "var(--fg-muted)" }}>
            정보 제공 목적이며, 투자 권유가 아닙니다.
          </p>
        </section>
      </div>
    </>
  );
}
