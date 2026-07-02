"""시장 데이터 수집 진입점 — 현태/수빈/웹 UI가 호출함.

KR 종목은 pykrx, US 종목은 yfinance로 실데이터 수집.
외부 API 실패 시 mock fallback 유지.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

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

    # 폴백을 채우기 전에 실데이터(fetch에서 온) 존재 여부를 기록한다.
    # mock 의 날짜는 date.today() 라, 전면 outage 로 stock_data 가 mock 으로만
    # 채워지면 max(dates) 가 휴장일에도 today 가 돼 버린다. 실데이터가 없으면
    # today 대신 가장 최근 거래일(평일)을 market_date 로 쓴다 (ADR 0013 deferred).
    real_dates = [sd.date for sd in stock_data.values()]

    # 수집 실패한 종목은 mock fallback
    fallback = mock_stock_data()
    for ticker in tickers:
        if ticker not in stock_data and ticker in fallback:
            stock_data[ticker] = fallback[ticker]

    # 뉴스 수집 (실패 시 mock fallback)
    news = fetch_news()

    base = mock_market_output()
    # 실데이터가 있으면 그 최신 날짜, 전면 mock 폴백이면 가장 최근 평일로 back off
    # (비거래일/주말을 시장일자로 보고하지 않도록).
    market_date = max(real_dates) if real_dates else _latest_weekday()

    return MarketOutput(
        collected_at=datetime.now(),
        market_date=market_date,
        daily_market_summary=base.daily_market_summary,
        stock_data=stock_data,
        trending_keywords=base.trending_keywords,
        raw_news=news if news else base.raw_news,
        market_topics=base.market_topics,
    )


def _latest_weekday(today: date | None = None) -> date:
    """가장 최근 평일(월~금)을 반환한다.

    전면 mock 폴백(실시세 outage) 시 ``market_date`` 를 today 대신 이 값으로 써서,
    주말에 코치가 비거래일을 시장일자로 말하지 않게 한다. 공휴일은 근사하지 않고
    (거래일 캘린더 없이 판단 불가) 요일만 back off 한다.
    """
    d = today or date.today()
    # date.weekday(): Mon=0 .. Sun=6. 토(5)/일(6)이면 직전 금요일로 back off.
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d
