import { useEffect, useRef, useState } from "react";
import { useAuth, type AuthMode } from "./context";

/* 로그인 / 가입 모달. 디자인 토큰(site.css)에 맞춘 다크 카드.
   이메일+비번 시작, 가입 시 이메일 확인이 켜져 있으면 안내 메시지를 보여준다. */
export default function AuthModal({ initialMode }: { initialMode: AuthMode }) {
  const { signIn, signUp, closeAuth } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // ESC 로 닫기 + Tab 포커스 트랩(모달 밖으로 못 나가게)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuth();
        return;
      }
      if (e.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const focusable = card.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !card.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAuth]);

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setBusy(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      setBusy(false);
      if (error) {
        setError("로그인에 실패했어요. 이메일과 비밀번호를 확인해주세요.");
        return;
      }
      closeAuth();
    } else {
      const { error, needsConfirm } = await signUp(email.trim(), password);
      setBusy(false);
      if (error) {
        setError(error.includes("registered") ? "이미 가입된 이메일이에요." : "가입에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      if (needsConfirm) {
        setNotice("확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.");
      } else {
        closeAuth();
      }
    }
  };

  return (
    <div className="auth-overlay" onClick={closeAuth}>
      <div
        ref={cardRef}
        className="auth-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="auth-close" onClick={closeAuth} aria-label="닫기">
          ×
        </button>

        <div className="auth-brand">
          <img
            src="/logo.png"
            alt="FinCoach"
            style={{ height: "28px", width: "auto", display: "block" }}
          />
        </div>
        <h2 id="auth-title" className="auth-title">
          {mode === "login" ? "다시 오셨네요" : "지금 시작하기"}
        </h2>
        <p className="auth-sub">
          {mode === "login"
            ? "내 포트폴리오와 코치 대화를 이어서 봐요."
            : "내 종목을 저장하고 코치에게 맞춤 설명을 받아요."}
        </p>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>이메일</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </label>
          <label className="auth-field">
            <span>비밀번호</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "6자 이상" : "비밀번호"}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {notice && <div className="auth-notice">{notice}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              아직 계정이 없으세요?{" "}
              <button onClick={() => switchMode("signup")}>가입하기</button>
            </>
          ) : (
            <>
              이미 계정이 있으세요?{" "}
              <button onClick={() => switchMode("login")}>로그인</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
