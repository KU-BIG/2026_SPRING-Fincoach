import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-base text-fg-primary">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-fg-muted lg:px-10">
          FinCoach는 정보 제공 도구입니다. 매수/매도를 추천하지 않습니다.
        </div>
      </footer>
    </div>
  );
}
