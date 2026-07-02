"""yfinance를 이용한 미국 주식 실데이터 수집.

yfinance import 실패 또는 API 오류 시 빈 dict 반환 → 호출자가 mock fallback 처리.

DoS 하드닝 (#161/#162): 이 경로는 공개 GET /api/market/summary 가 태우므로,
portfolio_analyzer/price_fetcher.py 와 같은 방어를 이식한다.
- 종목당 네트워크 타임아웃 (``yf.history(timeout=)``) — yfinance 자체 타임아웃이
  없어 멈춘 소켓이 워커 스레드를 무한 점유하는 것을 막는다.
- 전체 배치 데드라인 (``ThreadPoolExecutor`` + ``as_completed(timeout=)``) —
  느린 종목 하나가 배치 전체를 지연시키지 못하게 하고, 데드라인 내 못 끝낸
  종목은 miss 로 처리(호출자가 mock fallback).
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

from shared.models import Market, StockData

# 종목당 네트워크 타임아웃과 배치 전체 벽시계 상한. price_fetcher.py 와 동일 취지.
_HISTORY_TIMEOUT_SECONDS = 8.0
_BATCH_TIMEOUT_SECONDS = 20.0
# 병렬 워커 상한 — 티커가 많아도 스레드가 무한히 늘지 않게 캡.
_MAX_WORKERS = 8


def fetch_us_stocks(tickers: list[str]) -> dict[str, StockData]:
    """US 종목 티커 리스트를 받아 yfinance로 실데이터 수집.

    실패/타임아웃한 종목은 결과에서 제외. 전체 실패 시 빈 dict 반환.
    """
    try:
        import yfinance as yf
    except ImportError:
        return {}

    to_fetch = [t for t in tickers if t]
    if not to_fetch:
        return {}

    result: dict[str, StockData] = {}
    pool = ThreadPoolExecutor(max_workers=min(_MAX_WORKERS, len(to_fetch)))
    try:
        # 완료 순서로 수집. 배치 데드라인 내 못 끝낸 종목만 miss 로 남는다.
        futures = {pool.submit(_fetch_one, yf, t): t for t in to_fetch}
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
        # 멈춘 소켓에 걸린 스레드를 조인하며 요청을 붙잡지 않는다.
        pool.shutdown(wait=False)

    return result


def _fetch_one(yf, ticker: str) -> StockData | None:
    """단일 US 종목 데이터 수집. 데이터 없으면 None 반환."""
    t = yf.Ticker(ticker)
    # 최근 25거래일 — change_pct, return_5d 계산에 충분
    hist = t.history(period="25d", timeout=_HISTORY_TIMEOUT_SECONDS)
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
