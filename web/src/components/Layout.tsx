import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-base text-fg-primary">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8 lg:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-fg-muted">
          본 서비스는 정보 제공 도구이며, 매수 또는 매도를 추천하지 않습니다.
        </div>
      </footer>
    </div>
  );
}
