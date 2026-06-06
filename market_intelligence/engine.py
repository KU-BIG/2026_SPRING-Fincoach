"""시장 데이터 수집 진입점 — 현태/수빈/웹 UI가 호출함.

KR 종목은 pykrx, US 종목은 yfinance로 실데이터 수집.
외부 API 실패 시 mock fallback 유지.
"""

from __future__ import annotations

from datetime import date, datetime

from market_intelligence._fetch_kr import fetch_kr_stocks
from market_intelligence._fetch_news import fetch_news
from market_intelligence._fetch_us import fetch_us_stocks
from shared.mocks import mock_market_output, mock_stock_data
from shared.models import MarketOutput


def collect_market(tickers: list[str]) -> MarketOutput:
    """종목 티커 리스트를 받아 시장 데이터를 수집해 ``MarketOutput``으로 반환함.

    KR 종목(.KS/.KQ)은 pykrx, US 종목은 yfinance 실데이터 우선.
    실패한 종목은 mock fallback.

    Args:
        tickers: 수집 대상 종목 티커 리스트 (예: ``["005930.KS", "AAPL"]``).

    Returns:
        ``shared.models.MarketOutput`` 객체.
    """
    kr_tickers = [t for t in tickers if t.endswith(".KS") or t.endswith(".KQ")]
    us_tickers = [t for t in tickers if t not in kr_tickers]

    stock_data = {}
    if kr_tickers:
        stock_data.update(fetch_kr_stocks(kr_tickers))
    if us_tickers:
        stock_data.update(fetch_us_stocks(us_tickers))

    # 수집 실패한 종목은 mock fallback
    fallback = mock_stock_data()
    for ticker in tickers:
        if ticker not in stock_data and ticker in fallback:
            stock_data[ticker] = fallback[ticker]

    # 뉴스 수집 (실패 시 mock fallback)
    news = fetch_news()

    base = mock_market_output()
    market_date = (
        max(sd.date for sd in stock_data.values()) if stock_data else date.today()
    )

    return MarketOutput(
        collected_at=datetime.now(),
        market_date=market_date,
        daily_market_summary=base.daily_market_summary,
        stock_data=stock_data,
        trending_keywords=base.trending_keywords,
        raw_news=news if news else base.raw_news,
        market_topics=base.market_topics,
    )
