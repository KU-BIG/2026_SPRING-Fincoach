# FinCoach Design System

## 결 (방향)

**모던 Bento 그리드 + 모노톤 흑백 + 큰 산세리프.**

세리프 매거진 결(올드)도, 회색+청록 SaaS 클론(슬롭)도 모두 폐기. 흰 베이스 + 검정 액센트 + 다양한 크기의 Bento 박스 + 매우 굵은 산세리프 디스플레이로 차별한다.

## 원칙

- **흑백 모노톤**: 액센트 컬러를 쓰지 않음. 정보 색(positive/negative)만 색
- **Bento Grid**: 대시보드는 다양한 크기 박스로 정보 시각화 (단조 카드 3-col 폐기)
- **큰 산세리프**: Pretendard 700~800, display 56~72px
- **모서리 14~20px**: 모던 핀테크 트렌드
- **여백 비대칭**: 12-col grid 위에 박스 크기 다양화

## 컬러

### Light (디폴트)

```css
--bg-base:      #FFFFFF;
--bg-surface:   #F7F7F7;
--bg-muted:     #EFEFEF;

--fg-primary:   #0A0A0A;
--fg-secondary: #525252;
--fg-muted:     #A3A3A3;

--border:       #E5E5E5;
--border-strong:#C2C2C2;

--accent:       #0A0A0A;   /* 검정 액센트 (모노톤) */
--accent-soft:  #F2F2F2;
--accent-fg:    #FFFFFF;

--positive:     #1F8F4F;
--negative:     #D7263D;
--warn:         #B26A00;
--info:         #155EEF;
```

### Dark

```css
--bg-base:      #0A0A0A;
--bg-surface:   #141414;
--bg-muted:    #1F1F1F;

--fg-primary:   #FAFAFA;
--fg-secondary: #A3A3A3;
--fg-muted:     #6B6B6B;

--border:       #262626;
--border-strong:#3F3F3F;

--accent:       #FAFAFA;   /* 흰 액센트 (검정 반전) */
--accent-soft:  #1F1F1F;
--accent-fg:    #0A0A0A;

--positive:     #4ADE80;
--negative:     #F87171;
--warn:         #FBBF24;
--info:         #60A5FA;
```

### 사용 룰

- 액센트는 흑/백만. Tailwind 기본 팔레트(orange/purple/cyan 등) 금지
- 그라데이션 금지 (다크 네온 그라데이션은 절대 금지)
- 사이드 컬러 띠 금지 (좌측 3px accent border 류 어디에도 X)
- 수익/손실은 positive/negative 토큰만, 빨강=하락
- 정보 색 외에는 모노톤 유지

## 타이포

### 폰트

- **본문/UI**: Pretendard Variable
- **숫자**: Inter Variable + `font-variant-numeric: tabular-nums`
- 세리프/모노스페이스 전면 사용 금지

### 스케일

| 토큰 | 크기 | 두께 | 용도 |
|------|------|------|------|
| `display` | 56/64 (sm 64/72) | 800 | 페이지 영웅 |
| `headline` | 36/44 | 700 | 큰 섹션 |
| `subhead` | 22/30 | 600 | Bento 박스 제목 |
| `lead` | 18/30 | 400 | 도입부 |
| `body` | 15/26 | 400 | 본문 |
| `caption` | 11/16 | 500 + uppercase | 라벨/메타 |
| `num-hero` | 56/64 | 700 tabular | 영웅 숫자 |
| `num-lg` | 32/40 | 600 tabular | 큰 숫자 |
| `num` | 14/22 | 500 tabular | 표/지표 |

규칙:
- 페이지마다 영웅 디스플레이 1개 (56~72px)
- letter-spacing: display는 -0.025em (모던 결)
- 강조는 두께(500/600/700/800)로

## 간격 / 모서리

- 8px 베이스
- 모서리: xs 6px / sm 8px / md 10px / lg 14px / xl 20px (Bento는 14~20px)
- 그림자는 옅게(`shadow-card`), 호버시 한 단계 (`shadow-hover`)

## Bento Grid 원칙

- 12-col grid 위에 다양한 크기 박스
- 영웅 박스(col-span-12) + 큰박스(7/8) + 중간(4/5) + 작은(3) 혼용
- 박스 내부 패딩 24~32px
- 각 박스 보더 1px + 살짝 음영
- 박스 간 간격 16~24px

## 컴포넌트

### Bento 박스
- `bg-bg-surface` 또는 `bg-bg-base`
- 보더 1px, 모서리 14~20px
- 패딩 24~32px

### 버튼
- Primary: 검정 배경 + 흰 텍스트 (다크는 반전)
- Secondary: 보더만
- 모서리 8~10px

### 인풋
- 보더 1px, 모서리 8px
- focus 시 보더 검정(액센트)

### 차트
- 라인 2px, 그리드 옅게
- 수익 positive, 벤치마크 회색
- squiggly 데코 금지

## 모션

- 180ms / `cubic-bezier(0.2, 0, 0.1, 1)`
- Hover는 opacity/transform/border만, 색은 즉시
- 페이지 transition 금지

## 카피 톤

매거진/SaaS-templated 어투 모두 회피. 짧고 직설.

좋은 예:
- "오늘 시장 한 줄"
- "지금 내 포트폴리오"
- "이번 주 키워드"
- "코치 한마디"

피할 것:
- "오늘의 X" (SaaS-templated)
- "AI 기반 X" / "스마트 X" / "혁신적"
- 자기참조 카피
- 동사 3개 나열 (GENERATE/OPTIMIZE/EVOLVE 류)

## 페이지 구성

### Dashboard (Bento Grid)
```
[Bento 영웅 (col-12)] 시장 한 줄 + 평가금액 큰 숫자
[Bento KPI x 4 (col-3 each)] 평가/손익/수익률/종목수
[Bento (col-7)] 보유 종목 표  [Bento (col-5)] 시장 키워드
[Bento (col-12)] 코치 한마디 (큰 인용)
```

### Chat
```
[좌 사이드 (col-3)] 예시 질문 + 새 대화
[우 메인 (col-9)] 큰 헤드라인 + 대화
```

### Portfolio
```
[Bento 영웅 (col-12)] 평가금액 num-hero + 손익
[Bento x 3 (col-4 each)] 종목수 / 국내 / 해외
[Bento (col-12)] 보유 종목 표
```

### Learn
```
[좌 TOC (col-3)]
[우 본문 (col-9)] display 헤드 + 3단 구조
```

## 절대 금지

- 회색+청록/네온 액센트 (Linear/Vercel SaaS 클론)
- 세리프 매거진 결 (Bloomberg/FT)
- 카드 그리드 3-col 패턴 (Bento로 대체)
- 다크 + 네온 그라데이션
- Tailwind 기본 팔레트
- 전면 모노스페이스
- 사이드 컬러 띠
- "오늘의 X" 헤더
- 가짜 메트릭, 가짜 버전, BUILT WITH 푸터
- 자기참조 카피, 동사 3개 나열

## 참고했지만 차용하지 않는 것

| 참고 | 어떻게 |
|------|--------|
| Apple Vision Pro UI | Bento Grid 레이아웃 |
| Linear | 모서리 둥글기, 산세리프 톤 |
| Public.com | 큰 영웅 숫자 |
| Vercel | 모노톤 절제 |

## 변경 절차

1. 토큰 값 변경 → `web/src/styles/tokens.css` 동기화
2. 페이지 구조 변경 시 PR에 시각 스크린샷
3. 컬러/타이포 시스템급은 ADR
