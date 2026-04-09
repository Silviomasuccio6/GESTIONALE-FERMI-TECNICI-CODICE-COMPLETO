import { useEffect, useRef } from "react";

export const useCountUp = (
  target: number,
  options: { duration?: number; delay?: number; decimals?: number } = {}
) => {
  const { duration = 1600, delay = 260, decimals = 0 } = options;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) return;

    const timeoutId = window.setTimeout(() => {
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const value = target * eased;

        if (ref.current) {
          ref.current.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("it-IT");
        }

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      };

      window.requestAnimationFrame(tick);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [decimals, delay, duration, target]);

  return ref;
};
