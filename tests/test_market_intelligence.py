"""market_intelligence.collect_market 가 MarketOutput 계약을 지키는지 확인."""

from datetime import date
from unittest.mock import MagicMock, patch

import pandas as pd

from market_intelligence import collect_market
from shared.models import Market, MarketOutput, StockData


def test_collect_market_returns_market_output():
    result = collect_market(["005930.KS", "AAPL"])
    assert isinstance(result, MarketOutput)


def test_collect_market_empty_tickers():
    result = collect_market([])
    assert isinstance(result, MarketOutput)


def test_collect_market_output_has_stock_data():
    result = collect_market(["005930.KS"])
    assert isinstance(result.stock_data, dict)
    assert result.daily_market_summary


# --- pykrx 실데이터 경로 ---

def _make_ohlcv_df(close: float, change_pct: float, volume: int, rows: int = 10) -> pd.DataFrame:
    """테스트용 pykrx OHLCV DataFrame 생성."""
    idx = pd.date_range(end="2026-06-06", periods=rows, freq="B")
    data = {
        "시가": [close * 0.99] * rows,
        "고가": [close * 1.01] * rows,
        "저가": [close * 0.98] * rows,
        "종가": [close] * rows,
        "거래량": [volume] * rows,
        "거래대금": [close * volume] * rows,
        "등락률": [change_pct] * rows,
    }
    return pd.DataFrame(data, index=idx)


def test_fetch_kr_stocks_real_data():
    """pykrx 정상 응답 → StockData 반환 검증."""
    mock_df = _make_ohlcv_df(close=71500, change_pct=1.42, volume=12345678, rows=10)

    mock_krx = MagicMock()
    mock_krx.get_market_ohlcv_by_date.return_value = mock_df
    mock_krx.get_market_ticker_name.return_value = "삼성전자"

    with (
        patch.dict("sys.modules", {"pykrx": MagicMock(), "pykrx.stock": mock_krx}),
        patch("market_intelligence._fetch_kr.fetch_kr_stocks") as mock_fetch,
    ):
        mock_fetch.return_value = {
            "005930.KS": StockData(
                ticker="005930.KS",
                name="삼성전자",
                market=Market.KR,
                date=date(2026, 6, 6),
                close=71500,
                change_pct=1.42,
                volume=12345678,
                return_5d=3.2,
            )
        }
        result = collect_market(["005930.KS"])

    assert "005930.KS" in result.stock_data
    sd = result.stock_data["005930.KS"]
    assert sd.market == Market.KR
    assert sd.close == 71500


def test_collect_market_fallback_when_pykrx_fails():
    """pykrx 실패 시 mock fallback으로 MarketOutput 반환."""
    with patch("market_intelligence.engine.fetch_kr_stocks", return_value={}):
        result = collect_market(["005930.KS"])

    assert isinstance(result, MarketOutput)
    assert "005930.KS" in result.stock_data


def test_collect_market_us_ticker_uses_mock():
    """US 종목은 pykrx 호출 없이 yfinance 경로로 수집."""
    with patch("market_intelligence.engine.fetch_kr_stocks") as mock_kr:
        result = collect_market(["AAPL"])
        mock_kr.assert_not_called()

    assert isinstance(result, MarketOutput)


# --- yfinance 실데이터 경로 ---

def _make_yf_hist(close: float, volume: int, rows: int = 10) -> pd.DataFrame:
    """테스트용 yfinance history DataFrame 생성."""
    idx = pd.date_range(end="2026-06-06", periods=rows, freq="B")
    data = {
        "Open": [close * 0.99] * rows,
        "High": [close * 1.01] * rows,
        "Low": [close * 0.98] * rows,
        "Close": [close] * rows,
        "Volume": [volume] * rows,
    }
    return pd.DataFrame(data, index=idx)


def test_fetch_us_stocks_real_data():
    """yfinance 정상 응답 → StockData 반환 검증."""
    with patch("market_intelligence.engine.fetch_us_stocks") as mock_fetch:
        mock_fetch.return_value = {
            "AAPL": StockData(
                ticker="AAPL",
                name="Apple Inc.",
                market=Market.US,
                date=date(2026, 6, 6),
                close=185.30,
                change_pct=-0.42,
                volume=54321000,
                return_5d=1.1,
            )
        }
        result = collect_market(["AAPL"])

    assert "AAPL" in result.stock_data
    sd = result.stock_data["AAPL"]
    assert sd.market == Market.US
    assert sd.close == 185.30


def test_collect_market_fallback_when_yfinance_fails():
    """yfinance 실패 시 mock fallback으로 MarketOutput 반환."""
    with patch("market_intelligence.engine.fetch_us_stocks", return_value={}):
        result = collect_market(["AAPL"])

    assert isinstance(result, MarketOutput)
    assert "AAPL" in result.stock_data


# --- market_date: 전면 outage staleness (ADR 0013 deferred) ---

def test_market_date_is_weekday_on_full_outage():
    """실시세 전면 실패(전부 mock 폴백) 시 market_date가 비거래일(주말)이 아니어야 함."""
    with (
        patch("market_intelligence.engine.fetch_kr_stocks", return_value={}),
        patch("market_intelligence.engine.fetch_us_stocks", return_value={}),
    ):
        result = collect_market(["005930.KS", "AAPL"])

    # 전면 outage → stock_data는 mock으로만 채워짐. market_date는 today가 아니라
    # 가장 최근 평일이어야 한다 (주말이면 금요일로 back off).
    assert result.market_date.weekday() < 5  # Mon..Fri


def test_market_date_uses_real_date_when_available():
    """실데이터가 있으면 market_date는 그 실데이터의 최신 날짜(max)를 쓴다."""
    real = StockData(
        ticker="005930.KS",
        name="삼성전자",
        market=Market.KR,
        date=date(2026, 6, 5),  # 금요일
        close=71500,
        change_pct=1.42,
        volume=12345678,
        return_5d=3.2,
    )
    with (
        patch(
            "market_intelligence.engine.fetch_kr_stocks",
            return_value={"005930.KS": real},
        ),
        patch("market_intelligence.engine.fetch_us_stocks", return_value={}),
    ):
        result = collect_market(["005930.KS", "AAPL"])

    assert result.market_date == date(2026, 6, 5)


def test_latest_weekday_backs_off_from_weekend():
    """_latest_weekday: 주말이면 직전 금요일로 back off, 평일이면 그대로."""
    from market_intelligence.engine import _latest_weekday

    # 2026-06-06은 토요일, 2026-06-07은 일요일 → 둘 다 금요일(06-05)로.
    assert _latest_weekday(date(2026, 6, 6)) == date(2026, 6, 5)
    assert _latest_weekday(date(2026, 6, 7)) == date(2026, 6, 5)
    # 평일은 그대로.
    assert _latest_weekday(date(2026, 6, 5)) == date(2026, 6, 5)  # Friday


# --- RSS 뉴스 경로 ---

def test_fetch_news_real_data():
    """feedparser 정상 응답 → NewsItem 리스트 반환."""
    from shared.models import NewsItem

    with patch("market_intelligence.engine.fetch_news") as mock_news:
        mock_news.return_value = [
            NewsItem(
                title="삼성전자 AI 반도체 수요 급증",
                link="https://example.com/1",
                published_at=date(2026, 6, 6),
                source="연합뉴스",
                summary="AI 반도체 수요가 급증하면서 삼성전자 주가가 상승세를 보이고 있다.",
                related_tickers=["005930.KS"],
                related_keywords=["반도체", "AI"],
            )
        ]
        result = collect_market(["005930.KS"])

    assert len(result.raw_news) >= 1
    assert result.raw_news[0].source == "연합뉴스"


def test_collect_market_fallback_when_news_fails():
    """뉴스 수집 실패 시 mock raw_news로 fallback."""
    with patch("market_intelligence.engine.fetch_news", return_value=[]):
        result = collect_market(["005930.KS"])

    assert isinstance(result, MarketOutput)
    assert len(result.raw_news) >= 1  # mock fallback


def test_news_item_has_required_fields():
    """NewsItem이 필수 필드를 모두 갖는지 확인."""
    from market_intelligence._fetch_news import _entry_to_news_item

    mock_entry = MagicMock()
    mock_entry.title = "테스트 뉴스"
    mock_entry.link = "https://example.com/test"
    mock_entry.summary = "<p>테스트 요약입니다.</p>"
    mock_entry.published_parsed = (2026, 6, 6, 9, 0, 0, 4, 157, 0)

    item = _entry_to_news_item(mock_entry, "테스트소스")
    assert item is not None
    assert item.title == "테스트 뉴스"
    assert item.source == "테스트소스"
    assert "<p>" not in item.summary  # HTML 제거됨
