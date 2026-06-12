/* 포트폴리오 — 다음 단계에서 /site/portfolio.html 을 verbatim 이식 예정. 현재는 placeholder. */
export default function Portfolio() {
  return (
    <div className="page-pad">
      <div className="page-head">
        <h1>포트폴리오</h1>
        <div className="meta">
          <span className="crumb">COMING SOON</span>
        </div>
      </div>
      <div className="card elev">
        <p style={{ color: "var(--fg-secondary)", lineHeight: 1.7 }}>
          포트폴리오 화면은 다음 단계에서 이식됩니다.
        </p>
        <p style={{ color: "var(--fg-muted)", fontSize: "13px", marginTop: "12px" }}>
          본 서비스는 정보 제공 도구이며, 매수 또는 매도를 추천하지 않습니다.
        </p>
      </div>
    </div>
  );
}
