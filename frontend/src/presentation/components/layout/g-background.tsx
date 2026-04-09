import { useEffect, useMemo, useRef, useState } from "react";

const prefersReduced = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const GBackground = () => {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [reducedMotion, setReducedMotion] = useState(prefersReduced());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onMove = (event: MouseEvent) => {
      pointer.current.tx = event.clientX;
      pointer.current.ty = event.clientY;
      if (orbRef.current && !reducedMotion) {
        orbRef.current.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      const next = pointer.current;
      next.x += (next.tx - next.x - 150) * 0.07;
      next.y += (next.ty - next.y - 150) * 0.07;
      if (orbRef.current && !reducedMotion) {
        orbRef.current.style.left = `${next.x}px`;
        orbRef.current.style.top = `${next.y}px`;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      rafRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [reducedMotion]);

  const shapes = useMemo(
    () => [
      { className: "g-shape-ring", style: { width: "100px", height: "100px", top: "11%", right: "6%" } },
      { className: "g-shape-ring", style: { width: "58px", height: "58px", top: "58%", left: "2.4%", animationDelay: "2.8s" } },
      { className: "g-shape-sq", style: { width: "52px", height: "52px", top: "30%", right: "24%", animationDelay: "2.1s" } },
      {
        className: "g-shape-ring",
        style: { width: "72px", height: "72px", bottom: "19%", right: "11%", animationDelay: "4.2s", borderColor: "rgba(244,63,94,0.11)" }
      }
    ],
    []
  );

  return (
    <>
      <div aria-hidden className="g-blob g-blob-1" />
      <div aria-hidden className="g-blob g-blob-2" />
      <div aria-hidden className="g-blob g-blob-3" />
      <div aria-hidden className="g-blob g-blob-4" />
      <div aria-hidden className="g-dots" />

      {!reducedMotion
        ? shapes.map((shape, index) => <div key={`shape-${index}`} aria-hidden className={`g-shape ${shape.className}`} style={shape.style} />)
        : null}

      {!reducedMotion ? <div ref={orbRef} aria-hidden className="g-mouse-orb" /> : null}
    </>
  );
};
