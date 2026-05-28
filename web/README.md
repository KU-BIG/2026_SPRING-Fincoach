# FinCoach Web

Vite + React + TypeScript + Tailwind. 디자인 시스템 명세는 루트 [`DESIGN.md`](../DESIGN.md).

## 셋업

```bash
cd web
npm install
npm run dev
```

http://localhost:5173 접속.

## 빌드

```bash
npm run build
```

`dist/` 디렉토리 생성. Cloudflare Pages 배포 시 이 디렉토리 지정.

## 구조

```
web/
  src/
    main.tsx           진입점
    App.tsx            라우팅
    components/        Layout, Header, Card, ThemeToggle
    pages/             Dashboard, Chat, Portfolio, Learn
    lib/               api(mock), format, cn
    hooks/             useTheme
    styles/            tokens.css, globals.css
```

## API 연결

`src/lib/api.ts`는 mock 응답을 반환. 실 API 연결 시:
1. 환경변수 `VITE_API_BASE` 설정 (디폴트 `/api`)
2. Vite dev server는 `/api` → `localhost:8000` 프록시 (FastAPI)
3. 백엔드 미응답 시 mock fallback 작동

Cloudflare Pages 배포에서는 `_redirects`로 외부 API를 프록시하지 않는다. 운영 API는 Pages 환경변수 `VITE_API_BASE`에 실제 API origin을 넣고, 백엔드 CORS에서 Pages 도메인을 허용한다.

## 다크/라이트 모드

`localStorage`에 저장. `prefers-color-scheme` 초기값. 우상단 토글.

## 룰

- 디자인 토큰은 `src/styles/tokens.css` (DESIGN.md 변경 시 동기화)
- 컴포넌트 안에 색상 하드코딩 금지. Tailwind 토큰 클래스만 사용
- 매수/매도 직접 추천 표현 금지
