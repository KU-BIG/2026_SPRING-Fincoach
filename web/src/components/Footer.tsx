import { Link } from "react-router-dom";

/* /site/index.html <footer> 마크업을 그대로 이식.
   SERVICE 내부 링크는 React Router 로, DATA/LEGAL placeholder 링크는 원본대로 href="#". */
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
          <a href="#">KRX 한국 주식</a>
          <a href="#">yfinance 미국 주식</a>
          <a href="#">RSS 뉴스</a>
        </div>
        <div className="foot-col">
          <h6>LEGAL</h6>
          <a href="#">면책 조항</a>
          <a href="#">서비스 약관</a>
          <a href="#">개인정보 처리방침</a>
        </div>
      </div>
      <div className="foot-bottom">
        <span>본 서비스는 정보 제공 도구이며, 매수 또는 매도를 추천하지 않습니다.</span>
        <span>© 2026 FinCoach · KUBIG conf3</span>
      </div>
    </footer>
  );
}
