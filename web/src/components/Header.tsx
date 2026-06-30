import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/context";

/* 헤더. 데스크탑은 로고 + 가로 메뉴 + 우측 인증.
   모바일(<=640px)은 메뉴/인증을 햄버거 드롭다운으로 접는다 — 바에 이메일을 욱여넣지 않아
   글자 잘림이 없고, 모바일에서도 네비 이동이 된다.
   드롭다운은 header 의 backdrop-filter/mask 에 클리핑되지 않도록 header 바깥 sibling 으로 둔다. */
export default function Header() {
  const { configured, user, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
        홈
      </NavLink>
      <NavLink to="/portfolio" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
        포트폴리오
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
        AI 코치
      </NavLink>
      <NavLink to="/learn" className={({ isActive }) => (isActive ? "active" : undefined)} onClick={close}>
        금융 용어
      </NavLink>
    </>
  );

  const auth = !configured ? (
    <>
      <button className="nav-ghost">로그인</button>
      <NavLink to="/portfolio" className="nav-cta" onClick={close}>
        시작하기
      </NavLink>
    </>
  ) : user ? (
    <>
      <span className="nav-user" title={user.email ?? undefined}>
        <span className="avatar">{(user.email ?? "?").charAt(0).toUpperCase()}</span>
        <span className="nav-user-email">{user.email}</span>
      </span>
      <button className="nav-ghost" onClick={() => { signOut(); close(); }}>
        로그아웃
      </button>
    </>
  ) : (
    <>
      <button className="nav-ghost" onClick={() => { openAuth("login"); close(); }}>
        로그인
      </button>
      <button className="nav-cta" onClick={() => { openAuth("signup"); close(); }}>
        시작하기
      </button>
    </>
  );

  return (
    <>
      <header>
        <div className="nav-wrap">
          <div className="nav-left">
            <NavLink to="/" className="brand" aria-label="FinCoach" onClick={close}>
              <img src="/logo.png" alt="FinCoach" style={{ height: "36px", width: "auto", display: "block" }} />
            </NavLink>
            <nav className="menu">{links}</nav>
          </div>
          <div className="nav-right">{auth}</div>
          <button
            className="nav-burger"
            aria-label="메뉴"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? "x" : undefined}></span>
            <span className={open ? "x" : undefined}></span>
            <span className={open ? "x" : undefined}></span>
          </button>
        </div>
      </header>
      {open && (
        <>
          <div className="mobile-menu-backdrop" onClick={close} />
          <div className="mobile-menu" role="dialog" aria-modal="true">
            <nav className="mobile-nav">{links}</nav>
            <div className="mobile-auth">{auth}</div>
          </div>
        </>
      )}
    </>
  );
}
