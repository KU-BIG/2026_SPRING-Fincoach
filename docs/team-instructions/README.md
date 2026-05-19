# 팀원별 Claude 지시문

각 팀원에게 그대로 전달 가능한 작업 지시문.

## 전달 방법

각 팀원에게 본인 파일 내용 전달. 팀원은 새 Claude Code (또는 사용하는 AI) 세션을 열고 본인 지시문 코드 블록을 첫 메시지로 붙여넣음. 이후 AI가 루트 `CLAUDE.md`, 본인 모듈 `CLAUDE.md`, `docs/INTERFACES.md`를 읽은 뒤 작업 진행.

- 은서: `docs/team-instructions/eunseo.md` (Market Intelligence)
- 현태: `docs/team-instructions/hyuntae.md` (Portfolio Analyzer)
- 수빈: `docs/team-instructions/subin.md` (Coach Chat)

## 협업 모델

- 각 팀원은 본인 모듈 디렉토리에서만 작업
- 본인 브랜치 만들어서 작업 → GitHub PR → 병승 리뷰 → 머지
- 막힘/질문/인터페이스 변경 요청은 GitHub Issue
- `shared/` 변경은 병승 단독 — 다른 사람은 Issue로 요청만 가능

## 공통 전제

- `shared/`, 다른 사람 모듈 디렉토리 직접 수정 금지
- 금융 답변은 정보 제공 톤, 직접 추천 표현 금지, 면책 문구 부착
- 외부 API 실패 시 mock fallback
- API key, `.env` 미커밋
- PR 본문/Issue/문서/커밋 메시지는 회사형 음슴체
- 사용자(병승) 호칭은 "병승" 단독

## 작업 흐름은 팀원 자율

워크플로 (브랜치 이름 규칙, 일일 로그, 커밋 단위, slash command 등) 는 각자 본인 AI 도구와 결정. 위 지시문은 계약/스코프/컴플라이언스만 강제하고 워크플로는 강제하지 않음.
