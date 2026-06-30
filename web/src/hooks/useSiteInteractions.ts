/* /site/app.js 공통 인터랙션을 React 로 이식.
   - 헤더 sticky + 스크롤 progress
   - reveal IntersectionObserver (+ data-reveal-stagger 자식 stagger)
   - mini sparkline draw-in (동적 삽입된 SVG 까지 폴링/MutationObserver 로 보강)
   - 숫자 카운터
   - hero headline 재진입 + 주기적 word stagger 재실행
   동작/출력은 원본과 동일. 라우트가 바뀌면 다시 실행되도록 deps 로 재바인딩한다. */
import { useEffect } from "react";

export function useSiteInteractions(deps: ReadonlyArray<unknown> = []) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // 헤더 sticky + 스크롤 progress
    {
      const header = document.querySelector("header");
      const bar = document.querySelector<HTMLElement>(".scroll-progress .bar");
      if (header) {
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
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }
    }

    // fade-in (+ inline stagger via data-reveal-stagger on parent)
    {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            el.classList.add("in");
            const step = parseInt(el.dataset.revealStagger || "0", 10);
            if (step > 0 && !reduced) {
              el.querySelectorAll<HTMLElement>(".reveal-child").forEach((c, i) => {
                c.style.transitionDelay = i * step + "ms";
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => c.classList.add("in")),
                );
              });
            }
            io.unobserve(el);
          });
        },
        { rootMargin: "-6% 0px", threshold: 0.05 },
      );
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // mini sparkline draw-in
    {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        const observed = new WeakSet<Element>();
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              const svg = e.target as SVGSVGElement;
              const lines = svg.querySelectorAll<SVGPathElement>(".spark-line");
              lines.forEach((p, idx) => {
                try {
                  const L = p.getTotalLength();
                  if (!L) return;
                  // Commit the hidden (fully offset) state WITHOUT a transition first.
                  // The CSS rule `.in svg .spark-line { stroke-dashoffset: 0 }` reveals
                  // the line as soon as an ancestor .reveal gains .in (which happens on
                  // the first frame for above-the-fold charts). If we set the transition
                  // and the L offset in the same block, the jump 0 -> L itself animates
                  // and the follow-up -> 0 cancels it, so no visible draw-in (the home
                  // regression). Disabling the transition + forcing a reflow pins the
                  // hidden state, then we re-enable the transition and draw to 0.
                  p.style.transition = "none";
                  p.style.strokeDasharray = String(L);
                  p.style.strokeDashoffset = String(L);
                  // force reflow so offset=L is flushed before the transition is armed
                  void p.getBoundingClientRect();
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                      p.style.transition = `stroke-dashoffset 1100ms cubic-bezier(0.2,0,0.1,1) ${idx * 50}ms`;
                      p.style.strokeDashoffset = "0";
                    }),
                  );
                } catch {
                  /* path not yet rendered */
                }
              });
              io.unobserve(svg);
            });
          },
          { rootMargin: "-4% 0px", threshold: 0.2 },
        );
        const pickup = () => {
          document.querySelectorAll("svg.spark, svg[data-spark]").forEach((el) => {
            if (observed.has(el)) return;
            observed.add(el);
            io.observe(el);
          });
        };
        pickup();
        requestAnimationFrame(() => requestAnimationFrame(pickup));
        const t = window.setTimeout(pickup, 200);
        const mo = new MutationObserver(() => pickup());
        mo.observe(document.body, { childList: true, subtree: true });
        cleanups.push(() => {
          io.disconnect();
          mo.disconnect();
          window.clearTimeout(t);
        });
      }
    }

    // 숫자 카운터
    {
      const formatNum = (n: number) => Math.round(n).toLocaleString();
      const start = (el: HTMLElement) => {
        if (el.dataset.started) return;
        el.dataset.started = "1";
        const target = parseFloat(el.dataset.counter || "0");
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const t0 = performance.now();
        const dur = 1300;
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const tick = (now: number) => {
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
            if (e.isIntersecting) start(e.target as HTMLElement);
          });
        },
        { threshold: 0.3 },
      );
      document.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => cio.observe(el));
      cleanups.push(() => cio.disconnect());
    }

    // hero headline 재진입 + 매 16초 word stagger 재실행
    {
      const headline = document.querySelector<HTMLElement>(".hero-headline");
      if (headline) {
        const words = headline.querySelectorAll<HTMLElement>(".word");
        let inView = false;
        let timer: number | null = null;
        const replay = () => {
          words.forEach((w) => {
            w.style.animation = "none";
            void w.offsetWidth;
            w.style.animation = "";
          });
        };
        const loop = () => {
          if (timer) clearInterval(timer);
          if (!inView) return;
          timer = window.setInterval(() => {
            if (inView) replay();
          }, 16000);
        };
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              inView = e.isIntersecting;
              if (inView) {
                replay();
                loop();
              } else if (timer) {
                clearInterval(timer);
                timer = null;
              }
            });
          },
          { threshold: 0.4 },
        );
        io.observe(headline);
        cleanups.push(() => {
          io.disconnect();
          if (timer) clearInterval(timer);
        });
      }
    }

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
