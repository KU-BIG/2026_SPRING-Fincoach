"""pykrx를 이용한 한국 주식 실데이터 수집.

pykrx import 실패 또는 API 오류 시 빈 dict 반환 → 호출자가 mock fallback 처리.

DoS 하드닝 (#161/#162): 이 경로는 공개 GET /api/market/summary 가 태우므로,
portfolio_analyzer/price_fetcher.py 와 같은 방어를 이식한다. pykrx 의
``get_market_ohlcv_by_date`` 는 ``timeout=`` 인자가 없어, 대신
- 종목 fetch 를 ``ThreadPoolExecutor`` + ``as_completed(timeout=)`` 로 감싸
  전체 배치 데드라인을 두고 (멈춘 종목은 miss → mock fallback),
- 최근 거래일 직렬 probe(최대 10회 네트워크 왕복)에 전체 시간 예산을 둬
  10회 × (긴 대기) 로 요청이 늘어지지 않게 한다.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta

from shared.models import Market, StockData

# 배치 전체 벽시계 상한과 병렬 워커 상한. price_fetcher.py 와 동일 취지.
_BATCH_TIMEOUT_SECONDS = 20.0
_MAX_WORKERS = 8
# 최근 거래일 probe 전체 시간 예산 — 10회 직렬 왕복이 무한정 늘어지지 않게 캡.
_TRADING_DATE_PROBE_BUDGET_SECONDS = 8.0


def fetch_kr_stocks(tickers: list[str]) -> dict[str, StockData]:
    """KR 종목 티커 리스트를 받아 pykrx로 실데이터 수집.

    실패/타임아웃한 종목은 결과에서 제외. 전체 실패 시 빈 dict 반환.
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

    to_fetch = [t for t in tickers if t]
    if not to_fetch:
        return {}

    result: dict[str, StockData] = {}
    pool = ThreadPoolExecutor(max_workers=min(_MAX_WORKERS, len(to_fetch)))
    try:
        futures = {
            pool.submit(_fetch_one, krx, t, start_str, end_str): t for t in to_fetch
        }
        try:
            for fut in as_completed(futures, timeout=_BATCH_TIMEOUT_SECONDS):
                ticker = futures[fut]
                try:
                    data = fut.result()
                except Exception:
                    data = None
                if data is not None:
                    result[ticker] = data
        except TimeoutError:
            # 배치 데드라인 도달 — 아직 안 끝난 종목은 miss (mock fallback).
            pass
    finally:
        pool.shutdown(wait=False)

    return result


def _latest_trading_date(krx, lookback: int = 10) -> date | None:
    """최근 실제 거래일 탐색 (주말/공휴일 최대 10일 역추적).

    직렬 네트워크 probe 이므로 전체 시간 예산을 둬, 매 probe 가 느리게 실패해도
    ``_TRADING_DATE_PROBE_BUDGET_SECONDS`` 를 넘으면 중단한다 (요청 지연 상한).
    """
    deadline = time.monotonic() + _TRADING_DATE_PROBE_BUDGET_SECONDS
    d = date.today()
    for _ in range(lookback):
        if time.monotonic() >= deadline:
            break
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
