import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/context";
import { useDemoMode } from "../lib/demo";

/* Login gate for pages whose content should only be visible to signed-in users.
   When Supabase is configured (real-service build) and no user is signed in, the
   wrapped content is shown clearly for a short preview window and then smoothly
   blurred with a centered prompt inviting login/signup. In the demo build
   (configured=false), in demo mode (?demo=1 / 데모 보기), or when signed in,
   children render as-is so there is no regression. Tone matches the Portfolio
   page gate. */

/* Preview the content clearly for this long, then ease in the blur + overlay.
   Matches the Portfolio gate behaviour so Chat/Learn feel consistent. */
const GATE_DELAY_MS = 5000;

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
  const demoMode = useDemoMode();
  const gated = configured && !user && !demoMode;

  /* Show the content clearly first, then activate the blur + overlay so the
     transition reads as a gentle reveal rather than an instant lockout. */
  const [gateActive, setGateActive] = useState(false);
  useEffect(() => {
    if (!gated) {
      setGateActive(false);
      return;
    }
    const t = setTimeout(() => setGateActive(true), GATE_DELAY_MS);
    return () => clearTimeout(t);
  }, [gated]);

  if (!gated) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden={gateActive}
        style={{
          filter: gateActive ? "blur(7px)" : "none",
          opacity: gateActive ? 0.5 : 1,
          pointerEvents: gateActive ? "none" : "auto",
          userSelect: gateActive ? "none" : "auto",
          transition: "filter 0.6s ease, opacity 0.6s ease",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "90px 20px 20px",
          background: gateActive ? "rgba(0,0,0,0.45)" : "transparent",
          opacity: gateActive ? 1 : 0,
          pointerEvents: gateActive ? "auto" : "none",
          transition: "opacity 0.5s ease, background 0.5s ease",
        }}
      >
        <div
          style={{
            maxWidth: "540px",
            width: "100%",
            textAlign: "center",
            background: "var(--bg-elevated)",
            border: "1px solid var(--frost)",
            borderRadius: "18px",
            padding: "40px 36px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--red)",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            {label}
          </div>
          <h3 style={{ fontSize: "24px", margin: "0 0 12px", lineHeight: 1.35 }}>{title}</h3>
          <p
            style={{
              fontSize: "15px",
              color: "var(--fg-secondary)",
              lineHeight: 1.7,
              margin: "0 0 22px",
            }}
          >
            {description}
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              className="toggle-btn active"
              onClick={() => openAuth("login")}
              style={{ padding: "13px 30px", fontSize: "15px" }}
            >
              로그인
            </button>
            <button
              className="toggle-btn"
              onClick={() => openAuth("signup")}
              style={{ padding: "13px 30px", fontSize: "15px" }}
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
