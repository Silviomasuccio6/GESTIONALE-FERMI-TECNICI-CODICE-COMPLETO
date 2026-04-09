import { useEffect, useRef } from "react";

function useCountUp(target: number, duration = 2000, startDelay = 500) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const start = performance.now();
      const frame = (time: number) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        if (ref.current) {
          ref.current.textContent = Math.floor(target * eased).toLocaleString("it-IT");
        }
        if (progress < 1) {
          requestAnimationFrame(frame);
        }
      };
      requestAnimationFrame(frame);
    }, startDelay);

    return () => window.clearTimeout(timeout);
  }, [duration, startDelay, target]);

  return ref;
}

export const LoginStats = () => {
  const mrrRef = useCountUp(84200);
  const usersRef = useCountUp(2847);

  return (
    <aside className="premium-login-side premium-login-side--right">
      <article className="premium-login-stat-card premium-login-stat-card--violet" data-cursor="hover">
        <p className="premium-login-stat-label">MRR QUESTO MESE</p>
        <p className="premium-login-stat-value">
          €<span ref={mrrRef}>0</span>
        </p>
        <p className="premium-login-stat-delta">↑ +18.4% vs mese scorso</p>
      </article>

      <article className="premium-login-stat-card premium-login-stat-card--cyan" data-cursor="hover">
        <p className="premium-login-stat-label">UTENTI ATTIVI</p>
        <p className="premium-login-stat-value">
          <span ref={usersRef}>0</span>
        </p>
        <p className="premium-login-stat-delta">↑ +6.2% questa settimana</p>
      </article>

      <article className="premium-login-stat-card premium-login-stat-card--emerald" data-cursor="hover">
        <p className="premium-login-stat-label">UPTIME</p>
        <p className="premium-login-stat-value">99.9%</p>
        <p className="premium-login-stat-delta">↑ 42 giorni consecutivi</p>
      </article>

      <article className="premium-login-feature-callout" data-cursor="hover">
        <p className="premium-login-stat-label">NUOVO · FEATURE</p>
        <p className="premium-login-feature-title">AI Insights ora disponibile</p>
        <p className="premium-login-feature-subtitle">Analisi predittiva powered by GPT</p>
      </article>
    </aside>
  );
};
