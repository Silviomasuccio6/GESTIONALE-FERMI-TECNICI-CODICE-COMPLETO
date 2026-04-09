import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="saas-hero-header mb-3 flex flex-col gap-2.5 rounded-2xl px-4 py-3.5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);
