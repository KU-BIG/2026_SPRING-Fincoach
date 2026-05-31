"""포트폴리오 평가금액/손익/비중 계산."""

from __future__ import annotations

from shared.models import Holding, StockData

# 실시간 환율 조회는 다음 PR. 현재 고정값 사용.
DEFAULT_USD_KRW = 1400.0


def evaluate_holding(
    holding: Holding,
    stock_data: dict[str, StockData],
    usd_krw: float = DEFAULT_USD_KRW,
) -> dict:
    """개별 종목 평가. 현재가가 없으면 매수평단으로 fallback."""
    sd = stock_data.get(holding.ticker)
    current_price = sd.close if sd else holding.avg_price

    current_value = holding.quantity * current_price
    cost = holding.quantity * holding.avg_price
    pnl = current_value - cost

    # KRW 환산
    fx = usd_krw if holding.currency == "USD" else 1.0
    current_value_krw = current_value * fx
    pnl_krw = pnl * fx
    cost_krw = cost * fx
    pnl_pct = (pnl / cost * 100) if cost != 0 else 0.0

    return {
        **holding.model_dump(),
        "current_price": current_price,
        "current_value": current_value,
        "current_value_krw": current_value_krw,
        "cost_krw": cost_krw,
        "pnl": pnl,
        "pnl_krw": pnl_krw,
        "pnl_pct": round(pnl_pct, 2),
    }


def calculate_portfolio(
    accounts: list,
    stock_data: dict[str, StockData],
    usd_krw: float = DEFAULT_USD_KRW,
) -> dict:
    """전체 포트폴리오 계산 결과 반환."""
    evaluated_accounts = []
    all_holdings = []
    total_cash_krw = 0.0

    for acc in accounts:
        cash_krw = acc.cash_krw + acc.cash_usd * usd_krw
        total_cash_krw += cash_krw

        holdings = []
        for h in acc.holdings:
            ev = evaluate_holding(h, stock_data, usd_krw)
            holdings.append(ev)
            all_holdings.append(ev)

        evaluated_accounts.append({
            "account_name": acc.account_name,
            "cash_krw": acc.cash_krw,
            "cash_usd": acc.cash_usd,
            "holdings": holdings,
        })

    total_holdings_value = sum(h["current_value_krw"] for h in all_holdings)
    total_value = total_holdings_value + total_cash_krw
    total_pnl = sum(h["pnl_krw"] for h in all_holdings)
    total_cost = sum(h["cost_krw"] for h in all_holdings)
    pnl_pct = (total_pnl / total_cost * 100) if total_cost != 0 else 0.0

    # 비중 계산
    for h in all_holdings:
        h["weight"] = round(h["current_value_krw"] / total_value * 100, 2) if total_value != 0 else 0.0

    return {
        "accounts": evaluated_accounts,
        "summary": {
            "total_value_krw": round(total_value),
            "total_pnl_krw": round(total_pnl),
            "pnl_pct": round(pnl_pct, 2),
        },
        "positions": [
            {
                "ticker": h["ticker"],
                "name": h["name"],
                "weight": h["weight"],
                "pnl_pct": h["pnl_pct"],
                "current_value_krw": h["current_value_krw"],
                "pnl_krw": h["pnl_krw"],
            }
            for h in all_holdings
        ],
        "errors": [],
    }
