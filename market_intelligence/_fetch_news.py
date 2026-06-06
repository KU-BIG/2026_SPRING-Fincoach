"""feedparser를 이용한 RSS 뉴스 수집.

feedparser import 실패 또는 피드 오류 시 빈 리스트 반환 → 호출자가 처리.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from shared.models import NewsItem

# 수집 대상 RSS 피드
_RSS_FEEDS: list[tuple[str, str]] = [
    ("연합뉴스", "https://www.yonhapnews.co.kr/rss/economy.xml"),
    ("한국경제", "https://www.hankyung.com/feed/economy"),
    ("매일경제", "https://www.mk.co.kr/rss/30000001/"),
    ("조선비즈", "https://biz.chosun.com/site/data/rss/rss.xml"),
    ("Reuters", "https://feeds.reuters.com/reuters/businessNews"),
]

# 금융 관련 주요 키워드
_FINANCE_KEYWORDS: list[str] = [
    "반도체", "AI", "금리", "인플레이션", "환율", "코스피", "나스닥",
    "Fed", "연준", "실적", "배당", "IPO", "M&A", "ETF",
]

# 종목명 → 티커 매핑 (관련 티커 추출용)
_NAME_TO_TICKER: dict[str, str] = {
    "삼성전자": "005930.KS",
    "SK하이닉스": "000660.KS",
    "NAVER": "035420.KQ",
    "카카오": "035720.KQ",
    "현대차": "005380.KS",
    "Apple": "AAPL",
    "애플": "AAPL",
    "NVIDIA": "NVDA",
    "엔비디아": "NVDA",
    "Tesla": "TSLA",
    "테슬라": "TSLA",
    "Microsoft": "MSFT",
    "마이크로소프트": "MSFT",
}


def fetch_news(max_per_feed: int = 5) -> list[NewsItem]:
    """RSS 피드에서 뉴스 수집. 실패한 피드는 건너뜀.

    Args:
        max_per_feed: 피드당 최대 수집 기사 수.

    Returns:
        ``NewsItem`` 리스트. 전체 실패 시 빈 리스트.
    """
    try:
        import feedparser
    except ImportError:
        return []

    result: list[NewsItem] = []
    for source, url in _RSS_FEEDS:
        try:
            items = _parse_feed(feedparser, source, url, max_per_feed)
            result.extend(items)
        except Exception:
            continue

    return result


def _parse_feed(feedparser, source: str, url: str, max_items: int) -> list[NewsItem]:
    """단일 RSS 피드 파싱."""
    feed = feedparser.parse(url)
    items: list[NewsItem] = []

    for entry in feed.entries[:max_items]:
        try:
            item = _entry_to_news_item(entry, source)
            if item is not None:
                items.append(item)
        except Exception:
            continue

    return items


def _entry_to_news_item(entry, source: str) -> NewsItem | None:
    """feedparser entry → NewsItem 변환."""
    title = getattr(entry, "title", "").strip()
    link = getattr(entry, "link", "").strip()
    if not title or not link:
        return None

    raw_summary = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
    summary = _strip_html(raw_summary).strip() or title

    published_at = _parse_published(entry)

    full_text = f"{title} {summary}"
    related_tickers = _extract_tickers(full_text)
    related_keywords = _extract_keywords(full_text)

    return NewsItem(
        title=title,
        link=link,
        published_at=published_at,
        source=source,
        summary=summary[:300],  # 너무 길면 자름
        related_tickers=related_tickers,
        related_keywords=related_keywords,
    )


def _strip_html(text: str) -> str:
    """HTML 태그 제거."""
    return re.sub(r"<[^>]+>", "", text)


def _parse_published(entry) -> datetime:
    """published_parsed → datetime 변환. 없으면 현재 시각."""
    parsed = getattr(entry, "published_parsed", None)
    if parsed:
        try:
            return datetime(*parsed[:6], tzinfo=UTC)
        except Exception:
            pass
    return datetime.now(tz=UTC)


def _extract_tickers(text: str) -> list[str]:
    """본문에 언급된 종목명으로 관련 티커 추출."""
    return [ticker for name, ticker in _NAME_TO_TICKER.items() if name in text]


def _extract_keywords(text: str) -> list[str]:
    """본문에 포함된 금융 키워드 추출."""
    return [kw for kw in _FINANCE_KEYWORDS if kw in text]
