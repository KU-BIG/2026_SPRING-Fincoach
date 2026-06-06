"""ticker_matcher 테스트.

pykrx 외부 API는 mock으로 대체. 실제 API 연동은 통합 테스트에서 별도 확인.
"""

from __future__ import annotations

from unittest.mock import patch

from portfolio_analyzer.ticker_matcher import name_to_ticker

# KOSPI + KOSDAQ 섞인 mock (접미사 포함)
MOCK_KRX = {
    "삼성전자": "005930.KS",      # KOSPI
    "sk하이닉스": "000660.KS",    # KOSPI
    "naver": "035420.KQ",         # KOSDAQ
    "카카오": "035720.KQ",         # KOSDAQ
    "삼성sdi": "006400.KS",       # KOSPI — 부분 매칭 "삼성" 테스트용
    "삼성바이오로직스": "207940.KS",
    "에코프로비엠": "247540.KQ",   # KOSDAQ — .KQ 접미사 검증용
}


def _mock_load(return_value=None):
    """_load_krx_map을 주어진 dict로 대체하는 patch 헬퍼."""
    target = MOCK_KRX if return_value is None else return_value
    return patch("portfolio_analyzer.ticker_matcher._load_krx_map", return_value=target)


# --- 미국 종목 (하드코딩 매핑) ---

def test_us_apple():
    assert name_to_ticker("Apple") == "AAPL"


def test_us_nvidia():
    assert name_to_ticker("NVIDIA") == "NVDA"


def test_us_tesla():
    assert name_to_ticker("Tesla") == "TSLA"


def test_us_case_insensitive():
    assert name_to_ticker("apple") == "AAPL"
    assert name_to_ticker("APPLE") == "AAPL"


def test_us_alias():
    assert name_to_ticker("MS") == "MSFT"
    assert name_to_ticker("Facebook") == "META"
    assert name_to_ticker("Google") == "GOOGL"


def test_us_not_found():
    assert name_to_ticker("UnknownCorp") is None


def test_us_explicit_market():
    assert name_to_ticker("Apple", market="US") == "AAPL"


# --- 한국 종목 — KOSPI (.KS) ---

def test_kr_samsung_kospi():
    with _mock_load():
        assert name_to_ticker("삼성전자") == "005930.KS"


def test_kr_skhynix_kospi():
    with _mock_load():
        assert name_to_ticker("SK하이닉스") == "000660.KS"


# --- 한국 종목 — KOSDAQ (.KQ) ---

def test_kr_naver_kosdaq():
    """KOSDAQ 종목은 .KQ 접미사가 붙어야 한다."""
    with _mock_load():
        assert name_to_ticker("NAVER", market="KR") == "035420.KQ"


def test_kr_kakao_kosdaq():
    with _mock_load():
        assert name_to_ticker("카카오") == "035720.KQ"


def test_kr_ecoprobm_kosdaq():
    """에코프로비엠처럼 순수 코스닥 종목도 .KQ 반환 확인."""
    with _mock_load():
        assert name_to_ticker("에코프로비엠") == "247540.KQ"


# --- 모호한 종목 — 부분 매칭 ---

def test_ambiguous_samsung_returns_first_match():
    """"삼성" → 삼성 계열 중 첫 번째 결과 반환 (None이 아님)."""
    with _mock_load():
        result = name_to_ticker("삼성")
        assert result is not None
        assert result.endswith(".KS") or result.endswith(".KQ")


def test_not_found_returns_none():
    with _mock_load():
        assert name_to_ticker("없는종목") is None


# --- auto 감지 ---

def test_auto_detects_korean():
    with _mock_load():
        assert name_to_ticker("삼성전자") == "005930.KS"


def test_auto_detects_english():
    assert name_to_ticker("Tesla") == "TSLA"


def test_auto_latin_korean_stock_needs_explicit_market():
    """라틴 표기 한국 종목(NAVER)은 auto 시 US 경로 → None. market="KR" 명시 필요."""
    assert name_to_ticker("NAVER") is None  # auto → US 경로
    with _mock_load():
        assert name_to_ticker("NAVER", market="KR") == "035420.KQ"


def test_kr_explicit_market():
    with _mock_load():
        assert name_to_ticker("삼성전자", market="KR") == "005930.KS"


# --- 엣지 케이스 ---

def test_empty_string():
    assert name_to_ticker("") is None


def test_whitespace_only():
    assert name_to_ticker("   ") is None


# --- pykrx 완전 실패 시 fallback ---

def test_kr_fallback_samsung():
    """pykrx 빈 결과 → _KR_FALLBACK 사용, .KS 접미사 포함."""
    with _mock_load(return_value={}):
        assert name_to_ticker("삼성전자") == "005930.KS"


def test_kr_fallback_naver_kosdaq():
    """pykrx 실패 시 fallback에서도 NAVER는 .KQ로 반환."""
    with _mock_load(return_value={}):
        assert name_to_ticker("NAVER", market="KR") == "035420.KQ"


def test_kr_fallback_not_found():
    with _mock_load(return_value={}):
        assert name_to_ticker("없는종목") is None


# --- lru_cache 대신 모듈 캐시 — 실패 시 재시도 가능 ---

def test_cache_not_set_on_empty_result():
    """pykrx가 빈 dict를 반환하면 _KRX_CACHE가 None으로 유지돼야 한다."""
    import portfolio_analyzer.ticker_matcher as m

    original = m._KRX_CACHE
    try:
        m._KRX_CACHE = None
        with patch("portfolio_analyzer.ticker_matcher._load_krx_map", return_value={}):
            name_to_ticker("삼성전자")
        assert m._KRX_CACHE is None
    finally:
        m._KRX_CACHE = original
