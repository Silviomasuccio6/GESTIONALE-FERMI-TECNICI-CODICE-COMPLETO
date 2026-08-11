import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../application/stores/auth-store";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { getApiBaseUrl } from "../../../infrastructure/api/api-base-url";
import { FleetumLogoLoader } from "../../../presentation/components/brand/fleetum-logo-loader";
import { prefetchPrimaryTenantRoutes } from "../../../presentation/routes/prefetch-routes";
import { getSafeReturnTo } from "../../../presentation/routes/safe-return-to";
import { AuthBackToWebsite } from "./AuthBackToWebsite";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const LoginCard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const apiBaseUrl = getApiBaseUrl();
  const googleAuthUrl = (import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined) ?? `${apiBaseUrl}/auth/google`;

  const returnTo = getSafeReturnTo(searchParams.get("next"));
  const welcome = searchParams.get("welcome");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [pwVisible, setPwVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (email.length === 0) return "";
    return isValidEmail(email) ? "" : "Inserisci un'email valida";
  }, [email]);

  const passwordError = useMemo(() => {
    if (password.length === 0) return "";
    return password.length >= 8 ? "" : "Minimo 8 caratteri";
  }, [password]);

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!isValidEmail(email) || password.length < 8) {
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const result = await authUseCases.login({ email, password });
      setSession(result.user, remember);
      prefetchPrimaryTenantRoutes();
      setSuccess(true);
      window.setTimeout(() => navigate(returnTo, { replace: true }), 450);
    } catch (error) {
      setFormError((error as Error).message || "Credenziali non valide");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const openGoogleAuth = () => {
    const target = new URL(googleAuthUrl, window.location.origin);
    target.searchParams.set("returnTo", returnTo);
    window.location.href = target.toString();
  };

  return (
    <section className="premium-login-card-wrap">
      <div className={`premium-login-card ${shake ? "animate-shake" : ""}`}>
        <AuthBackToWebsite />
        <div className="premium-login-card-head">
          <img className="premium-login-card-logo premium-login-card-logo--image" src="/brand/fleetum-symbol-color.svg" alt="Fleetum" />
          <h2>Bentornato</h2>
          <p>Accedi al tuo workspace</p>
        </div>


        <form onSubmit={onSubmit} className="premium-login-form" noValidate>
          <div className="premium-login-social-grid premium-login-social-grid--single">
            <button
              type="button"
              data-cursor="hover"
              className="premium-login-social-btn premium-login-social-btn--google"
              onClick={openGoogleAuth}
            >
              <img className="premium-login-social-icon" src="/brand/google-g.svg" alt="" aria-hidden="true" />
              <span>Continua con Google</span>
            </button>
          </div>

          <div className="premium-login-divider">o continua con email</div>

          {welcome === "trial" ? (
            <p className="premium-login-error premium-login-error--block" style={{ color: "#065f46", background: "rgba(209,250,229,0.8)", borderColor: "rgba(16,185,129,0.45)" }}>
              Accedi per completare la prova di 14 giorni tramite checkout Stripe con carta obbligatoria.
            </p>
          ) : null}

          {welcome === "billing" ? (
            <p className="premium-login-error premium-login-error--block" style={{ color: "#3730a3", background: "rgba(224,231,255,0.82)", borderColor: "rgba(99,102,241,0.35)" }}>
              Dopo l'accesso ti porto alla scelta piano: il gestionale si abilita solo dopo conferma Stripe.
            </p>
          ) : null}

          <label className="premium-login-field-label" htmlFor="premium-login-email">
            Indirizzo email
          </label>
          <div className={`premium-login-field ${emailError ? "is-error" : ""} ${email && !emailError ? "is-ok" : ""}`}>
            <span className="premium-login-field-icon-wrap"><Mail className="premium-login-field-icon" aria-hidden="true" /></span>
            <input
              id="premium-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@azienda.com"
              autoComplete="email"
            />
          </div>
          {emailError && <p className="premium-login-error">{emailError}</p>}

          <label className="premium-login-field-label" htmlFor="premium-login-password">
            Password
          </label>
          <div className={`premium-login-field ${passwordError ? "is-error" : ""} ${password && !passwordError ? "is-ok" : ""}`}>
            <span className="premium-login-field-icon-wrap"><LockKeyhole className="premium-login-field-icon" aria-hidden="true" /></span>
            <input
              id="premium-login-password"
              type={pwVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              data-cursor="hover"
              className="premium-login-eye"
              onClick={() => setPwVisible((current) => !current)}
            >
              {pwVisible ? <EyeOff className="premium-login-eye-icon" aria-hidden="true" /> : <Eye className="premium-login-eye-icon" aria-hidden="true" />}
            </button>
          </div>
          {passwordError && <p className="premium-login-error">{passwordError}</p>}

          <div className="premium-login-row">
            <label className="premium-login-check" htmlFor="premium-login-remember">
              <input
                id="premium-login-remember"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Ricordami</span>
            </label>
            <button
              type="button"
              className="premium-login-link"
              data-cursor="hover"
              onClick={() => navigate("/forgot-password")}
            >
              Password dimenticata?
            </button>
          </div>

          {formError && <p className="premium-login-error premium-login-error--block">{formError}</p>}

          <button
            type="submit"
            data-cursor="hover"
            className={`premium-login-submit ${success ? "is-success" : ""}`}
            disabled={loading}
          >
            <span className="premium-login-submit-shimmer" aria-hidden />
            {loading ? (
              <span className="premium-login-loading">
                <FleetumLogoLoader size="sm" variant="dark" decorative className="fleetum-loader--button" />
                Accesso in corso...
              </span>
            ) : success ? (
              "✓ Accesso effettuato"
            ) : (
              "Accedi"
            )}
          </button>


          <p className="premium-login-signup-text">
            Non hai un account?
            <button
              type="button"
              data-cursor="hover"
              className="premium-login-link"
              onClick={() => navigate("/signup")}
            >
              Crea account e scegli piano →
            </button>
          </p>
          <p className="premium-login-signup-text !mt-2 text-[11px] leading-5">
            Accedendo confermi di aver letto l'{" "}
            <Link className="premium-login-link" to="/privacy">
              informativa privacy
            </Link>
            .
          </p>
        </form>
      </div>
    </section>
  );
};
