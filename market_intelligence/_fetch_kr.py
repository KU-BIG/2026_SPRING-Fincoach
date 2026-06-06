"""pykrx를 이용한 한국 주식 실데이터 수집.

pykrx import 실패 또는 API 오류 시 빈 dict 반환 → 호출자가 mock fallback 처리.
"""

from __future__ import annotations

from datetime import date, timedelta

from shared.models import Market, StockData


def fetch_kr_stocks(tickers: list[str]) -> dict[str, StockData]:
    """KR 종목 티커 리스트를 받아 pykrx로 실데이터 수집.

    실패한 종목은 결과에서 제외. 전체 실패 시 빈 dict 반환.
    """
    try:
        from pykrx import stock as krx
    except ImportError:
        return {}

    trading_date = _latest_trading_date(krx)
    if trading_date is None:
        return {}

    start_str = (trading_date - timedelta(days=30)).strftime("%Y%m%d")
    end_str = trading_date.strftime("%Y%m%d")

    result: dict[str, StockData] = {}
    for ticker in tickers:
        try:
            data = _fetch_one(krx, ticker, start_str, end_str)
            if data is not None:
                result[ticker] = data
        except Exception:
            continue

    return result


def _latest_trading_date(krx, lookback: int = 10) -> date | None:
    """최근 실제 거래일 탐색 (주말/공휴일 최대 10일 역추적)."""
    d = date.today()
    for _ in range(lookback):
        ds = d.strftime("%Y%m%d")
        try:
            df = krx.get_market_ohlcv_by_date(ds, ds, "005930")
            if not df.empty:
                return d
        except Exception:
            pass
        d -= timedelta(days=1)
    return None


def _fetch_one(krx, ticker: str, start_str: str, end_str: str) -> StockData | None:
    """단일 종목 데이터 수집. 데이터 없으면 None 반환."""
    code = ticker.split(".")[0]
    df = krx.get_market_ohlcv_by_date(start_str, end_str, code)
    if df.empty:
        return None

    name = krx.get_market_ticker_name(code) or ticker
    latest = df.iloc[-1]
    trade_date = df.index[-1].date() if hasattr(df.index[-1], "date") else date.today()

    close = float(latest["종가"])
    change_pct = float(latest["등락률"])
    volume = int(latest["거래량"])

    return_5d = None
    if len(df) >= 6:
        prev_close = float(df.iloc[-6]["종가"])
        if prev_close > 0:
            return_5d = round((close - prev_close) / prev_close * 100, 2)

    return StockData(
        ticker=ticker,
        name=name,
        market=Market.KR,
        date=trade_date,
        close=close,
        change_pct=change_pct,
        volume=volume,
        return_5d=return_5d,
    )
