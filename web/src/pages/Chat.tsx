/* AI 코치 — 다음 단계에서 /site/chat.html 을 verbatim 이식 예정. 현재는 placeholder. */
export default function Chat() {
  return (
    <div className="page-pad">
      <div className="page-head">
        <h1>AI 코치</h1>
        <div className="meta">
          <span className="crumb">COMING SOON</span>
        </div>
      </div>
      <div className="card elev">
        <p style={{ color: "var(--fg-secondary)", lineHeight: 1.7 }}>
          AI 코치 화면은 다음 단계에서 이식됩니다.
        </p>
        <p style={{ color: "var(--fg-muted)", fontSize: "13px", marginTop: "12px" }}>
          본 응답은 정보 제공 목적이며, 투자 권유에 해당하지 않습니다.
        </p>
      </div>
    </div>
  );
}
