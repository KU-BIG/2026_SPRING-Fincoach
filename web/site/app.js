/* eslint-disable no-undef */
// 공통 인터랙션 (브라우저에서 직접 실행)

// 헤더 sticky + 스크롤 progress
(function () {
  const header = document.querySelector("header");
  const bar = document.querySelector(".scroll-progress .bar");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
    if (bar) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// fade-in
(function () {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    },
    { rootMargin: "-8% 0px", threshold: 0.05 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();

// 숫자 카운터
(function () {
  const formatNum = (n) => Math.round(n).toLocaleString();
  const start = (el) => {
    if (el.dataset.started) return;
    el.dataset.started = "1";
    const target = parseFloat(el.dataset.counter);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const t0 = performance.now();
    const dur = 1300;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const v = target * ease(t);
      el.textContent = decimals > 0 ? v.toFixed(decimals) : formatNum(v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = decimals > 0 ? target.toFixed(decimals) : formatNum(target);
    };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) start(e.target);
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll("[data-counter]").forEach((el) => cio.observe(el));
})();

/* hero headline 재진입 + 매 7초 word stagger 재실행 */
(function () {
  const headline = document.querySelector(".hero-headline");
  if (!headline) return;
  const words = headline.querySelectorAll(".word");
  let inView = false;
  let timer = null;
  function replay() {
    words.forEach((w) => {
      w.style.animation = "none";
      void w.offsetWidth;
      w.style.animation = "";
    });
  }
  function loop() {
    if (timer) clearInterval(timer);
    if (!inView) return;
    timer = setInterval(() => { if (inView) replay(); }, 16000);
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        inView = e.isIntersecting;
        if (inView) { replay(); loop(); }
        else if (timer) { clearInterval(timer); timer = null; }
      });
    },
    { threshold: 0.4 }
  );
  io.observe(headline);
})();

// SVG path draw-in
window.drawPath = (id, dur = 1200) => {
  const p = document.getElementById(id);
  if (!p) return;
  const L = p.getTotalLength();
  p.style.strokeDasharray = L;
  p.style.strokeDashoffset = L;
  p.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(0.2,0,0.1,1)`;
  requestAnimationFrame(() => {
    p.style.strokeDashoffset = 0;
  });
};
window.drawOnView = (sel, ids, dur = 1200) => {
  const el = document.querySelector(sel);
  if (!el) return;
  const o = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          ids.forEach((i) => window.drawPath(i, dur));
          o.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  o.observe(el);
};
