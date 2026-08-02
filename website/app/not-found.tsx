import { SiteFooter, SiteHeader } from "../components/site-chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="not-found-page">
        <div>
          <span className="kicker">Errore 404</span>
          <h1>Questa pagina non è disponibile.</h1>
          <p>
            L’indirizzo potrebbe essere cambiato oppure la pagina non esiste.
          </p>
          {/* vinext uses native anchors for reliable local RSC navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-primary" href="/">
            Torna alla home
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
