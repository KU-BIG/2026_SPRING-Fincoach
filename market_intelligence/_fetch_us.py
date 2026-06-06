"""yfinance를 이용한 미국 주식 실데이터 수집.

yfinance import 실패 또는 API 오류 시 빈 dict 반환 → 호출자가 mock fallback 처리.
"""

from __future__ import annotations

from datetime import date

from shared.models import Market, StockData


def fetch_us_stocks(tickers: list[str]) -> dict[str, StockData]:
    """US 종목 티커 리스트를 받아 yfinance로 실데이터 수집.

    실패한 종목은 결과에서 제외. 전체 실패 시 빈 dict 반환.
    """
    try:
        import yfinance as yf
    except ImportError:
        return {}

    result: dict[str, StockData] = {}
    for ticker in tickers:
        try:
            data = _fetch_one(yf, ticker)
            if data is not None:
                result[ticker] = data
        except Exception:
            continue

    return result


def _fetch_one(yf, ticker: str) -> StockData | None:
    """단일 US 종목 데이터 수집. 데이터 없으면 None 반환."""
    t = yf.Ticker(ticker)
    # 최근 25거래일 — change_pct, return_5d 계산에 충분
    hist = t.history(period="25d")
    if hist.empty:
        return None

    latest = hist.iloc[-1]
    trade_date = hist.index[-1].date() if hasattr(hist.index[-1], "date") else date.today()

    close = float(latest["Close"])
    volume = int(latest["Volume"])

    change_pct = 0.0
    if len(hist) >= 2:
        prev_close = float(hist.iloc[-2]["Close"])
        if prev_close > 0:
            change_pct = round((close - prev_close) / prev_close * 100, 2)

    return_5d = None
    if len(hist) >= 6:
        close_5d_ago = float(hist.iloc[-6]["Close"])
        if close_5d_ago > 0:
            return_5d = round((close - close_5d_ago) / close_5d_ago * 100, 2)

    info = t.info
    name = info.get("shortName") or info.get("longName") or ticker

    return StockData(
        ticker=ticker,
        name=name,
        market=Market.US,
        date=trade_date,
        close=close,
        change_pct=change_pct,
        volume=volume,
        return_5d=return_5d,
    )
