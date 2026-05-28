# FinCoach Design System

벤치마킹: 토스(친근감, 한국어 톤), Coinbase(흰 베이스, 청록), Linear(타이포), Robinhood(차트), 카카오뱅크(둥근 모서리). 한 곳 그대로 베끼지 않고 조합.

## 방향

- 금융 = 신뢰. 다크네온 부적합
- 학습/코칭 = 텍스트 위주, 차분한 톤
- 한국어 우선, 한국 핀테크 톤
- 데이터 영역만 밀도 있게, 나머지 여백 충분히

## 컬러

### Light (디폴트)

```css
--bg-base:     #FAFBFC;   /* 본문 배경 (회색 약간 섞인 흰) */
--bg-surface:  #FFFFFF;   /* 카드 */
--bg-muted:    #F3F5F7;   /* 보조 영역 */

--fg-primary:  #0F1419;   /* 본문 */
--fg-secondary:#525965;   /* 보조 텍스트 */
--fg-muted:    #8B919C;   /* 라벨, 캡션 */

--border:      #E4E7EB;
--border-strong:#CDD2D9;

--accent:      #0E8270;   /* FinCoach Teal - 신뢰+성장 */
--accent-soft: #DCEFEA;   /* 액센트 배경 */
--accent-fg:   #FFFFFF;

--positive:    #00875F;   /* 수익 */
--negative:    #D7263D;   /* 손실 */
--warn:        #B26A00;   /* 주의 */
--info:        #155EEF;   /* 정보 */
```

### Dark

```css
--bg-base:     #0E1116;
--bg-surface:  #161B22;
--bg-muted:    #1F242C;

--fg-primary:  #E6E8EB;
--fg-secondary:#A1A8B3;
--fg-muted:    #6C737F;

--border:      #2A2F38;
--border-strong:#3A4150;

--accent:      #3BC4A8;
--accent-soft: #14302B;
--accent-fg:   #0E1116;

--positive:    #3DD68C;
--negative:    #FF6675;
--warn:        #FFB257;
--info:        #5B8DEF;
```

### 사용 룰

- 토스블루(#0064FF) 사용 금지 (그대로 차용)
- Tailwind 기본 팔레트(orange-500 등) 사용 금지
- 다크모드 네온 그라데이션 금지
- 수익/손실: positive/negative 토큰만 사용 (한국 관습: 빨간색=상승 가능하나 본 디자인은 글로벌 관습 따라 빨강=하락)

## 타이포

### 폰트

- **본문/한국어**: Pretendard Variable
- **영문/숫자**: Inter Variable
- **숫자만(테이블, 가격)**: Inter Tabular (`font-variant-numeric: tabular-nums`)
- 모노스페이스 전면 금지 (AI 슬롭)

### 스케일

| 토큰 | 크기 | 줄간격 | 용도 |
|------|------|--------|------|
| `display`  | 36/44 | 1.18 | 히어로 |
| `title-1`  | 28/36 | 1.25 | 페이지 제목 |
| `title-2`  | 22/30 | 1.30 | 섹션 |
| `title-3`  | 18/26 | 1.35 | 카드 제목 |
| `body-lg`  | 16/26 | 1.55 | 본문 강조 |
| `body`     | 14/22 | 1.55 | 본문 |
| `caption`  | 12/18 | 1.50 | 라벨/메타 |
| `mono-num` | 14/22 | tabular | 가격/수치 |

### 두께

- 본문: 400 / 강조: 500 / 제목: 600 / 히어로: 700
- 한국어는 600 이상 가독성 검증 필수

## 간격

8px 베이스. 1.5x 비율 (디테일은 4px 허용).

```
--space-1: 4px    --space-2: 8px
--space-3: 12px   --space-4: 16px
--space-5: 24px   --space-6: 32px
--space-7: 48px   --space-8: 64px
```

## 모서리

```
--radius-xs: 6px   /* 칩, 작은 버튼 */
--radius-sm: 8px   /* 인풋 */
--radius-md: 10px  /* 버튼, 카드 */
--radius-lg: 14px  /* 큰 카드, 모달 */
--radius-full: 9999px
```

## 그림자

라이트 모드만 사용. 다크는 borders로 대체.

```
--shadow-card:  0 1px 2px rgba(15,20,25,0.04), 0 1px 3px rgba(15,20,25,0.06)
--shadow-hover: 0 2px 4px rgba(15,20,25,0.06), 0 6px 18px rgba(15,20,25,0.08)
--shadow-modal: 0 12px 32px rgba(15,20,25,0.18)
```

## 컴포넌트 원칙

### 카드
- 보더 1px + 약한 그림자
- 사이드 컬러 띠 금지 (좌측 3px accent border 같은 거)
- 강조는 보더 색 전체 변경 또는 `--accent-soft` 배경

### 버튼
- Primary: `--accent` 배경, `--accent-fg`
- Secondary: 보더 + 본문색
- Ghost: 보더 없음, hover 시 `--bg-muted`
- Disabled: opacity 0.5, cursor not-allowed

### 인풋
- 라운드 8px
- focus 시 `--accent` 보더 + 약한 `--accent-soft` ring
- 에러 시 `--negative` 보더

### 차트
- 라인 두께 1.5~2px
- 그리드 라인은 `--border` (옅게)
- 수익 라인 `--positive`, 비교 벤치마크는 회색
- squiggly 데코 차트 금지 (실데이터만)

### Toast/Alert
- 상단 우측 슬라이드 인
- 종류별 색: info/positive/negative/warn

## 모션

- Default duration: 180ms
- Easing: `cubic-bezier(0.2, 0, 0.1, 1)` (커스텀)
- Hover transitions: opacity/transform만, 색은 즉시
- Page transition 금지 (어지러움)

## 다크모드 전환

- 우상단 토글
- localStorage 저장
- `prefers-color-scheme` 초기값
- 토글 시 즉시 적용 (transition 없음)

## 한국어 톤

- 단정형 + 짧게 ("확인 가능"이 아니라 "확인할 수 있습니다")
- 숫자는 항상 천단위 콤마 + 단위 명시
- 손익은 +/- + 색
- 모호 단어 X ("스마트", "AI 기반", "혁신적")
- 학습 코너는 더 따뜻한 톤 OK

## 아이콘

- Lucide Icons (Tailwind 호환, 가벼움)
- 24px 기본
- stroke-width 1.5

## 페이지 구성 (디폴트 시안)

### 메인 (대시보드)
```
[헤더: 로고  대시보드  포트폴리오  Q&A  학습 | 다크토글 프로필]
[히어로 카드: 오늘의 시장 브리핑 한 문장 + 키 인사이트 3]
[그리드: 포트폴리오 요약(좌2/3) | TOP 키워드(우1/3)]
[차트: 누적 수익 + 벤치마크]
[하단: 추천 뉴스 + 학습 카드]
```

### 챗 (Q&A)
```
[좌: 대화 리스트 + 새 채팅]
[우: 본문 + 입력창. 시장 컨텍스트 자동 주입]
```

### 포트폴리오
```
[요약 표 + 원형차트 4종]
[종목별 상세 카드: 차트 + 매수평단가 + 뉴스 + 인사이트]
```

### 학습
```
[키워드 카드 그리드: 인플레이션, PER, 반도체 등]
[개념 → 시장사례 → 투자자 대응 3단 답변]
```

## 절대 금지 (AI 슬롭 클리셰)

- 다크 + 네온 그라데이션 (오렌지/퍼플/시안)
- Tailwind 기본 팔레트 그대로 (orange-500 등)
- 전면 모노스페이스
- 언더스코어 prefix 섹션명 (`_METRICS`, `_PROJECT`)
- 의미 없는 squiggly 차트 데코
- 가짜 메트릭 (1.2K USERS, 99.9% UPTIME)
- 가짜 버전 번호 (v1.0.0) 푸터
- "BUILT WITH X, CODED WITH Y" 푸터
- 좌측 3px accent border (사이드 컬러 띠)
- 모듈/카드/리스트 어디에도 사이드 컬러 띠 금지
- "Transform Your X with AI" 류 vague 카피
- 자기참조 카피 ("AI가 설계한 디자인입니다")
- 동사 3개 나열 (GENERATE / OPTIMIZE / EVOLVE)
- 와이어프레임/그리드 큐브 히어로

## 참고했지만 차용하지 않는 것

| 참고 | 어떻게 |
|------|--------|
| 토스 | 친근감/한국어 톤, but 블루는 비사용 |
| 카카오뱅크 | 둥근 모서리 정도, 옐로우는 비사용 |
| Coinbase | 흰 베이스 + 청록 액센트 아이디어 |
| Linear | 타이포 위계, but 모노스페이스 비사용 |
| 무신사 | 카드 깔끔한 정렬, but 모노톤 비사용 |
| Robinhood | 차분한 차트 스타일, but green-only 비사용 |
| Upbit | 데이터 밀도, but 빨강/파랑 강대비 비사용 |

## DESIGN.md 변경 절차

이 파일은 디자인 토큰의 source of truth. 변경 시:
1. 토큰 값 변경 → `web/src/styles/tokens.css` 자동 갱신
2. PR에 시각 비교 스크린샷 첨부
3. 큰 변경(컬러 시스템, 타이포 스케일)은 ADR
