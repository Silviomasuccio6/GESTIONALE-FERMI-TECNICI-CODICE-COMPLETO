import { CalendarShell } from "../../components/calendar/CalendarShell";
import { PageHeader } from "../../components/layout/page-header";

export const StoppagesCalendarPage = () => (
  <section className="space-y-3">
    <PageHeader
      eyebrow="Pianificazione"
      title="Calendario operativo"
      subtitle="Coordina fermi, attività e appuntamenti esterni in un'unica agenda condivisa."
    />
    <CalendarShell />
  </section>
);
