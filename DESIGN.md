# FinCoach Design System

## 결 (방향)

**금융 매거진 결.** Bloomberg + FT + Stripe Press + 매일경제 톤 혼합. 한국 핀테크 어디도 이런 결 안 씀.

- 베이지/크림 베이스 + 짙은 burgundy 액센트 (회색+청록 generic 패턴 탈피)
- 세리프 헤드라인 + 산세리프 본문 (위계 살아있는 타이포)
- 카드 그리드 폐기 → 컬럼/섹션 베이스 (매거진 페이지 메타포)
- 학습 페이지 = 매거진 페이지 (큰 헤드 + 부제 + 본문 + 인용구)

## 원칙

- **금융 = 권위**: 베이지 + burgundy = 신문/매거진 결. AI 슬롭의 정반대
- **학습 = 매거진**: 정보 전달이 본질. 카드보다 컬럼이 자연스러움
- **한국어 우선**: Noto Serif Korean (한글 세리프 가독성 좋음) + Pretendard 본문
- **숫자 가독성**: Inter tabular-nums 유지 (가격/지표)

## 컬러

### Light (디폴트)

```css
--bg-base:      #F6F1E8;   /* 베이지/크림 — 종이 결 */
--bg-surface:   #FBF8F2;   /* 약간 밝은 시트 */
--bg-muted:     #ECE5D5;   /* 보조 영역 */

--fg-primary:   #1F1612;   /* 따뜻한 검정 — 잉크 결 */
--fg-secondary: #5A4F46;   /* 따뜻한 회색 */
--fg-muted:     #948578;   /* 라벨/캡션 */

--border:       #D9CFC0;
--border-strong:#B8AB97;

--accent:       #7A1F1F;   /* 깊은 burgundy — wine */
--accent-soft:  #F3E5E0;   /* 살구-베이지 */
--accent-fg:    #FBF8F2;

--positive:     #1F6F4D;   /* 깊은 녹색 */
--negative:     #A41E22;   /* 매일경제 빨강 톤 */
--warn:         #A87528;
--info:         #2E4D7B;   /* navy ink */
```

### Dark (espresso/잉크 결)

```css
--bg-base:      #171310;   /* espresso */
--bg-surface:   #211A15;
--bg-muted:     #2A2118;

--fg-primary:   #F0E8DA;   /* 따뜻한 흰 */
--fg-secondary: #B8AC9A;
--fg-muted:     #756A5E;

--border:       #3A2F25;
--border-strong:#54473B;

--accent:       #E8B4B4;   /* 밝은 burgundy/dust rose */
--accent-soft:  #2E1818;
--accent-fg:    #171310;

--positive:     #5BC48F;
--negative:     #E87878;
--warn:         #E0B266;
--info:         #7BA0D9;
```

### 사용 룰

- 토스블루(#0064FF) X
- Tailwind 기본 팔레트 X
- 다크모드 네온 X
- 사이드 컬러 띠 X
- 수익/손실: positive/negative 토큰만, 빨강=하락

## 타이포

### 폰트

- **헤드라인 (세리프)**: Noto Serif Korean (한+영 모두 자연 + 매거진 권위)
- **본문 (산세리프)**: Pretendard Variable
- **숫자**: Inter + `font-variant-numeric: tabular-nums`

### 스케일

| 토큰 | 크기 | 폰트 | 용도 |
|------|------|------|------|
| `display`   | 48/56 | Noto Serif KR 700 | 페이지 최상단 헤드라인 |
| `headline`  | 32/40 | Noto Serif KR 600 | 섹션 헤드 |
| `subhead`   | 22/30 | Noto Serif KR 500 | 카드 제목, 부제 |
| `lead`      | 18/30 | Pretendard 400 | 도입부 본문 |
| `body`      | 15/26 | Pretendard 400 | 본문 |
| `caption`   | 12/18 | Pretendard 500 uppercase tracking | 라벨/메타 |
| `num-lg`    | 32/40 | Inter 600 tabular | 큰 숫자 |
| `num`       | 14/22 | Inter 500 tabular | 표/지표 |

### 사용

- 페이지 첫 헤드라인은 세리프 display
- 섹션 헤드도 세리프 → 매거진 결의 핵심
- 본문/UI 라벨은 Pretendard (한국어 가독)
- 가격/지표는 Inter

## 간격 / 모서리

- 8px 베이스 (세로 리듬 24/32/48px 강조)
- 모서리: **2~4px만** (매거진은 angular). 큰 라운드 X
- 카드 그림자 거의 없음 (보더만)

## 컴포넌트

### 시트 (Card 대체)
- 보더만, 그림자 없음
- `bg-bg-surface` 또는 베이스 그대로
- 모서리 4px

### 컬럼
- 매거진 그리드 (12-col, 본문 6-8 컬럼, 사이드 3-4)
- 본문 컬럼 max 65ch (가독성)

### 버튼
- Primary: `--accent` 배경 (burgundy)
- Secondary: 보더만
- Ghost: 보더 없음, hover 시 `--bg-muted`
- 라운드 4px

### 인풋
- 보더 2px (얇음), 모서리 4px
- focus 시 `--accent` 보더

### 차트
- 라인 1.5px, 그리드 옅게
- 수익 `--positive`, 벤치마크 회색

## 모션

- 짧고 미세하게 (180ms, easing은 자연스럽게)
- 페이지 transition 금지

## 카피 톤 (코치 + 매거진 에디터 인격)

매거진 에디터처럼 짚어주는 톤.

좋은 예:
- ✅ "오늘 시장에서 눈여겨볼 것"
- ✅ "지금 내 포트폴리오의 무게중심"
- ✅ "이번 주 코치가 짚는 키워드"
- ✅ "포트폴리오 한눈에" (대시보드 헤드)

피할 것:
- ❌ "오늘의 X" (SaaS-templated)
- ❌ "AI 기반 …"
- ❌ "스마트 …"
- ❌ 자기참조 카피

## 페이지 구성

### Dashboard (매거진 1면)
```
[헤드라인 세리프 큰 글자: 오늘 시장 한 문장 요약]
[부제: 시장 날짜 + 데모 표시]
[가로 띠: 평가/손익/수익률/종목수 (큰 숫자)]
[2컬럼: 좌(보유 종목 표 — 깊이) | 우(시장 주목 키워드 — 랭킹)]
[2컬럼: 좌(오늘 시장 흐름 — 본문) | 우(코치 한마디 — 인용구 결)]
```

### Chat
```
[좌 사이드: 코치 안내 + 예시 질문]
[우 본문: 시트 안에 대화 (보더만, 그림자 X)]
```

### Portfolio
```
[헤드라인: 평가금액 큰 숫자 + 손익]
[표: 보유 종목 상세]
[종목별 시트: 차트 + 매수평단 + 코치 코멘트]
```

### Learn (매거진 페이지)
```
[좌 TOC: 카테고리/개념 목록]
[우 본문: 세리프 큰 헤드라인 + 부제 + 3단 구조 (개념/시장/코치) 본문]
```

## 절대 금지 (AI 슬롭 + 양산형 클리셰)

- 회색 + 청록/네온 한 점 액센트 (Linear/Vercel/Stripe SaaS 클론)
- 카드 그리드 3-col 패턴
- 좌측 사이드바 + 카드 메인 (Notion 클론)
- 다크 + 네온 그라데이션
- Tailwind 기본 팔레트 그대로
- 전면 모노스페이스
- 사이드 컬러 띠
- "오늘의 X" 헤더, generic SaaS 라벨
- 가짜 사이드바 항목 mock
- 가짜 메트릭/가짜 버전/BUILT WITH 푸터
- 동사 3개 나열, 자기참조 카피
- 큰 라운드 모서리 (16px+)
- 큰 그림자 (그림자 거의 없음이 목표)

## 참고했지만 차용하지 않는 것

| 참고 | 어떻게 |
|------|--------|
| **Bloomberg** | 정보 밀도 + 권위감. 다크 단말기 결은 비차용 |
| **FT** | 베이지 베이스 + 세리프 헤드. 핑크는 비사용 |
| **매일경제** | 빨강 강조 톤 (한국 신문 결). 정통 신문 레이아웃 비차용 |
| **Stripe Press** | 세리프 + 베이지 학습 톤. Stripe 보라 비사용 |
| **Substack/Medium** | 큰 본문 + 인용. 회색 베이스 비차용 |

## 변경 절차

1. 토큰 값 변경 → `web/src/styles/tokens.css` 동기화
2. 페이지 구조 변경 시 PR에 시각 스크린샷
3. 컬러/타이포 시스템급은 ADR
