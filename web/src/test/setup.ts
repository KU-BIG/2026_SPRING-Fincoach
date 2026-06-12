import "@testing-library/jest-dom/vitest";

/* jsdom 에는 matchMedia / IntersectionObserver 가 없다.
   /site/ 인터랙션(reveal·counter·타이핑 등)이 마운트 시 이 API 를 참조하므로
   테스트 환경에서만 no-op 스텁을 제공한다. 디자인/동작 출력에는 영향 없음. */
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  const w = window as unknown as { IntersectionObserver?: typeof IntersectionObserver };
  if (!w.IntersectionObserver) {
    class IO implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    w.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
  }
}
