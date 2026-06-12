import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useSiteInteractions } from "../hooks/useSiteInteractions";

/* /site/ 의 body 골격을 그대로 이식:
   scroll-progress 바 → header → main(Outlet) → footer.
   main 은 site.css 의 max-width:1180px + margin auto + padding 규칙을 받는다
   (hero full-bleed 의 calc((100vw - 100%)/-2) 가 main 을 기준으로 동작). */
export default function Layout() {
  const { pathname } = useLocation();
  useSiteInteractions([pathname]);

  return (
    <>
      <div className="scroll-progress">
        <div className="bar"></div>
      </div>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
