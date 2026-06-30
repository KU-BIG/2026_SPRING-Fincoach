import { Link } from "react-router-dom";

const DISCLAIMER =
  "FinCoach는 정보 제공 도구이며, 특정 종목의 매수 또는 매도를 추천하지 않습니다. " +
  "모든 데이터는 참고용이며 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.";

/* /site/index.html <footer> 마크업을 이식.
   SERVICE 내부 링크는 React Router, DATA 링크는 실제 출처 외부 링크,
   LEGAL 의 "면책 조항"은 클릭 시 면책 문구를 표시한다. */
export default function Footer() {
  return (
    <footer>
      <div className="foot-row">
        <div className="foot-col">
          <Link to="/" className="brand" style={{ marginBottom: "12px" }} aria-label="FinCoach">
            <img
              src="/logo.png"
              alt="FinCoach"
              style={{ height: "26px", width: "auto", display: "block" }}
            />
          </Link>
          <p>
            한국 주식과 미국 주식을 한 화면에. 정보 제공 도구이며, 매수와 매도는 추천하지 않습니다.
          </p>
        </div>
        <div className="foot-col">
          <h6>SERVICE</h6>
          <Link to="/">홈</Link>
          <Link to="/portfolio">포트폴리오</Link>
          <Link to="/chat">AI 코치</Link>
          <Link to="/learn">금융 용어</Link>
        </div>
        <div className="foot-col">
          <h6>DATA</h6>
          <a href="https://www.krx.co.kr" target="_blank" rel="noopener noreferrer">
            KRX 한국 주식
          </a>
          <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer">
            yfinance 미국 주식
          </a>
          <a href="https://finance.yahoo.com/news/" target="_blank" rel="noopener noreferrer">
            RSS 뉴스
          </a>
        </div>
        <div className="foot-col">
          <h6>LEGAL</h6>
          <button
            type="button"
            className="foot-link-btn"
            onClick={() => window.alert(DISCLAIMER)}
          >
            면책 조항
          </button>
          <span className="foot-link-muted" aria-disabled="true">
            서비스 약관 (준비 중)
          </span>
          <span className="foot-link-muted" aria-disabled="true">
            개인정보 처리방침 (준비 중)
          </span>
        </div>
      </div>
      <div className="foot-bottom">
        <span>본 서비스는 정보 제공 도구이며, 매수 또는 매도를 추천하지 않습니다.</span>
        <span>© 2026 FinCoach · KUBIG conf3</span>
      </div>
    </footer>
  );
}
