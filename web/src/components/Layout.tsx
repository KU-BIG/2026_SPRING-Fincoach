import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-base text-fg-primary">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-fg-muted">
        FinCoach는 정보 제공 도구입니다. 특정 종목의 매수/매도를 추천하지 않습니다.
      </footer>
    </div>
  );
}
