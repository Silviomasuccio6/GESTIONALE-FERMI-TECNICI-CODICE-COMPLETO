import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Car,
  CircleDollarSign,
  CircleCheck,
  Clock3,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  MoreVertical,
  Wrench
} from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { rentalBookingsUseCases, type RentalBookingStatus } from "../../../application/usecases/rental-bookings-usecases";
import { statsUseCases } from "../../../application/usecases/stats-usecases";
import { FleetumBlockLoader } from "../../components/brand/fleetum-logo-loader";
import { Button } from "../../components/ui/button";
import { useAsync } from "../../hooks/use-async";

type DashboardBooking = {
  id: string;
  code: string;
  customerName: string;
  pickupAt: string;
  returnAt: string;
  status: RentalBookingStatus;
  contractStatus: string;
};

type DashboardVehicleRow = {
  id: string;
  isAvailable: boolean;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    siteName: string;
  };
  bookings: DashboardBooking[];
};

type PriorityItem = {
  id: string;
  title: string;
  description: string;
  tone: "danger" | "warning" | "info";
  route: string;
};

const timelineStartMinutes = 0;
const timelineEndMinutes = 24 * 60;
const timelineSpanMinutes = timelineEndMinutes - timelineStartMinutes;
const timelineHours = Array.from({ length: 7 }, (_, index) => index * 4);
const timelineGridHours = Array.from({ length: 13 }, (_, index) => index * 2);

const toLocalIsoDay = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value?: number | string | null) => {
  const parsed = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(parsed);
};

const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

const localDayStart = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);

const isSameLocalDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const relativeDateTimeLabel = (value: string, reference: Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "data non disponibile";
  if (isSameLocalDay(date, reference)) return `oggi ${timeLabel(value)}`;

  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameLocalDay(date, tomorrow)) return `domani ${timeLabel(value)}`;

  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const minutesInDay = (value: string) => {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const positionForMinutes = (minutes: number) =>
  ((clamp(minutes, timelineStartMinutes, timelineEndMinutes) - timelineStartMinutes) / timelineSpanMinutes) * 100;

const statusMeta = (status: RentalBookingStatus) => {
  if (status === "IN_RENT") return { label: "In corso", tone: "active" as const };
  if (["CONTRACT_SIGNED", "READY_FOR_HANDOVER"].includes(status)) {
    return { label: status === "READY_FOR_HANDOVER" ? "Consegna pronta" : "Firmato", tone: "ready" as const };
  }
  if (status === "CONFIRMED") return { label: "Confermato", tone: "confirmed" as const };
  if (["DRAFT", "QUOTED", "HOLD"].includes(status)) return { label: "Da confermare", tone: "pending" as const };
  return { label: status === "CLOSED" ? "Chiuso" : status.split("_").join(" "), tone: "neutral" as const };
};

const vehicleAvailabilityMeta = (row: DashboardVehicleRow, now: Date) => {
  const nowMs = now.getTime();
  const current = row.bookings.find((booking) => {
    const pickup = new Date(booking.pickupAt).getTime();
    const returned = new Date(booking.returnAt).getTime();
    return pickup <= nowMs && returned > nowMs;
  });

  if (current) {
    const status = statusMeta(current.status);
    return {
      label: `Rientro ${relativeDateTimeLabel(current.returnAt, now)}`,
      tone: status.tone,
      customer: `In noleggio · ${current.customerName}`,
      primaryBooking: current
    };
  }

  const next = row.bookings.find((booking) => new Date(booking.pickupAt).getTime() > nowMs);
  if (next) {
    return {
      label: `Libera fino ${relativeDateTimeLabel(next.pickupAt, now)}`,
      tone: "available" as const,
      customer: `Prossima consegna · ${next.customerName}`,
      primaryBooking: next
    };
  }

  return {
    label: row.bookings.length ? "Libera ora" : "Libera oggi",
    tone: "available" as const,
    customer: row.bookings.length ? "Movimenti conclusi" : "Nessuna prenotazione",
    primaryBooking: row.bookings.length ? row.bookings[row.bookings.length - 1] : null
  };
};

const priorityMeta = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("manutenzione") || normalized.includes("revisione")) {
    return { icon: Wrench, route: "/anagrafiche/manutenzioni", tone: "danger" as const };
  }
  if (normalized.includes("contratto") || normalized.includes("document")) {
    return { icon: FileText, route: normalized.includes("contratto") ? "/booking/contratti" : "/anagrafiche/scadenziario", tone: "warning" as const };
  }
  if (normalized.includes("rientro") || normalized.includes("ritardo")) {
    return { icon: Clock3, route: "/booking", tone: "danger" as const };
  }
  return { icon: AlertTriangle, route: "/booking", tone: "info" as const };
};

const timelineToneClasses = {
  active: "dashboard-timeline-bar--active",
  ready: "dashboard-timeline-bar--ready",
  confirmed: "dashboard-timeline-bar--confirmed",
  pending: "dashboard-timeline-bar--pending",
  neutral: "dashboard-timeline-bar--neutral"
} as const;

const availabilityToneClasses = {
  active: "dashboard-status-pill--active",
  ready: "dashboard-status-pill--ready",
  confirmed: "dashboard-status-pill--confirmed",
  pending: "dashboard-status-pill--pending",
  neutral: "dashboard-status-pill--neutral",
  available: "dashboard-status-pill--available"
} as const;

const priorityToneClasses = {
  danger: "dashboard-priority-item__icon--danger",
  warning: "dashboard-priority-item__icon--warning",
  info: "dashboard-priority-item__icon--info"
} as const;

const MetricCell = ({
  icon: Icon,
  value,
  label,
  detail,
  progress
}: {
  icon: typeof Car;
  value: string | number;
  label: string;
  detail?: string;
  progress?: number;
}) => (
  <div className="dashboard-command-metric">
    <span className="dashboard-command-metric__icon" aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
    {typeof progress === "number" ? (
      <div className="dashboard-command-metric__radial" aria-label={`${progress}% ${label}`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ value: clamp(progress, 0, 100), fill: "#16a34a" }]}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" background={{ fill: "#e8f0ea" }} cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <strong>{Math.round(progress)}%</strong>
      </div>
    ) : (
      <strong className="dashboard-command-metric__value">{value}</strong>
    )}
    <span className="dashboard-command-metric__copy">
      <b>{label}</b>
      {detail ? <small>{detail}</small> : null}
    </span>
  </div>
);

const TimelineBookingBar = ({
  booking,
  day,
  onOpen
}: {
  booking: DashboardBooking;
  day: Date;
  onOpen: () => void;
}) => {
  const pickupAt = new Date(booking.pickupAt);
  const returnAt = new Date(booking.returnAt);
  const dayStart = localDayStart(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (
    Number.isNaN(pickupAt.getTime()) ||
    Number.isNaN(returnAt.getTime()) ||
    pickupAt >= dayEnd ||
    returnAt <= dayStart
  ) {
    return null;
  }

  const continuesBefore = pickupAt < dayStart;
  const continuesAfter = returnAt > dayEnd;
  const endsAtDayBoundary = returnAt.getTime() === dayEnd.getTime();
  const start = continuesBefore ? timelineStartMinutes : minutesInDay(booking.pickupAt);
  const end = continuesAfter || endsAtDayBoundary ? timelineEndMinutes : minutesInDay(booking.returnAt);
  const left = positionForMinutes(start);
  const right = positionForMinutes(end);
  const width = Math.max(4, right - left);
  const status = statusMeta(booking.status);

  return (
    <button
      type="button"
      className={`dashboard-timeline-bar ${timelineToneClasses[status.tone]}`}
      style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
      onClick={onOpen}
      title={`${booking.customerName} · ${booking.code} · ${new Date(booking.pickupAt).toLocaleString("it-IT")} - ${new Date(booking.returnAt).toLocaleString("it-IT")}`}
    >
      <span className="dashboard-timeline-bar__edge">
        {continuesBefore ? <ChevronLeft className="h-3 w-3" aria-hidden="true" /> : null}
        {continuesBefore ? "In corso" : timeLabel(booking.pickupAt)}
      </span>
      <span className="dashboard-timeline-bar__end dashboard-timeline-bar__edge">
        {continuesAfter ? "Continua" : endsAtDayBoundary ? "24:00" : timeLabel(booking.returnAt)}
        {continuesAfter ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
      </span>
    </button>
  );
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const todayIso = useMemo(() => toLocalIsoDay(today), [today]);
  const stats = useAsync(() => statsUseCases.dashboard(), []);
  const availability = useAsync(
    () => rentalBookingsUseCases.dayAvailability({ date: todayIso }),
    [todayIso, availabilityRetry]
  );

  const booking = stats.data?.booking as any;
  const kpis = booking?.kpis ?? {};
  const economics = booking?.economicKpis ?? {};
  const lists = booking?.lists ?? {};

  const rows = useMemo<DashboardVehicleRow[]>(() => {
    const source = availability.data?.data ?? [];
    return source
      .map((row) => ({
        id: row.vehicle.id,
        isAvailable: row.isAvailable,
        vehicle: {
          plate: row.vehicle.plate,
          brand: row.vehicle.brand,
          model: row.vehicle.model,
          siteName: row.vehicle.site?.name ?? "-"
        },
        bookings: row.bookings
          .map((entry) => ({
            id: entry.id,
            code: entry.code,
            customerName: entry.customerName,
            pickupAt: entry.pickupAt,
            returnAt: entry.returnAt,
            status: entry.status,
            contractStatus: entry.contractStatus
          }))
          .sort((a, b) => new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime())
      }))
      .sort((a, b) => {
        const rank = (row: DashboardVehicleRow) => {
          const state = vehicleAvailabilityMeta(row, today);
          if (state.tone !== "available") return 0;
          if (row.bookings.some((booking) => new Date(booking.pickupAt).getTime() > today.getTime())) return 1;
          return 2;
        };
        return rank(a) - rank(b) || a.vehicle.plate.localeCompare(b.vehicle.plate, "it");
      })
      .slice(0, 10);
  }, [availability.data, today]);

  const priorities = useMemo<PriorityItem[]>(() => {
    const critical = Array.isArray(lists.criticalBookings) ? lists.criticalBookings : [];
    const dashboardAlerts = Array.isArray(stats.data?.feeds?.alerts) ? stats.data.feeds.alerts : [];
    const combined: PriorityItem[] = [];

    critical.forEach((item: any) => {
      const meta = priorityMeta(String(item.reason ?? "Criticità booking"));
      combined.push({
        id: `${item.bookingId ?? item.code ?? combined.length}-${item.type ?? "critical"}`,
        title: String(item.reason ?? "Criticità booking"),
        description: [item.vehicle, item.customer].filter(Boolean).join(" · "),
        tone: meta.tone,
        route: meta.route
      });
    });

    dashboardAlerts.forEach((item: any) => {
      const title = String(item.message ?? item.title ?? "Attenzione richiesta");
      const meta = priorityMeta(title);
      combined.push({
        id: String(item.id ?? `alert-${combined.length}`),
        title,
        description: [item.site, item.workshop].filter(Boolean).join(" · ") || "Apri il dettaglio per intervenire.",
        tone: item.severity === "HIGH" ? "danger" : meta.tone,
        route: meta.route
      });
    });

    return combined.filter((item, index, all) => all.findIndex((entry) => entry.title === item.title) === index).slice(0, 3);
  }, [lists.criticalBookings, stats.data?.feeds?.alerts]);

  const currentMinutes = today.getHours() * 60 + today.getMinutes();
  const showCurrentTime = currentMinutes >= timelineStartMinutes && currentMinutes <= timelineEndMinutes;
  const currentTimeLeft = positionForMinutes(currentMinutes);
  const finalRevenue = Number(economics.finalRevenueMonth ?? 0);
  const expectedRevenue = Number(economics.expectedRevenueMonth ?? 0);
  const displayedRevenue = finalRevenue > 0 ? finalRevenue : expectedRevenue;
  const revenueLabel = finalRevenue > 0 ? "fatturato MTD" : "previsto MTD";

  if (stats.loading) return <FleetumBlockLoader label="Caricamento centro operativo" />;
  if (stats.error) return <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{stats.error}</p>;
  if (!stats.data) return <FleetumBlockLoader label="Preparazione centro operativo" />;

  return (
    <section className="dashboard-command-room" aria-label="Dashboard operativa Fleetum">
      <div className="dashboard-command-strip" aria-label="Indicatori operativi di oggi">
        <MetricCell icon={Car} value={kpis.availableToday ?? 0} label="disponibili" detail={`su ${kpis.totalRentalVehicles ?? 0}`} />
        <MetricCell icon={ArrowUpRight} value={kpis.pickupsToday ?? 0} label="consegne" detail="oggi" />
        <MetricCell icon={ArrowDownLeft} value={kpis.returnsToday ?? 0} label="rientri" detail="oggi" />
        <MetricCell icon={CalendarDays} value="" label="occupazione" detail="flotta attiva" progress={Number(kpis.utilizationRateToday ?? 0)} />
        <MetricCell icon={CircleDollarSign} value={formatCurrency(displayedRevenue)} label={revenueLabel} detail="mese corrente" />
      </div>

      <div className="dashboard-command-layout">
        <div className="dashboard-command-main">
          <header className="dashboard-command-section-head">
            <div>
              <p className="dashboard-command-eyebrow">Centro operativo</p>
              <h2>Disponibilità e movimenti</h2>
              <p>Ogni veicolo compare anche quando è libero, così la disponibilità resta sempre evidente.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/booking")}>Vista mensile</Button>
          </header>

          <div className="dashboard-timeline-viewport">
            <div className="dashboard-timeline-grid dashboard-timeline-grid--header" role="row">
              <span>Veicolo / targa</span>
              <span>Cliente</span>
              <div className="dashboard-time-header" aria-label="Orari timeline">
                {timelineHours.map((hour) => (
                  <span key={hour} style={{ left: `${positionForMinutes(hour * 60)}%` }}>{String(hour).padStart(2, "0")}:00</span>
                ))}
                {showCurrentTime ? (
                  <strong className="dashboard-current-time-label" style={{ left: `${currentTimeLeft}%` }}>
                    {timeLabel(today.toISOString())}
                  </strong>
                ) : null}
              </div>
              <span>Sede</span>
              <span>Stato</span>
              <span aria-hidden="true" />
            </div>

            {availability.loading ? (
              <FleetumBlockLoader label="Caricamento movimenti" className="min-h-[360px]" />
            ) : availability.error ? (
              <div className="dashboard-command-empty">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <strong>Timeline non disponibile</strong>
                  <p>{availability.error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAvailabilityRetry((value) => value + 1)}>Riprova</Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="dashboard-command-empty">
                <CalendarDays className="h-5 w-5" />
                <div>
                  <strong>Nessun movimento programmato oggi</strong>
                  <p>La flotta risulta libera nel periodo operativo visualizzato.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/booking")}>Apri prenotazioni</Button>
              </div>
            ) : (
              <div role="rowgroup">
                {rows.map((row) => {
                  const availabilityState = vehicleAvailabilityMeta(row, today);
                  return (
                    <div key={row.id} className="dashboard-timeline-grid dashboard-timeline-grid--row" role="row">
                      <div className="dashboard-vehicle-cell">
                        <span className="dashboard-vehicle-cell__icon"><Car className="h-4 w-4" /></span>
                        <span>
                          <b>{row.vehicle.brand} {row.vehicle.model}</b>
                          <small>{row.vehicle.plate}</small>
                        </span>
                      </div>
                      <span className="dashboard-customer-cell">{availabilityState.customer}</span>
                      <div className={`dashboard-time-track ${row.bookings.length === 0 ? "dashboard-time-track--available" : ""}`}>
                        {timelineGridHours.map((hour) => (
                          <i key={hour} aria-hidden="true" style={{ left: `${positionForMinutes(hour * 60)}%` }} />
                        ))}
                        {showCurrentTime ? (
                          <span className="dashboard-current-time" style={{ left: `${currentTimeLeft}%` }} aria-label={`Ora attuale ${timeLabel(today.toISOString())}`} />
                        ) : null}
                        {row.bookings.length ? row.bookings.map((entry) => (
                          <TimelineBookingBar key={entry.id} booking={entry} day={today} onOpen={() => navigate("/booking")} />
                        )) : (
                          <span className="dashboard-availability-label">
                            <CircleCheck className="h-3.5 w-3.5" /> Disponibile per nuove prenotazioni
                          </span>
                        )}
                      </div>
                      <span className="dashboard-site-cell"><MapPin className="h-3.5 w-3.5" /> {row.vehicle.siteName}</span>
                      <span className={`dashboard-status-pill ${availabilityToneClasses[availabilityState.tone]}`}>{availabilityState.label}</span>
                      <button type="button" className="dashboard-row-action" onClick={() => navigate("/booking")} aria-label={`Apri prenotazioni ${row.vehicle.plate}`}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <footer className="dashboard-timeline-legend" aria-label="Legenda stati">
            <span><i className="bg-emerald-200 ring-1 ring-emerald-500/40" /> Disponibile</span>
            <span><i className="bg-emerald-500" /> In corso</span>
            <span><i className="bg-blue-500" /> Confermato / pronto</span>
            <span><i className="bg-amber-500" /> Da confermare</span>
            <span><i className="bg-slate-400" /> Chiuso / altro</span>
          </footer>
        </div>

        <aside className="dashboard-priority-rail" aria-label="Priorità operative">
          <header>
            <div>
              <p className="dashboard-command-eyebrow">Azioni richieste</p>
              <h2>Priorità</h2>
            </div>
            <span>{priorities.length}</span>
          </header>

          <div className="dashboard-priority-list">
            {priorities.length ? priorities.map((item) => {
              const meta = priorityMeta(item.title);
              const Icon = meta.icon;
              return (
                <button key={item.id} type="button" className="dashboard-priority-item" onClick={() => navigate(item.route)}>
                  <span className={`dashboard-priority-item__icon ${priorityToneClasses[item.tone]}`}><Icon className="h-5 w-5" /></span>
                  <span>
                    <b>{item.title}</b>
                    <small>{item.description}</small>
                    <em>Apri dettaglio</em>
                  </span>
                </button>
              );
            }) : (
              <div className="dashboard-priority-clear">
                <span><CircleCheck className="h-5 w-5" /></span>
                <b>Nessuna criticità urgente</b>
                <p>Le attività di oggi non presentano blocchi prioritari.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};
