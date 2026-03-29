import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
