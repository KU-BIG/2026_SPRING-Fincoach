"""FinCoach Streamlit 메인 앱 (수빈 모듈).

CTO 0주차 골격. 수빈이 채워나갈 부분은 TODO로 표시.
"""

from __future__ import annotations

import streamlit as st

from shared.disclaimers import QA_DISCLAIMER
from shared.mocks import mock_analysis_report, mock_market_output


def main() -> None:
    st.set_page_config(page_title="FinCoach", page_icon=None, layout="wide")
    st.title("FinCoach")
    st.caption("내 포트폴리오를 아는 AI 금융 코치")

    with st.sidebar:
        st.subheader("오늘의 시장")
        market = mock_market_output()
        st.write(market.daily_market_summary)
        st.subheader("TOP 키워드")
        for kw in market.trending_keywords[:5]:
            st.write(f"- {kw.keyword} (score {kw.score})")

    tab_chat, tab_report = st.tabs(["Q&A", "분석 리포트"])

    with tab_chat:
        st.subheader("Q&A")
        # TODO(수빈): coach_chat.chat_engine.answer() 연결
        if "messages" not in st.session_state:
            st.session_state.messages = []
        for msg in st.session_state.messages:
            st.chat_message(msg["role"]).write(msg["content"])
        if prompt := st.chat_input("질문을 입력하세요"):
            st.session_state.messages.append({"role": "user", "content": prompt})
            st.chat_message("user").write(prompt)
            # 더미 응답
            reply = f"(데모) '{prompt}'에 대한 답변 자리. 수빈이 LLM 연결 예정."
            st.session_state.messages.append({"role": "assistant", "content": reply})
            st.chat_message("assistant").write(reply)
        st.caption(QA_DISCLAIMER)

    with tab_report:
        report = mock_analysis_report()
        st.subheader(report.portfolio_type)
        st.write(report.summary)
        st.markdown("**리스크**")
        for r in report.risks:
            st.write(f"- {r}")
        st.markdown("**개선 제안**")
        for s in report.suggestions:
            st.write(f"- {s}")
        st.caption(report.disclaimer)


if __name__ == "__main__":
    main()
