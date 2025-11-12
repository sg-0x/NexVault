// src/Components/SmoothScroll.jsx
import React, { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

const SmoothScroll = () => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // guard: don't double-init
    if (lenisRef.current) return;

    // Ensure DOM exists
    if (typeof document === "undefined") return;

    // Create Lenis instance
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: true,
      // optional: change lerp for feel
      lerp: 0.08,
    });

    lenisRef.current = lenis;

    // Expose for debugging in console: window.lenis
    // (you can remove this in production)
    try {
      window.lenis = lenis;
    } catch (e) {}

    // RAF loop
    function raf(time) {
      if (!lenisRef.current) return;
      lenisRef.current.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    // Refresh on resize/orientation change
    const onResize = () => {
      try {
        lenisRef.current?.update(); // newer Lenis API may use update/resize/refresh
      } catch (e) {
        // no-op
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Helpful debug info
    console.info("[Lenis] initialized", { lenis });

    return () => {
      // cleanup
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      try {
        delete window.lenis;
      } catch (e) {}
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return null;
};

export default SmoothScroll;
