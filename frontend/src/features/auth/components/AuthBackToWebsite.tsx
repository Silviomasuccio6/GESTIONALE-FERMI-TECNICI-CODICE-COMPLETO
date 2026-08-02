import { ArrowLeft } from "lucide-react";

export const AuthBackToWebsite = () => (
  <a
    className="premium-login-back-link"
    href="/"
    data-cursor="hover"
    aria-label="Torna al sito Fleetum"
  >
    <ArrowLeft aria-hidden="true" strokeWidth={2} />
    <span>Torna al sito</span>
  </a>
);
