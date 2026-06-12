import { useEffect, useRef } from "react";
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

/* /site/portfolio.html <main class="page-pad"> 를 그대로(verbatim) 이식.
   page-head / hero-card / KPI 4 / 보유 종목 표 / 도넛 + 라인차트 / AI 분석.
   인라인 <script> 의 동적 렌더(차트·표·도넛·KPI)는 useEffect 에서 원본과
   같은 순서로 호출해 동일 DOM/SVG 를 주입한다. 종목 행 클릭 펼침도 동일 이식. */
export default function Portfolio() {
  const ranRef = useRef(false);

  useEffect(() => {
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
  }, []);

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
              {/* 데스크탑 col 폭(합 100):
                   종목 26 / 추이 16 / 30D% 22 / 비중 10 / 평가액 26 */}
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

      {/* AI 분석 */}
      <div className="grid grid-12" style={{ marginTop: "14px" }}>
        <section className="card c-12 reveal" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div className="subhead" style={{ fontSize: "17px" }}>
                AI 분석
              </div>
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                자동 생성 · 2026.06.11 09:00
              </div>
            </div>
            <Link
              to="/chat"
              style={{ fontSize: "13px", color: "var(--green)", fontWeight: 600 }}
            >
              코치에게 자세히 묻기 →
            </Link>
          </div>
          <p style={{ marginTop: "14px", fontSize: "15px", lineHeight: 1.7 }}>
            국내 대형주와 미국 빅테크가 섞인 성장주 포트폴리오. 반도체 사이클과 환율이 핵심 변수.
          </p>
          <div className="insight-grid">
            <div className="insight">
              <div className="label">특성</div>
              <ul>
                <li>성장주 비중 약 70%</li>
                <li>반도체·AI 노출 50%</li>
                <li>국내 60% · 해외 40%</li>
              </ul>
            </div>
            <div className="insight">
              <div className="label">강점</div>
              <ul>
                <li>AI 수요 수혜 종목 집중</li>
                <li>분기 실적 우상향 사이클</li>
                <li>달러 자산으로 환율 헷지</li>
              </ul>
            </div>
            <div className="insight">
              <div className="label">리스크</div>
              <ul>
                <li>삼성전자 단일 비중 32%</li>
                <li>반도체 사이클 동조 가능</li>
                <li>원화 강세 시 평가액 압축</li>
              </ul>
            </div>
            <div className="insight">
              <div className="label">점검 포인트</div>
              <ul>
                <li>반도체 외 섹터 비중 검토</li>
                <li>방어주·배당주 일부 편입</li>
                <li>환율 시나리오 점검</li>
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
