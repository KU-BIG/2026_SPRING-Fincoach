"""Disclaimer strings that must be attached to user-facing output.

법적 리스크 방지를 위해 모든 분석/응답에 첨부 필수.
"""

REPORT_DISCLAIMER = (
    "본 분석은 학습 및 정보 제공 목적이며, 투자 자문이 아닙니다. "
    "투자 결정과 그 결과에 대한 책임은 사용자 본인에게 있습니다."
)

QA_DISCLAIMER = (
    "FinCoach는 정보 제공 도구입니다. 특정 종목의 매수/매도를 추천하지 않습니다."
)

BACKTEST_DISCLAIMER = (
    "백테스트 결과는 과거 데이터 기반 시뮬레이션이며 미래 수익을 보장하지 않습니다."
)


def attach(report: str, kind: str = "report") -> str:
    """면책 문구를 본문 끝에 첨부."""
    mapping = {
        "report": REPORT_DISCLAIMER,
        "qa": QA_DISCLAIMER,
        "backtest": BACKTEST_DISCLAIMER,
    }
    return f"{report}\n\n---\n{mapping.get(kind, REPORT_DISCLAIMER)}"
