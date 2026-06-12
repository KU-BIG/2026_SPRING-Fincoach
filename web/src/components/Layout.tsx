import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useSiteInteractions } from "../hooks/useSiteInteractions";

/* /site/ 의 body 골격을 그대로 이식:
   scroll-progress 바 → header → main(Outlet) → footer.
   main 은 site.css 의 max-width:1180px + margin auto + padding 규칙을 받는다
   (hero full-bleed 의 calc((100vw - 100%)/-2) 가 main 을 기준으로 동작).
   /site/ 에서 index.html 은 <main>, portfolio/chat/learn 은 <main class="page-pad"> 이므로
   동일하게 해당 라우트에서 page-pad 를 main 에 붙인다(page-pad 가 main 의 좌우 padding 을
   덮어 좌우 0 + max-width 1180 으로 정렬 — 정적 페이지와 픽셀 동일). */
const PAGE_PAD_ROUTES = new Set(["/portfolio", "/chat", "/learn"]);

export default function Layout() {
  const { pathname } = useLocation();
  useSiteInteractions([pathname]);
  const mainClass = PAGE_PAD_ROUTES.has(pathname) ? "page-pad" : undefined;

  return (
    <>
      <div className="scroll-progress">
        <div className="bar"></div>
      </div>
      <Header />
      <main className={mainClass}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
