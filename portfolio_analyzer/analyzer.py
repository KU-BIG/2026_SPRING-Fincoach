"""공개 함수 4개 — 수빈/웹 UI가 호출하는 진입점."""

from __future__ import annotations

import json
import os

from portfolio_analyzer.calculator import calculate_portfolio
from shared.disclaimers import REPORT_DISCLAIMER
from shared.mocks import (
    mock_backtest_result,
    mock_portfolio,
    mock_stock_data,
)
from shared.models import Account, Holding


def _holdings_to_accounts(holdings: list[dict]) -> list[Account]:
    """프론트에서 받은 holdings 배열을 Account 리스트로 변환."""
    parsed = []
    for h in holdings:
        # ticker 기반으로 currency/market 자동 판별
        ticker = h.get("ticker", "")
        if ticker.endswith(".KS") or ticker.endswith(".KQ"):
            currency = "KRW"
            market = "KR"
        else:
            currency = "USD"
            market = "US"

        raw_currency = h.get("currency", "")
        parsed.append(Holding(
            name=h.get("name", ticker),
            ticker=ticker,
            market=market,
            quantity=float(h.get("shares", h.get("quantity", 0))),
            avg_price=float(h.get("avg_price", 0)),
            currency=raw_currency if raw_currency in ("KRW", "USD") else currency,
        ))

    return [Account(account_name="내 포트폴리오", holdings=parsed)]


def _resolve_stock_data(holdings: list[dict]) -> dict:
    """Look up quotes for user holdings. The real service (FINCOACH_LIVE_PRICES set)
    uses yfinance live quotes; tests/offline fall back to the mock so CI never hits
    the network. If the live lookup fails wholesale, fall back to the mock so at least
    some values render (a per-symbol miss is handled by calculator's avg-price fallback).
    """
    # Live on Render (which auto-sets RENDER=1) or when explicitly enabled; mock otherwise
    # so CI/local stay offline. RENDER covers us if the blueprint env var isn't synced.
    if not (os.getenv("FINCOACH_LIVE_PRICES") or os.getenv("RENDER")):
        return mock_stock_data()
    tickers = [h.get("ticker", "") for h in holdings if h.get("ticker")]
    if not tickers:
        return mock_stock_data()
    try:
        from portfolio_analyzer.price_fetcher import fetch_stock_data

        live = fetch_stock_data(tickers)
    except Exception:
        live = {}
    return live or mock_stock_data()


def get_portfolio_data(holdings: list[dict] | None = None) -> dict:
    """포트폴리오 요약 데이터 반환.

    Args:
        holdings: 프론트에서 전달한 유저 holdings 배열. None이면 mock 사용.
    """
    if holdings is not None:
        accounts = _holdings_to_accounts(holdings)
        stock_data = _resolve_stock_data(holdings)
    else:
        portfolio = mock_portfolio()
        accounts = portfolio.accounts
        stock_data = mock_stock_data()

    return calculate_portfolio(accounts, stock_data)


def _fallback_analysis() -> dict:
    """API 키 없거나 LLM 실패 시 반환하는 기본 분석."""
    return {
        "summary": "포트폴리오 분석을 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        "portfolio_type": "-",
        "investor_match": "-",
        "characteristics": [],
        "strengths": [],
        "risks": [],
        "suggestions": [],
        "market_context_note": "",
        "disclaimer": REPORT_DISCLAIMER,
    }


def _call_llm_analysis(portfolio_data: dict) -> dict:
    """LLM에 포트폴리오 분석 요청. JSON 응답 파싱."""
    import anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _fallback_analysis()

    positions_text = "\n".join(
        f"- {p['name']} ({p['ticker']}): 비중 {p['weight']}%, 수익률 {p['pnl_pct']}%"
        for p in portfolio_data["positions"]
    )
    s = portfolio_data["summary"]

    prompt = f"""다음 포트폴리오를 분석해서 JSON으로만 답해. 한국어로.

포트폴리오:
총평가금액: {s['total_value_krw']:,}원
총손익: {s['total_pnl_krw']:,}원 ({s['pnl_pct']}%)
보유 종목:
{positions_text}

아래 JSON 형식으로만 응답:
{{
  "summary": "포트폴리오 전체 특성 1~2문장 요약",
  "portfolio_type": "포트폴리오 유형 (예: 공격형 기술주 중심)",
  "investor_match": "어울리는 투자자 성향 (예: 성장주 선호 + 변동성 감내 가능한 투자자)",
  "characteristics": ["특성1", "특성2", "특성3"],
  "strengths": ["강점1", "강점2"],
  "risks": ["리스크1", "리스크2"],
  "suggestions": ["고려사항1", "고려사항2"],
  "market_context_note": "현재 시장 상황과 포트폴리오 관련성 한 줄"
}}

규칙:
- 특정 종목 매수/매도 직접 추천 금지
- 정보 제공, 리스크 설명, 시나리오 비교만
- JSON 외 다른 텍스트 없이 JSON만 반환"""

    client = anthropic.Anthropic(api_key=api_key)
    model = os.getenv("LLM_MODEL", "claude-haiku-4-5-20251001")
    response = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()
    # LLM이 ```json ... ``` 마크다운으로 감싸는 경우 제거
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    parsed = json.loads(text)
    parsed["disclaimer"] = REPORT_DISCLAIMER
    return parsed


def get_analysis_report(
    force_refresh: bool = False,
    holdings: list[dict] | None = None,
) -> dict:
    """LLM 분석 리포트 반환. 느린 함수, 요청 시만 호출."""
    try:
        portfolio_data = get_portfolio_data(holdings=holdings)
        return _call_llm_analysis(portfolio_data)
    except Exception:
        return _fallback_analysis()


def get_backtest_result(period: str = "1y") -> dict:
    """백테스트 결과 반환. 느린 함수, 요청 시만 호출."""
    result = mock_backtest_result()
    data = result.model_dump()
    data["period"] = period
    return data


def get_stock_chart(ticker: str, period: str = "1mo"):
    """종목별 차트 반환. 현재는 placeholder dict, 이후 plotly Figure 예정."""
    return {
        "ticker": ticker,
        "period": period,
        "chart_type": "placeholder",
        "message": "차트 데이터는 다음 PR에서 구현 예정",
    }
