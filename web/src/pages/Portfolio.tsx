import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useDemoMode, DEMO_STORAGE_KEY } from "../lib/demo";
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

/* ── 종목 카탈로그 (자동완성용) ────────────────────────────────────────────
   한국 + 미국 인기 종목. aka 는 검색용 별칭(영문/한글/티커 변형). 입력칸에
   타이핑하면 ticker/name/aka 부분일치로 드롭다운을 띄운다. */
interface StockCatalogItem {
  ticker: string;
  name: string;
  currency: string;
  aka?: string;
}

const STOCK_CATALOG: StockCatalogItem[] = [
  // ── 코스피 대형주 (.KS) ──
  { ticker: "005930.KS", name: "삼성전자", currency: "KRW", aka: "samsung 삼전" },
  { ticker: "000660.KS", name: "SK하이닉스", currency: "KRW", aka: "sk hynix 하이닉스" },
  { ticker: "035720.KS", name: "카카오", currency: "KRW", aka: "kakao" },
  { ticker: "035420.KS", name: "NAVER", currency: "KRW", aka: "naver 네이버" },
  { ticker: "005380.KS", name: "현대차", currency: "KRW", aka: "hyundai 현대자동차 현차" },
  { ticker: "000270.KS", name: "기아", currency: "KRW", aka: "kia" },
  { ticker: "373220.KS", name: "LG에너지솔루션", currency: "KRW", aka: "lg energy solution 엘지엔솔 lgensol" },
  { ticker: "207940.KS", name: "삼성바이오로직스", currency: "KRW", aka: "samsung biologics 삼바" },
  { ticker: "068270.KS", name: "셀트리온", currency: "KRW", aka: "celltrion" },
  { ticker: "105560.KS", name: "KB금융", currency: "KRW", aka: "kb financial 케이비금융" },
  { ticker: "055550.KS", name: "신한지주", currency: "KRW", aka: "shinhan 신한금융" },
  { ticker: "005490.KS", name: "POSCO홀딩스", currency: "KRW", aka: "posco 포스코홀딩스" },
  { ticker: "051910.KS", name: "LG화학", currency: "KRW", aka: "lg chem 엘지화학" },
  { ticker: "006400.KS", name: "삼성SDI", currency: "KRW", aka: "samsung sdi 삼성에스디아이" },
  { ticker: "012330.KS", name: "현대모비스", currency: "KRW", aka: "hyundai mobis 모비스" },
  { ticker: "028260.KS", name: "삼성물산", currency: "KRW", aka: "samsung c&t 삼성물산" },
  { ticker: "032830.KS", name: "삼성생명", currency: "KRW", aka: "samsung life 삼성생명" },
  { ticker: "017670.KS", name: "SK텔레콤", currency: "KRW", aka: "sk telecom skt 에스케이텔레콤" },
  { ticker: "030200.KS", name: "KT", currency: "KRW", aka: "kt 케이티 telecom" },
  { ticker: "066570.KS", name: "LG전자", currency: "KRW", aka: "lg electronics 엘지전자" },
  { ticker: "009150.KS", name: "삼성전기", currency: "KRW", aka: "samsung electro-mechanics 삼성전기 semco" },
  { ticker: "003670.KS", name: "포스코퓨처엠", currency: "KRW", aka: "posco future m 포스코케미칼 퓨처엠" },
  { ticker: "323410.KS", name: "카카오뱅크", currency: "KRW", aka: "kakaobank 카뱅 카카오은행" },
  { ticker: "259960.KS", name: "크래프톤", currency: "KRW", aka: "krafton 배그 pubg" },
  { ticker: "352820.KS", name: "하이브", currency: "KRW", aka: "hybe bts 방탄 빅히트" },
  { ticker: "034020.KS", name: "두산에너빌리티", currency: "KRW", aka: "doosan enerbility 두산중공업 원전" },
  { ticker: "454910.KS", name: "두산로보틱스", currency: "KRW", aka: "doosan robotics 두산로봇 로보틱스" },
  { ticker: "042700.KS", name: "한미반도체", currency: "KRW", aka: "hanmi semiconductor 한미 hbm" },
  { ticker: "015760.KS", name: "한국전력", currency: "KRW", aka: "kepco 한전 한국전력공사" },
  { ticker: "096770.KS", name: "SK이노베이션", currency: "KRW", aka: "sk innovation 에스케이이노베이션" },
  { ticker: "086790.KS", name: "하나금융지주", currency: "KRW", aka: "hana financial 하나금융 하나은행" },
  { ticker: "316140.KS", name: "우리금융지주", currency: "KRW", aka: "woori financial 우리금융 우리은행" },
  { ticker: "033780.KS", name: "KT&G", currency: "KRW", aka: "ktg 케이티앤지 담배 인삼공사" },
  { ticker: "010130.KS", name: "고려아연", currency: "KRW", aka: "korea zinc 고려아연 zinc" },
  { ticker: "011200.KS", name: "HMM", currency: "KRW", aka: "hmm 현대상선 해운" },
  { ticker: "090430.KS", name: "아모레퍼시픽", currency: "KRW", aka: "amorepacific 아모레 화장품" },
  { ticker: "018260.KS", name: "삼성에스디에스", currency: "KRW", aka: "samsung sds 삼성sds" },
  { ticker: "010950.KS", name: "S-Oil", currency: "KRW", aka: "s-oil 에쓰오일 에스오일 정유" },
  { ticker: "086280.KS", name: "현대글로비스", currency: "KRW", aka: "hyundai glovis 글로비스 물류" },
  { ticker: "047810.KS", name: "한국항공우주", currency: "KRW", aka: "kai 한국항공우주 방산 항공우주" },
  { ticker: "064350.KS", name: "현대로템", currency: "KRW", aka: "hyundai rotem 로템 방산 철도" },
  { ticker: "138040.KS", name: "메리츠금융지주", currency: "KRW", aka: "meritz 메리츠금융" },
  { ticker: "011070.KS", name: "LG이노텍", currency: "KRW", aka: "lg innotek 엘지이노텍 카메라모듈" },
  // ── 한화 계열 + 조선/방산 (.KS) ──
  { ticker: "042660.KS", name: "한화오션", currency: "KRW", aka: "hanwha ocean 대우조선 한화오션 조선" },
  { ticker: "012450.KS", name: "한화에어로스페이스", currency: "KRW", aka: "hanwha aerospace 한화에어로 방산 항공" },
  { ticker: "009830.KS", name: "한화솔루션", currency: "KRW", aka: "hanwha solutions 한화솔루션 태양광" },
  { ticker: "272210.KS", name: "한화시스템", currency: "KRW", aka: "hanwha systems 한화시스템 방산" },
  { ticker: "000880.KS", name: "한화", currency: "KRW", aka: "hanwha 한화그룹 지주" },
  { ticker: "329180.KS", name: "HD현대중공업", currency: "KRW", aka: "hd hyundai heavy 현대중공업 조선" },
  { ticker: "009540.KS", name: "HD한국조선해양", currency: "KRW", aka: "hd korea shipbuilding 한국조선해양 현대중공업지주 조선" },
  { ticker: "010140.KS", name: "삼성중공업", currency: "KRW", aka: "samsung heavy 삼성중공업 조선" },
  { ticker: "079550.KS", name: "LIG넥스원", currency: "KRW", aka: "lig nex1 넥스원 방산 미사일" },
  { ticker: "077970.KS", name: "STX엔진", currency: "KRW", aka: "stx engine stx엔진 방산 엔진" },
  // ── 코스닥 (.KQ) ──
  { ticker: "247540.KQ", name: "에코프로비엠", currency: "KRW", aka: "ecopro bm 에코프로비엠 양극재 2차전지" },
  { ticker: "086520.KQ", name: "에코프로", currency: "KRW", aka: "ecopro 에코프로 2차전지" },
  { ticker: "196170.KQ", name: "알테오젠", currency: "KRW", aka: "alteogen 알테오젠 바이오" },
  { ticker: "028300.KQ", name: "HLB", currency: "KRW", aka: "hlb 에이치엘비 바이오 리보세라닙" },
  { ticker: "058470.KQ", name: "리노공업", currency: "KRW", aka: "leeno 리노공업 반도체 테스트" },
  { ticker: "035900.KQ", name: "JYP Ent.", currency: "KRW", aka: "jyp 제이와이피 엔터 스트레이키즈" },
  { ticker: "041510.KQ", name: "에스엠", currency: "KRW", aka: "sm entertainment 에스엠 sm 엔터" },
  { ticker: "277810.KQ", name: "레인보우로보틱스", currency: "KRW", aka: "rainbow robotics 레인보우 로봇 휴머노이드" },
  { ticker: "112040.KQ", name: "위메이드", currency: "KRW", aka: "wemade 위메이드 위믹스 게임" },
  { ticker: "091990.KQ", name: "셀트리온헬스케어", currency: "KRW", aka: "celltrion healthcare 셀트리온헬스케어" },
  { ticker: "078600.KQ", name: "대주전자재료", currency: "KRW", aka: "daejoo 대주전자재료 실리콘음극재" },
  { ticker: "357780.KQ", name: "솔브레인", currency: "KRW", aka: "soulbrain 솔브레인 반도체 소재" },
  { ticker: "066970.KQ", name: "엘앤에프", currency: "KRW", aka: "l&f 엘앤에프 양극재 2차전지" },
  { ticker: "263750.KQ", name: "펄어비스", currency: "KRW", aka: "pearl abyss 펄어비스 검은사막 게임" },
  { ticker: "293490.KQ", name: "카카오게임즈", currency: "KRW", aka: "kakao games 카카오게임즈 게임" },
  { ticker: "095340.KQ", name: "ISC", currency: "KRW", aka: "isc 아이에스씨 반도체 테스트소켓" },
  { ticker: "240810.KQ", name: "원익IPS", currency: "KRW", aka: "wonik ips 원익 반도체 장비" },
  { ticker: "086900.KQ", name: "메디톡스", currency: "KRW", aka: "medytox 메디톡스 보톡스 바이오" },
  // ── 미국 빅테크/성장주 (접미사 없음) ──
  { ticker: "AAPL", name: "Apple", currency: "USD", aka: "애플 apple" },
  { ticker: "MSFT", name: "Microsoft", currency: "USD", aka: "마이크로소프트 microsoft ms" },
  { ticker: "NVDA", name: "NVIDIA", currency: "USD", aka: "엔비디아 nvidia" },
  { ticker: "GOOGL", name: "Alphabet", currency: "USD", aka: "구글 google alphabet 알파벳" },
  { ticker: "AMZN", name: "Amazon", currency: "USD", aka: "아마존 amazon" },
  { ticker: "META", name: "Meta", currency: "USD", aka: "메타 meta facebook 페이스북" },
  { ticker: "TSLA", name: "Tesla", currency: "USD", aka: "테슬라 tesla" },
  { ticker: "AVGO", name: "Broadcom", currency: "USD", aka: "브로드컴 broadcom" },
  { ticker: "AMD", name: "AMD", currency: "USD", aka: "에이엠디 amd advanced micro devices" },
  { ticker: "NFLX", name: "Netflix", currency: "USD", aka: "넷플릭스 netflix" },
  { ticker: "PLTR", name: "Palantir", currency: "USD", aka: "팔란티어 palantir" },
  { ticker: "COIN", name: "Coinbase", currency: "USD", aka: "코인베이스 coinbase 코인" },
  { ticker: "CPNG", name: "Coupang", currency: "USD", aka: "쿠팡 coupang" },
  { ticker: "TSM", name: "TSMC", currency: "USD", aka: "tsmc 티에스엠씨 대만반도체" },
  { ticker: "QCOM", name: "Qualcomm", currency: "USD", aka: "퀄컴 qualcomm" },
  { ticker: "INTC", name: "Intel", currency: "USD", aka: "인텔 intel" },
  { ticker: "MU", name: "Micron", currency: "USD", aka: "마이크론 micron" },
  { ticker: "ARM", name: "Arm Holdings", currency: "USD", aka: "arm 암홀딩스 암" },
  { ticker: "SMCI", name: "Super Micro", currency: "USD", aka: "슈퍼마이크로 supermicro smci" },
  { ticker: "CRM", name: "Salesforce", currency: "USD", aka: "세일즈포스 salesforce" },
  { ticker: "ORCL", name: "Oracle", currency: "USD", aka: "오라클 oracle" },
  { ticker: "ADBE", name: "Adobe", currency: "USD", aka: "어도비 adobe" },
  { ticker: "UBER", name: "Uber", currency: "USD", aka: "우버 uber" },
  { ticker: "DIS", name: "Disney", currency: "USD", aka: "디즈니 disney" },
  { ticker: "PYPL", name: "PayPal", currency: "USD", aka: "페이팔 paypal" },
  { ticker: "SHOP", name: "Shopify", currency: "USD", aka: "쇼피파이 shopify" },
  { ticker: "MSTR", name: "MicroStrategy", currency: "USD", aka: "마이크로스트래티지 microstrategy 비트코인" },
  { ticker: "JPM", name: "JPMorgan", currency: "USD", aka: "제이피모건 jpmorgan jp모건" },
  { ticker: "BRK-B", name: "Berkshire Hathaway", currency: "USD", aka: "버크셔 berkshire 워런버핏 buffett" },
  { ticker: "V", name: "Visa", currency: "USD", aka: "비자 visa" },
  { ticker: "KO", name: "Coca-Cola", currency: "USD", aka: "코카콜라 coca cola 코카" },
  { ticker: "LLY", name: "Eli Lilly", currency: "USD", aka: "일라이릴리 eli lilly 릴리 비만치료제" },
  { ticker: "COST", name: "Costco", currency: "USD", aka: "코스트코 costco" },
  // ── 미국 대표 ETF (접미사 없음) ──
  { ticker: "SPY", name: "SPDR S&P 500 ETF", currency: "USD", aka: "spy 에스앤피 s&p500 sp500 spdr etf" },
  { ticker: "QQQ", name: "Invesco QQQ", currency: "USD", aka: "qqq 나스닥100 nasdaq 큐큐큐 etf" },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", currency: "USD", aka: "voo 뱅가드 vanguard s&p500 etf" },
  { ticker: "SCHD", name: "Schwab US Dividend ETF", currency: "USD", aka: "schd 슈드 배당 dividend etf" },
];

/* STOCK_CATALOG is a fast built-in fallback; on first use we load the full
   KOSPI+KOSDAQ+US list (web/public/stocks.json, ~2,800 names) so almost any listed
   stock is searchable. If the fetch fails we keep the built-in list. */
let ACTIVE_CATALOG: StockCatalogItem[] = STOCK_CATALOG;
let catalogLoadStarted = false;

async function ensureFullCatalog(): Promise<void> {
  if (catalogLoadStarted) return;
  catalogLoadStarted = true;
  try {
    const res = await fetch("/stocks.json");
    if (!res.ok) return;
    const data = (await res.json()) as StockCatalogItem[];
    if (Array.isArray(data) && data.length > STOCK_CATALOG.length) {
      // Carry the built-in aka aliases (테슬라→TSLA, 엔비디아→NVDA, 삼전→삼성전자, ...) onto the
      // full list, which has no aliases — otherwise Korean names for US tickers and
      // abbreviations would stop matching once the full list loads.
      const akaByTicker = new Map(
        STOCK_CATALOG.filter((s) => s.aka).map((s) => [s.ticker, s.aka] as const),
      );
      const fullTickers = new Set(data.map((s) => s.ticker));
      const merged: StockCatalogItem[] = data.map((s) =>
        akaByTicker.has(s.ticker) ? { ...s, aka: akaByTicker.get(s.ticker) } : s,
      );
      for (const s of STOCK_CATALOG) if (!fullTickers.has(s.ticker)) merged.push(s);
      ACTIVE_CATALOG = merged;
    }
  } catch {
    /* keep the built-in fallback */
  }
}

function searchCatalog(query: string, limit = 8): StockCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Rank prefix matches (name/ticker) above substring matches so "삼성" surfaces 삼성전자 first.
  const hits: { item: StockCatalogItem; rank: number }[] = [];
  for (const s of ACTIVE_CATALOG) {
    const name = s.name.toLowerCase();
    const ticker = s.ticker.toLowerCase();
    let rank = -1;
    if (name.startsWith(q) || ticker.startsWith(q)) rank = 0;
    else if (name.includes(q) || ticker.includes(q) || (s.aka ?? "").toLowerCase().includes(q)) rank = 1;
    if (rank >= 0) hits.push({ item: s, rank });
  }
  hits.sort((a, b) => a.rank - b.rank);
  return hits.slice(0, limit).map((h) => h.item);
}

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
  saveError,
}: {
  rows: HoldingRow[];
  setRows: React.Dispatch<React.SetStateAction<HoldingRow[]>>;
  onSave: () => void;
  saving: boolean;
  saveError?: string | null;
}) {
  const update = (i: number, field: keyof HoldingRow, value: string) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, j) => j !== i));

  /* 자동완성 드롭다운 상태: 어느 행/어느 칼럼(ticker|name)에서 열렸는지 + 검색어 */
  const [openAt, setOpenAt] = useState<{ row: number; field: "ticker" | "name" } | null>(null);
  const wrapRef = useRef<HTMLElement | null>(null);

  /* 전체 종목 목록(stocks.json)을 폼이 처음 뜰 때 한 번 로드. 실패하면 내장 목록 유지.
     로드되면 리렌더를 유발해 열려 있는 드롭다운도 전체 목록으로 갱신한다. */
  const [catalogReady, setCatalogReady] = useState(false);
  useEffect(() => {
    ensureFullCatalog().then(() => setCatalogReady(true));
  }, []);

  /* 바깥 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    if (!openAt) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenAt(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openAt]);

  const pick = (i: number, item: StockCatalogItem) => {
    setRows((prev) =>
      prev.map((r, j) =>
        j === i ? { ...r, ticker: item.ticker, name: item.name, currency: item.currency } : r,
      ),
    );
    setOpenAt(null);
  };

  // Memoized so the ~2,800-item catalog scan only reruns when the query, open field, or the
  // loaded full catalog (catalogReady) changes — not on every unrelated re-render.
  const query = openAt != null ? rows[openAt.row]?.[openAt.field] ?? "" : "";
  const matches = useMemo(() => {
    void catalogReady; // re-run once the module-level full catalog (ACTIVE_CATALOG) has loaded
    return openAt != null ? searchCatalog(query) : [];
  }, [openAt, query, catalogReady]);

  const Dropdown = ({ i }: { i: number }) =>
    openAt && openAt.row === i && matches.length > 0 ? (
      <div
        role="listbox"
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 30,
          marginTop: "4px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--frost)",
          borderRadius: "8px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        {matches.map((item) => (
          <button
            type="button"
            key={item.ticker}
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              // mousedown 으로 처리: input blur 전에 선택을 확정해 드롭다운이 먼저 닫히는 것을 방지
              e.preventDefault();
              pick(i, item);
            }}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "10px",
              width: "100%",
              padding: "9px 12px",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--frost-alt)",
              color: "var(--fg-primary)",
              textAlign: "left",
              fontSize: "13px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontWeight: 600 }}>{item.name}</span>
            <span
              className="num"
              style={{ fontSize: "11px", color: "var(--fg-muted)", fontFamily: "JetBrains Mono" }}
            >
              {item.ticker}
            </span>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <section ref={wrapRef} className="card c-12 reveal" style={{ padding: "28px", marginTop: "14px" }}>
      <div className="subhead" style={{ fontSize: "17px", marginBottom: "14px" }}>
        내 종목 입력
      </div>
      <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "14px" }}>
        보유 종목을 입력하면 실제 포트폴리오 기반으로 분석합니다. 목록에 없는 종목은
        6자리 종목코드(예: 005930)나 티커(예: NVDA)를 직접 입력하면 됩니다.
      </div>
      <table className="holdings-table" style={{ width: "100%", maxWidth: "760px", borderCollapse: "collapse" }}>
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
              <td style={{ padding: "4px 8px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="종목명·코드·티커 (예: 삼성전자, 005930, NVDA)"
                  value={r.ticker}
                  autoComplete="off"
                  onChange={(e) => {
                    update(i, "ticker", e.target.value);
                    setOpenAt({ row: i, field: "ticker" });
                  }}
                  onFocus={() => setOpenAt({ row: i, field: "ticker" })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--frost)", background: "var(--bg-elevated-2)", color: "var(--fg-primary)" }}
                />
                {openAt?.field === "ticker" && <Dropdown i={i} />}
              </td>
              <td style={{ padding: "4px 8px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="삼성전자"
                  value={r.name}
                  autoComplete="off"
                  onChange={(e) => {
                    update(i, "name", e.target.value);
                    setOpenAt({ row: i, field: "name" });
                  }}
                  onFocus={() => setOpenAt({ row: i, field: "name" })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--frost)", background: "var(--bg-elevated-2)", color: "var(--fg-primary)" }}
                />
                {openAt?.field === "name" && <Dropdown i={i} />}
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="number"
                  placeholder="10"
                  value={r.shares}
                  onChange={(e) => update(i, "shares", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--frost)", background: "var(--bg-elevated-2)", color: "var(--fg-primary)", textAlign: "right" }}
                />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input
                  type="number"
                  placeholder="70000"
                  value={r.avg_price}
                  onChange={(e) => update(i, "avg_price", e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--frost)", background: "var(--bg-elevated-2)", color: "var(--fg-primary)", textAlign: "right" }}
                />
              </td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                <select
                  value={r.currency}
                  onChange={(e) => update(i, "currency", e.target.value)}
                  style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--frost)", background: "var(--bg-elevated-2)", color: "var(--fg-primary)", colorScheme: "dark" }}
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
        {saveError && (
          <span role="alert" style={{ fontSize: "13px", color: "var(--red)", alignSelf: "center" }}>
            {saveError}
          </span>
        )}
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
  const [analyzing, setAnalyzing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /* Latest-request guards: summary/analysis are async (the analysis is a slow LLM call) and
     fire from more than one place, so a stale response must not overwrite a newer one.
     Bump on send; apply the result only if it is still the latest. */
  const analysisReqRef = useRef(0);
  const summaryReqRef = useRef(0);

  /* 데모 모드: 홈 "데모 보기"(/portfolio?demo=1)에서 진입. 공유 useDemoMode 훅을 써서
     ?demo=1 또는 sessionStorage 플래그가 있으면 true가 된다(페이지 이동해도 유지되어
     /chat·/learn 도 데모로 탐색). 로그인하면 데모는 무시되고 플래그도 제거된다.
     데모 모드에서는 예시 포트폴리오를 블러 없이 탐색하게 한다(폼/오버레이/게이트 블러 비활성). */
  const demoMode = useDemoMode();
  const navigate = useNavigate();

  /* ── 유저 holdings 상태 ──────────────────────────────────────────────── */
  const { user, configured, openAuth } = useAuth();
  const [holdingRows, setHoldingRows] = useState<HoldingRow[]>([{ ...EMPTY_ROW }]);
  const [saving, setSaving] = useState(false);
  const [userSummary, setUserSummary] = useState<PortfolioSummary | null>(null);
  const [holdingsLoaded, setHoldingsLoaded] = useState(false);

  /* 실제 보유종목 보유 여부 → 데모 쇼케이스 게이트 */
  const hasRealPortfolio = !!user && holdingsLoaded && rowsToInputs(holdingRows).length > 0;
  const showDemo = !hasRealPortfolio;
  /* 쇼케이스(예시 차트/표/도넛) 표시 여부 — 데모 모드면 로그인·실데이터 여부와 무관하게 무조건 표시 */
  const showShowcase = showDemo || demoMode;

  /* 예시를 잠깐(GATE_DELAY) 선명하게 보여준 뒤 블러 + 로그인 오버레이를 부드럽게 띄운다. */
  const GATE_DELAY_MS = 7000;
  const [gateActive, setGateActive] = useState(false);
  useEffect(() => {
    if (!showDemo) {
      setGateActive(false);
      return;
    }
    const t = setTimeout(() => setGateActive(true), GATE_DELAY_MS);
    return () => clearTimeout(t);
  }, [showDemo]);

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

  /* holdings 최초 로드 시 1회만 요약 + 분석 호출. 편집 중(holdingRows 변경)에는 재호출하지
     않는다 — 재계산은 "저장 & 분석"(handleSave)의 몫이다. 매 키입력마다 분석(느린 LLM)을
     쏘면 이전 holdings 응답이 최신을 덮어써 분석 카드가 엉뚱한 포트폴리오를 설명하던
     버그의 원인이었다. 시퀀스 가드로 stale 응답은 버린다. */
  useEffect(() => {
    if (!holdingsLoaded) return;
    const inputs = rowsToInputs(holdingRows);
    if (!inputs.length) return;

    const sid = ++summaryReqRef.current;
    postPortfolioSummary(inputs)
      .then((s) => {
        if (sid === summaryReqRef.current) setUserSummary(s);
      })
      .catch(() => {});

    const aid = ++analysisReqRef.current;
    setAnalyzing(true);
    postPortfolioAnalysis(inputs)
      .then((r) => {
        if (aid !== analysisReqRef.current) return;
        setAnalyzing(false);
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
      .catch(() => {
        if (aid === analysisReqRef.current) setAnalyzing(false);
      });
    // Intentionally only [holdingsLoaded]: fetch once for the saved holdings on load, not on
    // every keystroke; handleSave recomputes on "저장 & 분석".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdingsLoaded]);

  const handleSave = useCallback(async () => {
    // De-dupe by ticker (last wins) — the same ticker in two rows would make the upsert hit
    // the same conflict target twice ("cannot affect row a second time") and fail the whole save.
    const inputs = [...new Map(rowsToInputs(holdingRows).map((h) => [h.ticker, h])).values()];
    setSaving(true);
    setSaveError(null);
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
          // Upsert first (so a delete failure can't lose data), then drop the removed holdings.
          // Delete via a sanitized .in() diff — NOT a raw `not in (...)` string: real tickers
          // contain '.'/'-' and user-typed ones can contain commas/parens/quotes that break
          // unquoted PostgREST syntax and delete the wrong rows. Errors are checked, not swallowed.
          const { error: upsertError } = await supabase.from("holdings").upsert(rows, { onConflict: "user_id,ticker" });
          if (upsertError) throw upsertError;
          const keep = new Set(rows.map((r) => r.ticker));
          const { data: existing, error: fetchError } = await supabase
            .from("holdings")
            .select("ticker")
            .eq("user_id", user.id);
          if (fetchError) throw fetchError;
          const toDelete = (existing ?? [])
            .map((r: { ticker: string }) => r.ticker)
            .filter((t) => !keep.has(t));
          if (toDelete.length) {
            const { error: delError } = await supabase
              .from("holdings")
              .delete()
              .eq("user_id", user.id)
              .in("ticker", toDelete);
            if (delError) throw delError;
          }
        } else {
          // 전체 삭제
          const { error: delAllError } = await supabase.from("holdings").delete().eq("user_id", user.id);
          if (delAllError) throw delAllError;
        }
      }

      if (inputs.length === 0) {
        // Invalidate BOTH in-flight requests, else a late summary response would overwrite
        // the null we just set and the deleted dashboard would reappear.
        analysisReqRef.current++;
        summaryReqRef.current++;
        setUserSummary(null);
        setAnalysis(DEMO_ANALYSIS);
        setAnalysisSource("demo");
        setAnalyzing(false);
        return;
      }

      /* 포트폴리오 요약 */
      const sid = ++summaryReqRef.current;
      const summary = await postPortfolioSummary(inputs);
      if (sid === summaryReqRef.current) setUserSummary(summary);

      /* AI 분석 */
      const aid = ++analysisReqRef.current;
      setAnalyzing(true);
      postPortfolioAnalysis(inputs)
        .then((r) => {
          if (aid !== analysisReqRef.current) return;
          setAnalyzing(false);
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
        .catch(() => {
          if (aid === analysisReqRef.current) setAnalyzing(false);
        });
    } catch (e) {
      // A save error must not be swallowed — the DB write may have partially failed.
      console.error("포트폴리오 저장 실패", e);
      setSaveError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }, [holdingRows, user]);

  // AI 분석 (데모): 유저 holdings가 없을 때만 GET으로 데모 분석 로드
  useEffect(() => {
    if (holdingsLoaded) return; // 유저 데이터가 있으면 POST 분석을 씀
    let alive = true;
    const aid = ++analysisReqRef.current;
    getPortfolioAnalysis()
      .then((r) => {
        if (!alive || aid !== analysisReqRef.current || !isLiveAnalysis(r)) return;
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
    if (!showShowcase) return;
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
  }, [showShowcase]);

  /* 로그인 후 동적으로 마운트되는 카드(.reveal)는 라우트 진입 시점에 한 번 도는 전역
     IntersectionObserver가 수집하지 못해 opacity:0 으로 남는다. 실데이터 뷰(showDemo=false)가
     렌더된 뒤 아직 노출 안 된 .reveal 에 .in 을 직접 부여해 자연스럽게 페이드인시킨다. */
  useEffect(() => {
    if (showDemo) return;
    const reveal = () =>
      document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    const raf = requestAnimationFrame(reveal);
    // 여러 타이밍에 한 번 더 — 요약/분석 응답이 늦게 도착해 뒤늦게 마운트되는 카드도 확실히 노출
    const t1 = setTimeout(reveal, 200);
    const t2 = setTimeout(reveal, 800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showDemo, userSummary, holdingRows]);

  return (
    <>
      <div className="page-head reveal">
        <div>
          <div className="caption">PORTFOLIO / 2026.06.11</div>
          <h1 style={{ marginTop: "6px" }}>내 포트폴리오</h1>
        </div>
      </div>

      {/* ── 데모 모드 배너 (예시 포트폴리오 탐색 중) ──────────────────────── */}
      {demoMode && (
        <div
          className="reveal in"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "14px",
            padding: "14px 18px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--frost)",
            borderRadius: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "var(--red)",
                boxShadow: "0 0 8px rgba(255,32,71,0.7)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, color: "var(--fg-primary)" }}>데모 모드</span>
            <span style={{ color: "var(--fg-muted)" }}>·</span>
            <span style={{ color: "var(--fg-secondary)" }}>예시 포트폴리오예요</span>
          </div>
          <button
            className="toggle-btn active"
            onClick={() => {
              // Leaving demo to build a real portfolio — drop the demo flag.
              window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
              if (configured) openAuth("signup");
              else navigate("/portfolio");
            }}
            style={{ fontWeight: 600 }}
          >
            내 포트폴리오 만들기
          </button>
        </div>
      )}

      {/* ── 내 종목 입력 + 실데이터 요약 (로그인 유저) — 데모 모드에선 숨김 ──── */}
      {configured && user && !demoMode ? (
        <>
          <div className="grid grid-12">
            <HoldingsForm
              rows={holdingRows}
              setRows={setHoldingRows}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
            />
          </div>
          {userSummary && <UserPortfolioDashboard summary={userSummary} />}
        </>
      ) : null}

      {/* ── 데모 쇼케이스 (예시) — 실제 포트폴리오 없을 때만 흐릿하게 + 오버레이.
           데모 모드(?demo=1)면 블러/오버레이 없이 그대로 탐색하게 한다. ── */}
      {showShowcase ? (
        <div style={{ position: "relative", marginTop: "14px" }}>
          <div
            aria-hidden={showDemo && gateActive && !demoMode}
            style={{
              filter: showDemo && gateActive && !demoMode ? "blur(7px)" : "none",
              opacity: showDemo && gateActive && !demoMode ? 0.5 : 1,
              pointerEvents: showDemo && gateActive && !demoMode ? "none" : "auto",
              userSelect: showDemo && gateActive && !demoMode ? "none" : "auto",
              transition: "filter 0.6s ease, opacity 0.6s ease",
            }}
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

          {/* 예시 오버레이 (로그인 / 입력 유도) — 잠깐 본 뒤 페이드인. 데모 모드면 렌더 안 함 */}
          {!demoMode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "90px 20px 20px",
              background: gateActive ? "rgba(0,0,0,0.45)" : "transparent",
              opacity: gateActive ? 1 : 0,
              pointerEvents: gateActive ? "auto" : "none",
              transition: "opacity 0.5s ease, background 0.5s ease",
            }}
          >
            <div
              style={{
                maxWidth: "540px",
                width: "100%",
                textAlign: "center",
                background: "var(--bg-elevated)",
                border: "1px solid var(--frost)",
                borderRadius: "18px",
                padding: "40px 36px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--red)",
                  fontWeight: 700,
                  marginBottom: "14px",
                }}
              >
                예시 미리보기
              </div>
              <h3 style={{ fontSize: "24px", margin: "0 0 12px", lineHeight: 1.35 }}>
                {user ? "내 종목을 입력하면 실제 분석을 봐요" : "로그인하고 내 포트폴리오를 만들어보세요"}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--fg-secondary)",
                  lineHeight: 1.7,
                  margin: "0 0 22px",
                }}
              >
                {user
                  ? "지금 화면은 예시 데이터예요. 위 입력란에 보유 종목을 추가하면 내 종목 기준 실제 분석으로 바뀝니다."
                  : "지금 보이는 숫자는 예시예요. 로그인 후 종목을 입력하면 내 포트폴리오로 실제 분석을 받을 수 있어요."}
              </p>
              {!user ? (
                <button
                  className="toggle-btn active"
                  onClick={() => openAuth("login")}
                  style={{ padding: "13px 30px", fontSize: "15px" }}
                >
                  로그인하고 시작하기
                </button>
              ) : (
                <button
                  className="toggle-btn active"
                  onClick={() =>
                    document.querySelector(".holdings-table")?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                  style={{ padding: "13px 30px", fontSize: "15px" }}
                >
                  종목 입력하러 가기
                </button>
              )}
            </div>
          </div>
          )}
        </div>
      ) : null}

      {/* AI 분석 — 데모(예시 미리보기)에선 쇼케이스와 함께 블러, 데모 모드/로그인하면 선명 */}
      <div
        aria-hidden={showDemo && gateActive && !demoMode}
        style={{
          filter: showDemo && gateActive && !demoMode ? "blur(7px)" : "none",
          opacity: showDemo && gateActive && !demoMode ? 0.5 : 1,
          pointerEvents: showDemo && gateActive && !demoMode ? "none" : "auto",
          transition: "filter 0.6s ease, opacity 0.6s ease",
        }}
      >
      <div className="grid grid-12" style={{ marginTop: "14px" }}>
        <section className="card c-12 reveal" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div className="subhead" style={{ fontSize: "17px", display: "flex", alignItems: "center", gap: "10px" }}>
              AI 분석
              {analyzing ? (
                <span
                  aria-live="polite"
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--fg-secondary)", background: "var(--bg-elevated-2)", border: "1px solid var(--frost)", borderRadius: "999px", padding: "4px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span className="analyzing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
                  분석 중...
                </span>
              ) : (
                <SourceBadge source={analysisSource} liveLabel="실시간 분석" demoLabel="데모 분석" />
              )}
            </div>
            {analysis.sub && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {analysis.sub.split(" · ").filter(Boolean).map((tag) => (
                  <span key={tag} style={{ fontSize: "12px", fontWeight: 600, color: "var(--fg-secondary)", background: "var(--bg-elevated-2)", border: "1px solid var(--frost)", borderRadius: "999px", padding: "4px 12px" }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          <p style={{ marginTop: "16px", fontSize: "16px", lineHeight: 1.7, color: "var(--fg-primary)", maxWidth: "780px", fontWeight: 500 }}>{analysis.summary}</p>

          {(() => {
            // 데이터 카드는 항상 노출 — 로그인+백엔드면 실데이터, 아니면 데모(stocks)로 폴백
            const src = userSummary?.positions?.length
              ? userSummary.positions
              : stocks.map((s) => ({ ticker: s.ticker, name: s.name, weight: s.weight, pnl_pct: s.pnl, current_value_krw: s.value, pnl_krw: 0 }));
            const ps = [...src].sort((a, b) => b.weight - a.weight);
            const top = ps[0];
            const isKR = (t: string) => /\.(KS|KQ)$/i.test(t) || /^\d{6}/.test(t);
            const krW = Math.round(ps.filter((p) => isKR(p.ticker)).reduce((s, p) => s + p.weight, 0));
            const usW = Math.max(0, 100 - krW);
            const top3 = Math.round(ps.slice(0, 3).reduce((s, p) => s + p.weight, 0));
            const conc = top.weight >= 40 ? { t: "집중 높음", c: "var(--red)" } : top.weight >= 25 ? { t: "보통", c: "var(--yellow)" } : { t: "분산 양호", c: "var(--green)" };
            const div3 = top3 >= 70 ? { t: "편중", c: "var(--red)" } : top3 >= 50 ? { t: "보통", c: "var(--yellow)" } : { t: "고른 편", c: "var(--green)" };
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginTop: "20px" }}>
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--frost)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "12px" }}>최대 종목 집중도 · {top.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
                      <div className="num" style={{ fontSize: "24px", fontWeight: 800 }}>{top.weight}%</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: conc.c }}>{conc.t}</div>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-elevated-2)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, top.weight)}%`, background: conc.c, borderRadius: "999px" }} />
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--frost)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "12px" }}>국내 · 해외 비중</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
                      <div className="num" style={{ fontSize: "24px", fontWeight: 800 }}>{krW} : {usW}</div>
                      <div style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                        <span style={{ color: "var(--yellow)" }}>국내</span> / <span style={{ color: "var(--blue)" }}>해외</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", height: "8px", borderRadius: "999px", overflow: "hidden", gap: "2px" }}>
                      <div style={{ width: `${krW}%`, background: "var(--yellow)" }} />
                      <div style={{ width: `${usW}%`, background: "var(--blue)" }} />
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--frost)", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "12px" }}>상위 3종목 집중</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
                      <div className="num" style={{ fontSize: "24px", fontWeight: 800 }}>{top3}%</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: div3.c }}>{div3.t}</div>
                    </div>
                    <div style={{ height: "8px", background: "var(--bg-elevated-2)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, top3)}%`, background: div3.c, borderRadius: "999px" }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "10px", lineHeight: 1.5 }}>
                  집중도가 높을수록 한 종목·한 시장의 움직임이 전체 수익률을 더 크게 좌우합니다.
                </div>
              </>
            );
          })()}

          {analysis.characteristics.length > 0 && (
            <div style={{ marginTop: "22px" }}>
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "10px" }}>포트폴리오 특성</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {analysis.characteristics.map((t, i) => (
                  <span key={i} style={{ fontSize: "13px", color: "var(--fg-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--frost)", borderRadius: "9px", padding: "8px 13px" }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.strengths.length > 0 && (
            <div style={{ marginTop: "18px", padding: "16px 18px", background: "var(--green-soft)", border: "1px solid var(--frost)", borderRadius: "14px", display: "flex", gap: "12px", alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>강점</span>
              <span style={{ fontSize: "14px", color: "var(--fg-primary)", lineHeight: 1.65 }}>{analysis.strengths.join("    ·    ")}</span>
            </div>
          )}

          {analysis.risks.length > 0 && (
            <div style={{ marginTop: "14px", padding: "18px 20px", background: "rgba(255,32,71,0.10)", border: "1px solid var(--frost)", borderRadius: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--red)", marginBottom: "11px" }}>리스크</div>
              <div style={{ fontSize: "15px", color: "var(--fg-primary)", lineHeight: 1.6, fontWeight: 500 }}>{analysis.risks[0]}</div>
              {analysis.risks.length > 1 && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--frost-alt)", display: "flex", flexDirection: "column", gap: "9px" }}>
                  {analysis.risks.slice(1).map((r, i) => (
                    <div key={i} style={{ fontSize: "13px", color: "var(--fg-secondary)", lineHeight: 1.55 }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {analysis.suggestions.length > 0 && (
            <div style={{ marginTop: "18px", padding: "18px 20px", background: "var(--bg-elevated)", border: "1px solid var(--frost)", borderRadius: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--yellow)", marginBottom: "14px" }}>다음 단계 · 점검 포인트</div>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "13px", margin: 0, padding: 0 }}>
                {analysis.suggestions.map((t, i) => (
                  <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span className="num" style={{ flexShrink: 0, width: "23px", height: "23px", borderRadius: "8px", background: "var(--yellow-soft)", color: "var(--yellow)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    <span style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--fg-primary)" }}>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p style={{ marginTop: "20px", fontSize: "12px", color: "var(--fg-muted)" }}>
            더 깊은 분석이나 근거가 궁금하면{" "}
            <Link to="/chat" style={{ color: "var(--red)", fontWeight: 600 }}>코치에게 물어보세요 →</Link>
          </p>
          <p style={{ marginTop: "8px", fontSize: "11px", color: "var(--fg-muted)" }}>정보 제공 목적이며, 투자 권유가 아닙니다.</p>
        </section>
      </div>
      </div>
    </>
  );
}
