"""종목명 → 티커 매칭.

한국: pykrx KRX 종목 목록 검색
  - KOSPI → "{ticker}.KS", KOSDAQ → "{ticker}.KQ"
미국: 하드코딩 매핑 우선 → None 반환 (yfinance fallback은 다음 PR)
"""

from __future__ import annotations

import unicodedata
from datetime import date, timedelta

# 자주 쓰는 미국 종목 매핑
US_TICKER_MAP: dict[str, str] = {
    "apple": "AAPL",
    "nvidia": "NVDA",
    "tesla": "TSLA",
    "microsoft": "MSFT",
    "ms": "MSFT",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "amazon": "AMZN",
    "meta": "META",
    "facebook": "META",
    "netflix": "NFLX",
    "amd": "AMD",
    "intel": "INTC",
    "qualcomm": "QCOM",
    "broadcom": "AVGO",
    "tsmc": "TSM",
    "berkshire": "BRK-B",
    "jpmorgan": "JPM",
    "samsung": "005930.KS",  # 영문 삼성은 KS 티커로
}

# pykrx 성공 시에만 캐싱 (실패 시 None 유지 → 재시도 가능)
_KRX_CACHE: dict[str, str] | None = None

# KOSPI / KOSDAQ 각각 올바른 yfinance 접미사
_MARKET_SUFFIX: dict[str, str] = {
    "KOSPI": ".KS",
    "KOSDAQ": ".KQ",
}

# pykrx 실패 시 주요 종목 fallback (접미사 포함)
_KR_FALLBACK: dict[str, str] = {
    "삼성전자": "005930.KS",
    "sk하이닉스": "000660.KS",
    "lg에너지솔루션": "373220.KS",
    "현대차": "005380.KS",
    "기아": "000270.KS",
    "셀트리온": "068270.KS",
    "naver": "035420.KQ",   # KOSDAQ
    "카카오": "035720.KQ",   # KOSDAQ
}


def _normalize(text: str) -> str:
    """공백 strip + 소문자 + NFC 정규화."""
    return unicodedata.normalize("NFC", text).strip().lower()


def _is_korean(text: str) -> bool:
    return any("\uAC00" <= ch <= "\uD7A3" for ch in text)


def _load_krx_map() -> dict[str, str]:
    """pykrx로 KOSPI + KOSDAQ 전체 종목 {정규화된_종목명: 티커+접미사} 로드.

    성공 시에만 모듈 캐시에 저장. 실패·빈 결과 시 매 호출마다 재시도.
    공휴일/연휴 대비 최근 10일을 역추적해 실제 거래일 데이터를 찾는다.
    """
    global _KRX_CACHE
    if _KRX_CACHE is not None:
        return _KRX_CACHE

    try:
        from pykrx import stock

        d = date.today()
        for _ in range(10):
            if d.weekday() >= 5:  # 주말 건너뜀
                d -= timedelta(days=1)
                continue

            date_str = d.strftime("%Y%m%d")
            result: dict[str, str] = {}
            for market, suffix in _MARKET_SUFFIX.items():
                tickers = stock.get_market_ticker_list(date_str, market=market)
                for t in tickers:
                    name = stock.get_market_ticker_name(t)
                    result[_normalize(name)] = f"{t}{suffix}"

            if result:  # 공휴일이면 빈 결과 → 하루 더 역추적
                _KRX_CACHE = result
                return result

            d -= timedelta(days=1)

        return {}
    except Exception:
        return {}


def name_to_ticker(name: str, market: str = "auto") -> str | None:
    """종목명을 티커로 변환.

    Args:
        name: 종목명. 예) "삼성전자", "Apple", "NVIDIA"
        market: "KR", "US", "auto" (기본값 auto — 한글 포함 시 KR, 영문이면 US)

    Returns:
        티커 문자열 (예: "005930.KS", "035420.KQ", "AAPL") 또는 None.
        모호한 입력("삼성")은 pykrx 목록에서 이름에 포함되는 첫 번째 종목을 반환.

    Note:
        auto 감지는 한글 유무 기반이므로 NAVER·KAKAO·POSCO처럼 라틴 표기 한국
        종목은 US 경로로 분류돼 None이 됩니다. 이 경우 market="KR"을 명시하세요.
    """
    if not name or not name.strip():
        return None

    resolved_market = market
    if market == "auto":
        resolved_market = "KR" if _is_korean(name) else "US"

    if resolved_market == "US":
        return US_TICKER_MAP.get(_normalize(name))

    # KR: 정확 매칭 우선, 없으면 부분 매칭(첫 결과)
    key = _normalize(name)
    krx_map = _load_krx_map()

    if not krx_map:
        # pykrx 완전 실패 → fallback dict (정확 매칭만)
        return _KR_FALLBACK.get(key)

    # 정확 매칭
    if key in krx_map:
        return krx_map[key]

    # 부분 매칭: key가 종목명에 포함되는 첫 번째 결과
    for norm_name, ticker in krx_map.items():
        if key in norm_name:
            return ticker

    return None
