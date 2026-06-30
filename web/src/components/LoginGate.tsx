import type { ReactNode } from "react";
import { useAuth } from "../auth/context";

/* Login gate for pages whose content should only be visible to signed-in users.
   When Supabase is configured (real-service build) and no user is signed in, the
   wrapped content is blurred/disabled and a centered prompt invites login/signup.
   In the demo build (configured=false) or when signed in, children render as-is so
   there is no regression. Tone matches the Portfolio page gate. */
export default function LoginGate({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { configured, user, openAuth } = useAuth();
  const gated = configured && !user;

  if (!gated) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden
        style={{
          filter: "blur(7px)",
          opacity: 0.5,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
            background: "var(--bg-elevated)",
            border: "1px solid var(--frost)",
            borderRadius: "16px",
            padding: "30px 26px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--red)",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            {label}
          </div>
          <h3 style={{ fontSize: "19px", margin: "0 0 10px", lineHeight: 1.4 }}>{title}</h3>
          <p
            style={{
              fontSize: "13px",
              color: "var(--fg-muted)",
              lineHeight: 1.7,
              margin: "0 0 18px",
            }}
          >
            {description}
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              className="toggle-btn active"
              onClick={() => openAuth("login")}
              style={{ padding: "11px 22px", fontSize: "14px" }}
            >
              로그인
            </button>
            <button
              className="toggle-btn"
              onClick={() => openAuth("signup")}
              style={{ padding: "11px 22px", fontSize: "14px" }}
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
