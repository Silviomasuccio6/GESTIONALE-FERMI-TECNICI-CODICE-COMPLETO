import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMouseParallax } from "../../../features/auth/hooks/useMouseParallax";
import { ParticleCanvas } from "../../../features/auth/components/ParticleCanvas";
import { MagneticOrbs } from "../../../features/auth/components/MagneticOrbs";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import "../../../features/auth/premium-login.css";

const TRUST_ITEMS = [
  "Provisioning tenant automatico in pochi secondi",
  "Credenziali admin protette con policy JWT",
  "Ambiente pronto per onboarding team e sedi"
];

const STATS = [
  { label: "Tenant creati", value: "4.8K+", delta: "ultimi 12 mesi" },
  { label: "Setup medio", value: "< 60s", delta: "dalla registrazione" },
  { label: "Soddisfazione", value: "98%", delta: "clienti attivi" }
];

const FLOATING_PARTICLES = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  left: `${Math.round((index * 7.13) % 100)}%`,
  delay: `${(index % 7) * 0.6}s`,
  duration: `${6 + (index % 5) * 1.2}s`
}));



const GoogleLogo = () => (
  <svg className="premium-login-social-icon" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.5 2.3-2.4 3.9-5.5 3.9a6 6 0 0 1 0-12c1.7 0 3.2.6 4.3 1.6l2.9-2.8A10 10 0 0 0 12 2a10 10 0 0 0 0 20c5.7 0 9.5-4 9.5-9.7 0-.7-.1-1.4-.2-2.1H12z"
    />
    <path
      fill="#4285F4"
      d="M21.5 12.3c0-.7-.1-1.4-.2-2.1H12v3.9h5.5c-.2 1-.8 1.9-1.6 2.5l2.6 2c1.6-1.5 3-3.8 3-6.3z"
    />
    <path
      fill="#FBBC05"
      d="M6.9 14.2A6 6 0 0 1 6.9 9.8L3.8 7.4a10 10 0 0 0 0 9.2l3.1-2.4z"
    />
    <path
      fill="#34A853"
      d="M12 22a10 10 0 0 0 6.8-2.5l-2.6-2c-.8.6-1.9 1-4.2 1a6 6 0 0 1-5.7-4.3l-3.1 2.4A10 10 0 0 0 12 22z"
    />
  </svg>
);

const AppleLogo = () => (
  <svg className="premium-login-social-icon" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M16.37 12.6c.03 3.12 2.74 4.16 2.77 4.18-.02.08-.43 1.5-1.42 2.97-.86 1.26-1.75 2.5-3.16 2.53-1.38.03-1.82-.82-3.4-.82-1.58 0-2.07.8-3.37.85-1.36.05-2.4-1.36-3.27-2.61-1.77-2.56-3.12-7.23-1.31-10.37.9-1.56 2.52-2.55 4.28-2.58 1.33-.03 2.58.9 3.4.9.82 0 2.37-1.11 3.98-.95.67.03 2.54.27 3.75 2.03-.1.06-2.24 1.31-2.25 3.87Zm-2.1-8.76c.72-.87 1.2-2.08 1.06-3.28-1.04.04-2.3.69-3.05 1.56-.67.77-1.26 2.01-1.1 3.2 1.16.09 2.36-.59 3.08-1.48Z"
    />
  </svg>
);

const initialForm = {
  tenantName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: ""
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const { nx, ny } = useMouseParallax();

  const [form, setForm] = useState(initialForm);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000/api";
  const googleAuthUrl = (import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined) ?? `${apiBaseUrl}/auth/google`;
  const appleAuthUrl = (import.meta.env.VITE_APPLE_AUTH_URL as string | undefined) ?? `${apiBaseUrl}/auth/apple`;

  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");

    return () => {
      if (previousTheme) {
        document.documentElement.setAttribute("data-theme", previousTheme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };
  }, []);

  const backgroundTransform = useMemo(
    () => ({
      transform: `translate(${nx * 24}px, ${ny * 18}px)`
    }),
    [nx, ny]
  );

  const openSocialAuth = (provider: "google" | "apple") => {
    const providerUrl = provider === "google" ? googleAuthUrl : appleAuthUrl;
    const target = new URL(providerUrl, window.location.origin);
    target.searchParams.set("intent", "signup");
    window.location.href = target.toString();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTenantId(null);
    setLoading(true);

    try {
      const result = await authUseCases.signup({
        tenantName: form.tenantName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password
      });
      setTenantId(result.tenantId);
      setForm(initialForm);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-login-root">
      <div className="premium-login-bg-gradient" style={backgroundTransform} aria-hidden />

      <ParticleCanvas />
      <MagneticOrbs />

      <div className="premium-login-grid-overlay" aria-hidden />
      <div className="premium-login-noise-overlay" aria-hidden />

      <div className="premium-login-floating-layer" aria-hidden>
        {FLOATING_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="premium-login-floating-dot"
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>

      <main className="premium-login-grid">
        <aside className="premium-login-side premium-login-side--left">
          <div className="premium-login-logo-row">
            <span className="premium-login-logo-icon">◈</span>
            <span className="premium-login-logo-text">
              Fleet Ops<span> Suite</span>
            </span>
          </div>

          <div className="premium-login-hero-copy">
            <p className="premium-login-pill">
              <span className="premium-login-pill-dot" />
              Fast Tenant Onboarding
            </p>
            <h1 className="premium-login-hero-title">
              Crea il tuo ambiente<br />
              <span>e parti in meno di un minuto.</span>
            </h1>
            <p className="premium-login-hero-subtitle">
              Configura tenant, admin iniziale e workspace operativo con setup guidato e pronto per la produzione.
            </p>

            <div className="premium-login-chip-list">
              <span className="premium-login-chip"><span style={{ background: "#34d399" }} />Setup rapido</span>
              <span className="premium-login-chip"><span style={{ background: "#818cf8" }} />JWT secure</span>
              <span className="premium-login-chip"><span style={{ background: "#22d3ee" }} />Ready to scale</span>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-slate-600">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CircleCheck className="h-4 w-4 text-indigo-600" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <section className="premium-login-card-wrap">
          <div className="premium-login-card">
            <div className="premium-login-card-head">
              <div className="premium-login-card-logo">◈</div>
              <h2>Crea account</h2>
              <p>Avvia il tuo ambiente con credenziali admin iniziali</p>
            </div>

            <form onSubmit={onSubmit} className="premium-login-form" noValidate>
              <div className="premium-login-social-grid">
                <button
                  type="button"
                  data-cursor="hover"
                  className="premium-login-social-btn"
                  onClick={() => openSocialAuth("google")}
                >
                  <GoogleLogo />
                  <span>Sign in with Google</span>
                </button>
                <button
                  type="button"
                  data-cursor="hover"
                  className="premium-login-social-btn"
                  onClick={() => openSocialAuth("apple")}
                >
                  <AppleLogo />
                  <span>Sign in with Apple</span>
                </button>
              </div>

              <div className="premium-login-divider">o continua con registrazione</div>

              <label className="premium-login-field-label" htmlFor="signup-tenantName">Nome azienda</label>
              <div className={`premium-login-field ${form.tenantName ? "is-ok" : ""}`}>
                <span>🏢</span>
                <input
                  id="signup-tenantName"
                  name="tenantName"
                  value={form.tenantName}
                  onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))}
                  placeholder="Es. Fleet Ops Italia"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="premium-login-field-label" htmlFor="signup-firstName">Nome</label>
                  <div className={`premium-login-field ${form.firstName ? "is-ok" : ""}`}>
                    <span>👤</span>
                    <input
                      id="signup-firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                      placeholder="Nome"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="premium-login-field-label" htmlFor="signup-lastName">Cognome</label>
                  <div className={`premium-login-field ${form.lastName ? "is-ok" : ""}`}>
                    <span>👤</span>
                    <input
                      id="signup-lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      placeholder="Cognome"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="premium-login-field-label" htmlFor="signup-email">Email</label>
              <div className={`premium-login-field ${form.email.includes("@") ? "is-ok" : ""}`}>
                <span>✉</span>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@azienda.com"
                  autoComplete="email"
                  required
                />
              </div>

              <label className="premium-login-field-label" htmlFor="signup-password">Password</label>
              <div className={`premium-login-field ${form.password.length >= 8 ? "is-ok" : ""}`}>
                <span>🔒</span>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimo 8 caratteri"
                  autoComplete="new-password"
                  required
                />
              </div>

              {tenantId ? (
                <p className="premium-login-error premium-login-error--block" style={{ color: "#065f46", background: "rgba(209,250,229,0.8)", borderColor: "rgba(16,185,129,0.45)" }}>
                  Tenant creato con successo: {tenantId}
                </p>
              ) : null}

              {error ? <p className="premium-login-error premium-login-error--block">{error}</p> : null}

              <button type="submit" className="premium-login-submit" disabled={loading}>
                <span className="premium-login-submit-shimmer" aria-hidden />
                {loading ? (
                  <span className="premium-login-loading">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Creazione account...
                  </span>
                ) : (
                  "Crea account"
                )}
              </button>

              <p className="premium-login-signup-text">
                Hai già un account?
                <button type="button" className="premium-login-link" onClick={() => navigate("/login")}>Vai al login →</button>
              </p>
            </form>
          </div>
        </section>

        <aside className="premium-login-side premium-login-side--right">
          {STATS.map((stat, index) => (
            <article
              key={stat.label}
              className={`premium-login-stat-card ${
                index === 0
                  ? "premium-login-stat-card--violet"
                  : index === 1
                    ? "premium-login-stat-card--cyan"
                    : "premium-login-stat-card--emerald"
              }`}
            >
              <p className="premium-login-stat-label">{stat.label}</p>
              <p className="premium-login-stat-value">{stat.value}</p>
              <p className="premium-login-stat-delta">{stat.delta}</p>
            </article>
          ))}

          <article className="premium-login-feature-callout">
            <p className="premium-login-stat-label">NUOVO · FEATURE</p>
            <p className="premium-login-feature-title">
              <Sparkles className="mr-1 inline h-4 w-4" /> Onboarding assistito
            </p>
            <p className="premium-login-feature-subtitle">
              Setup iniziale guidato con policy di sicurezza preconfigurate.
            </p>
            <div className="premium-login-chip mt-2 w-fit">
              <ShieldCheck className="h-4 w-4" /> Ready in produzione
            </div>
          </article>
        </aside>
      </main>
    </div>
  );
};
