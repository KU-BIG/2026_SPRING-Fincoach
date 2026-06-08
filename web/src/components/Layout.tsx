import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-base text-fg-primary">
      <Header />
      <main className="mx-auto max-w-6xl px-8 py-10">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-border-strong">
        <div className="mx-auto max-w-6xl px-8 py-6">
          <p className="caption">정보 제공 · 투자 권유 아님</p>
          <p className="mt-2 text-sm text-fg-secondary">
            FinCoach는 학습 도구입니다. 특정 종목의 매수/매도를 추천하지 않으며, 모든 분석은 정보 제공 목적입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
