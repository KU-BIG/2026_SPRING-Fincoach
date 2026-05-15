# shared/ - CTO 영역 (READ-ONLY for juniors)

이 폴더는 병승(CTO) 소유입니다. 다른 팀원은 직접 수정하면 안 됩니다.

## 만약 당신이 은서/현태/수빈이라면

이 폴더 안의 파일은 **읽기만** 하세요. 수정이 필요하면:

1. GitHub Issue를 만들어 무엇이 왜 필요한지 설명
2. CTO(병승)에게 알리고 합의 후
3. CTO가 PR을 올리거나, 본인이 PR을 올리면 CTO가 리뷰/머지

## 만약 당신이 병승이라면

`shared/` 변경은 모든 팀원에게 영향을 미칩니다. PR 올리기 전에 체크:

- [ ] 인터페이스 변경이면 `docs/decisions/`에 ADR 추가
- [ ] 모든 모듈의 mock이 새 모델 따르는지 확인
- [ ] `tests/test_contracts.py` 갱신
- [ ] 변경 사항을 팀 채널에 공지

## 파일 역할

- `models.py` - Pydantic 데이터 계약 (모듈 간 입출력)
- `mocks.py` - 팀원이 다른 모듈 안 기다리고 개발할 수 있게 하는 가짜 데이터
- `config.py` - 환경변수 로딩
- `exceptions.py` - 공통 예외
- `disclaimers.py` - 면책 문구 (사용자 출력 모든 곳에 첨부 필수)
