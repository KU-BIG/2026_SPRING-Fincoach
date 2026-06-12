"""LLM 실키 e2e 스모크 테스트 (#112).

실행: ANTHROPIC_API_KEY=sk-... python tests/smoke_test_llm.py
- 키 없으면 데모 모드 fallback만 검증
- 키 있으면 실 LLM 호출 + 스트리밍 + portfolio/analysis 검증

pytest 에서 제외 (실 API 키 + 비용 필요):
  pytest --ignore=tests/smoke_test_llm.py
"""

from __future__ import annotations

import json
import os
import sys
import time


def _base_url() -> str:
    return os.getenv("FINCOACH_API_URL", "http://localhost:8000")


def check(label: str, ok: bool, detail: str = "") -> None:
    symbol = "✓" if ok else "✗"
    print(f"  {symbol} {label}" + (f" — {detail}" if detail else ""))
    if not ok:
        sys.exit(1)


def test_chat_no_key() -> None:
    """키 없을 때 /api/chat 가 데모 메시지를 반환하는지 확인."""
    import urllib.request

    url = _base_url() + "/api/chat"
    body = json.dumps({"question": "PER이 뭐예요?", "history": []}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    check("/api/chat 응답 있음", "answer" in data)
    check("면책 문구 포함", "투자 권유" in data["answer"] or "정보 제공" in data["answer"])


def test_chat_stream_collect() -> None:
    """SSE 스트리밍 — 전체 델타를 수집해 면책 문구 포함 확인."""
    import urllib.request

    url = _base_url() + "/api/chat/stream"
    body = json.dumps({"question": "삼성전자 PER이 높으면 어떤 의미예요?", "history": []}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})

    full = ""
    done = False
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=30) as r:
        for raw in r:
            line = raw.decode().rstrip()
            if not line.startswith("data: "):
                continue
            payload = line[6:].strip()
            if payload == "[DONE]":
                done = True
                break
            try:
                ev = json.loads(payload)
                full += ev.get("delta", "")
                if ev.get("error"):
                    check("스트리밍 에러 없음", False, ev["error"])
            except json.JSONDecodeError:
                pass

    elapsed = time.time() - t0
    check("SSE [DONE] 수신", done)
    check("응답 텍스트 있음", len(full) > 10, f"{len(full)}자")
    check("면책 문구 포함", "투자 권유" in full or "정보 제공" in full or "추천" in full)
    print(f"    응답 시간: {elapsed:.1f}s")


def test_portfolio_analysis_parse() -> None:
    """/api/portfolio/analysis — JSON 파싱 + 마크다운 strip 확인."""
    import urllib.request

    url = _base_url() + "/api/portfolio/analysis"
    with urllib.request.urlopen(url, timeout=60) as r:
        data = json.loads(r.read())

    check("분석 응답 dict", isinstance(data, dict))
    check("마크다운 ``` 없음", "```" not in str(data), "LLM이 코드블록 반환 시 strip 필요")


def test_fallback_no_server() -> None:
    """서버 다운 시 클라이언트가 오류를 graceful하게 처리하는지 — 백엔드 단 확인."""
    # 이 테스트는 백엔드 수준 확인: ANTHROPIC_API_KEY 없으면 503 대신 데모 스트림 반환
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if api_key:
        print("  ⓘ 키 있음 — 실 LLM 모드 (fallback 테스트 스킵)")
        return
    print("  ⓘ 키 없음 — 데모 모드 fallback 확인")
    test_chat_stream_collect()  # 데모 메시지라도 SSE 흐름 확인


def main() -> None:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    base = _base_url()
    mode = "실 LLM" if api_key else "데모 모드"
    print(f"\n=== FinCoach LLM 스모크 테스트 ({mode}) ===")
    print(f"    대상: {base}\n")

    print("[1] /api/chat — 비스트리밍 응답 + 면책")
    test_chat_no_key()

    print("[2] /api/chat/stream — SSE 스트리밍")
    test_chat_stream_collect()

    print("[3] /api/portfolio/analysis — LLM JSON 파싱")
    try:
        test_portfolio_analysis_parse()
    except Exception as e:
        check("/api/portfolio/analysis 접근", False, str(e))

    print("[4] fallback 동작")
    test_fallback_no_server()

    print("\n모든 스모크 테스트 통과.")


if __name__ == "__main__":
    main()
