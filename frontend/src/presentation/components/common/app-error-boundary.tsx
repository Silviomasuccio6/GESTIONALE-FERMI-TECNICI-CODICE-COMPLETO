import React from "react";

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Errore imprevisto in fase di rendering."
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage limitations and force reload anyway.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 p-4 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
        <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-indigo-200/70 bg-white/95 p-6 shadow-[0_30px_70px_-35px_rgba(79,70,229,0.55)] dark:border-indigo-500/35 dark:bg-slate-900/90">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">Ripristino applicazione</p>
          <h1 className="mt-2 text-2xl font-semibold">Si e verificato un errore</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Nessun dato e stato perso. Puoi ricaricare la pagina oppure ripulire la sessione locale se il problema dipende dalla cache del browser.
          </p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {this.state.message || "Errore non specificato"}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              onClick={this.handleReload}
            >
              Ricarica pagina
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={this.handleResetLocalData}
            >
              Reset dati locali e ricarica
            </button>
          </div>
        </div>
      </main>
    );
  }
}
