import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
};

export const PageHeader = ({ title, subtitle, actions, eyebrow }: PageHeaderProps) => (
  <header className="tenant-page-header mb-4 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
      <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[1.8rem]">{title}</h1>
      {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{subtitle}</p> : null}
    </div>
    {actions ? <div className="tenant-page-header__actions flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
);
