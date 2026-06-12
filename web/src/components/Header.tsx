import { NavLink } from "react-router-dom";

/* /site/index.html <header> 마크업을 그대로 이식.
   nav 링크는 React Router 로(/, /portfolio, /chat, /learn).
   .scrolled 토글은 useSiteInteractions 가 처리한다. */
export default function Header() {
  return (
    <header>
      <div className="nav-wrap">
        <div className="nav-left">
          <NavLink to="/" className="brand">
            <div className="logo"></div>FinCoach
          </NavLink>
          <nav className="menu">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
              홈
            </NavLink>
            <NavLink
              to="/portfolio"
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              포트폴리오
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : undefined)}>
              AI 코치
            </NavLink>
            <NavLink to="/learn" className={({ isActive }) => (isActive ? "active" : undefined)}>
              금융 용어
            </NavLink>
          </nav>
        </div>
        <div className="nav-right">
          <button className="nav-ghost">로그인</button>
          <NavLink to="/portfolio" className="nav-cta">
            시작하기
          </NavLink>
        </div>
      </div>
    </header>
  );
}
