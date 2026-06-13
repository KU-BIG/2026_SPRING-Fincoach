import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/context";

/* /site/index.html <header> 마크업을 그대로 이식.
   nav 링크는 React Router 로(/, /portfolio, /chat, /learn).
   .scrolled 토글은 useSiteInteractions 가 처리한다.
   nav-right: 인증이 구성된 실서비스 빌드에서만 실제 로그인/가입/로그아웃으로 동작.
   데모 빌드(Supabase env 없음)는 기존 placeholder 그대로 유지. */
export default function Header() {
  const { configured, user, openAuth, signOut } = useAuth();
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
          {!configured ? (
            <>
              <button className="nav-ghost">로그인</button>
              <NavLink to="/portfolio" className="nav-cta">
                시작하기
              </NavLink>
            </>
          ) : user ? (
            <>
              <span className="nav-user" title={user.email ?? undefined}>
                <span className="avatar">{(user.email ?? "?").charAt(0).toUpperCase()}</span>
                {user.email}
              </span>
              <button className="nav-ghost" onClick={() => signOut()}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="nav-ghost" onClick={() => openAuth("login")}>
                로그인
              </button>
              <button className="nav-cta" onClick={() => openAuth("signup")}>
                시작하기
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
