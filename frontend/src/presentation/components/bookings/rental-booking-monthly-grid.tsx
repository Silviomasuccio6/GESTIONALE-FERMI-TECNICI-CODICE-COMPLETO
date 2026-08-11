import { useEffect, useRef } from "react";
import { RentalBookingStatus } from "../../../application/usecases/rental-bookings-usecases";
import { rentalDurationLabel } from "../../../domain/rental-booking-duration";
import { Car, MapPin, ShieldCheck, Wrench } from "lucide-react";

type BookingCell = {
  id: string;
  code: string;
  status: RentalBookingStatus;
  customerName: string;
  pickupAt: string;
  returnAt: string;
  pickupKm?: number | null;
  returnKm?: number | null;
};

type VehicleRow = {
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    deadlineStatus?: {
      maintenance: DeadlineIndicator;
      revision: DeadlineIndicator;
    };
    site?: { id: string; name: string; city?: string | null };
  };
  bookings: BookingCell[];
};

type DeadlineIndicator = {
  status: "OK" | "DUE_SOON" | "EXPIRED";
  label: string;
  detail: string;
};

type Props = {
  monthKey: string;
  monthDays: Date[];
  rows: VehicleRow[];
  className?: string;
  statusFilter?: RentalBookingStatus | "";
  selectedBookingId?: string | null;
  onSelectBooking: (bookingId: string) => void;
  onEmptyCellClick: (input: { vehicleId: string; date: Date }) => void;
  onBookingContextMenu: (input: { booking: BookingCell; x: number; y: number }) => void;
  getStatusClass: (status: RentalBookingStatus) => string;
};

const dayRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const overlapsDay = (booking: BookingCell, date: Date) => {
  const { start, end } = dayRange(date);
  const pickup = new Date(booking.pickupAt);
  const ret = new Date(booking.returnAt);
  return pickup < end && ret > start;
};

const bookingSpanInMonth = (booking: BookingCell, monthDays: Date[]) => {
  let startIndex = -1;
  let endIndex = -1;
  monthDays.forEach((date, index) => {
    if (!overlapsDay(booking, date)) return;
    if (startIndex === -1) startIndex = index;
    endIndex = index;
  });
  if (startIndex === -1 || endIndex === -1) return null;
  return {
    start: startIndex,
    span: endIndex - startIndex + 1
  };
};

const isSameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatShortDateTime = (value: string) =>
  new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

const deadlineToneClass = (status: DeadlineIndicator["status"]) => {
  if (status === "EXPIRED") return "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-300";
  if (status === "DUE_SOON") return "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300";
  return "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300";
};

const fallbackDeadline = (label: string): DeadlineIndicator => ({
  status: "OK",
  label,
  detail: "Tutto ok"
});

export const RentalBookingMonthlyGrid = ({
  monthKey,
  monthDays,
  rows,
  className = "max-h-[68vh]",
  statusFilter,
  selectedBookingId,
  onSelectBooking,
  onEmptyCellClick,
  onBookingContextMenu,
  getStatusClass
}: Props) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const vehicleColumnWidth = 316;
  const siteColumnWidth = 154;
  const dayColumnMinWidth = 50;
  const daysColumns = `repeat(${monthDays.length}, minmax(${dayColumnMinWidth}px, 1fr))`;
  const minGridWidth = vehicleColumnWidth + siteColumnWidth + monthDays.length * dayColumnMinWidth;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  useEffect(() => {
    if (!scrollerRef.current) return;
    const todayIndex = monthDays.findIndex((date) => isSameCalendarDay(date, today));
    const nextScrollLeft =
      todayIndex >= 0
        ? Math.max(0, vehicleColumnWidth + todayIndex * dayColumnMinWidth - scrollerRef.current.clientWidth * 0.42)
        : 0;
    window.requestAnimationFrame(() => {
      if (!scrollerRef.current) return;
      scrollerRef.current.scrollLeft = nextScrollLeft;
    });
  }, [dayColumnMinWidth, monthDays, monthKey, todayKey, vehicleColumnWidth]);

  return (
    <div
      ref={scrollerRef}
      className={`${className} overflow-auto rounded-2xl border border-border/70 bg-card shadow-[0_18px_55px_-38px_rgba(15,23,42,0.55)]`}
    >
      <div style={{ minWidth: `${minGridWidth}px` }}>
        <div
          className="sticky top-0 z-40 grid border-b border-slate-200/80 bg-white/96 backdrop-blur dark:border-border/80 dark:bg-card/95"
          style={{ gridTemplateColumns: `${vehicleColumnWidth}px ${siteColumnWidth}px repeat(${monthDays.length}, minmax(${dayColumnMinWidth}px, 1fr))` }}
        >
          <div className="sticky left-0 z-50 flex h-14 items-center overflow-hidden border-r border-slate-200/80 bg-white px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-[14px_0_22px_-22px_rgba(15,23,42,0.9)] dark:border-border/80 dark:bg-card dark:text-muted-foreground">
            Veicolo
          </div>
          <div
            className="sticky z-40 flex h-14 items-center overflow-hidden border-r border-slate-200/80 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-[14px_0_22px_-24px_rgba(15,23,42,0.7)] dark:border-border/80 dark:bg-card dark:text-muted-foreground"
            style={{ left: `${vehicleColumnWidth}px` }}
          >
            Sede
          </div>
          {monthDays.map((date) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = isSameCalendarDay(date, today);
            return (
            <div
              key={`head-${date.toISOString()}`}
              className={`relative flex h-14 flex-col items-center justify-center border-r border-slate-200/70 px-1 text-center text-[10px] font-semibold last:border-r-0 dark:border-border/70 ${
                isWeekend ? "bg-slate-50 text-slate-400 dark:bg-muted/30 dark:text-muted-foreground" : "text-slate-500 dark:text-muted-foreground"
              } ${isToday ? "bg-blue-50/80 dark:bg-primary/[0.08]" : ""}`}
              aria-current={isToday ? "date" : undefined}
            >
              {isToday ? <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-blue-500/40" aria-hidden="true" /> : null}
              <div className="uppercase tracking-[0.12em]">{date.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 2)}</div>
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  isToday ? "bg-blue-600 text-white shadow-sm" : "text-slate-900 dark:text-foreground"
                }`}
              >
                {date.getDate()}
              </div>
            </div>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center border-b border-border/60 px-6 text-center">
            <div className="max-w-sm">
              <p className="text-sm font-semibold text-foreground">Nessun veicolo visibile</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Prova a cambiare sede, stato o ricerca per visualizzare la disponibilità del mese.
              </p>
            </div>
          </div>
        ) : null}

        {rows.map((row) => {
          const filteredBookings = row.bookings.filter((booking) => (statusFilter ? booking.status === statusFilter : true));
          const maintenanceStatus = row.vehicle.deadlineStatus?.maintenance ?? fallbackDeadline("Manutenzione ok");
          const revisionStatus = row.vehicle.deadlineStatus?.revision ?? fallbackDeadline("Revisione ok");
          const monthContainsToday = monthDays.some((date) => isSameCalendarDay(date, today));
          const nowMs = today.getTime();
          const currentBooking = row.bookings.find((booking) => {
            const pickup = new Date(booking.pickupAt).getTime();
            const returned = new Date(booking.returnAt).getTime();
            return pickup <= nowMs && returned > nowMs;
          });
          const nextBookingToday = row.bookings.find((booking) => {
            const pickup = new Date(booking.pickupAt);
            return pickup.getTime() > nowMs && isSameCalendarDay(pickup, today);
          });
          const availabilityLabel = monthContainsToday
            ? currentBooking
              ? `Occupata fino ${formatTime(currentBooking.returnAt)}`
              : nextBookingToday
                ? `Libera fino ${formatTime(nextBookingToday.pickupAt)}`
                : "Disponibile oggi"
            : row.bookings.length
              ? `${row.bookings.length} ${row.bookings.length === 1 ? "prenotazione" : "prenotazioni"} nel mese`
              : "Disponibile nel mese";
          const availabilityTone = currentBooking
            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
          return (
          <div
            key={row.vehicle.id}
            className="grid border-b border-slate-200/70 last:border-b-0 dark:border-border/60"
            style={{ gridTemplateColumns: `${vehicleColumnWidth}px ${siteColumnWidth}px minmax(0, 1fr)` }}
          >
            <div className="sticky left-0 z-30 flex h-[78px] flex-col justify-center overflow-hidden border-r border-slate-200/80 bg-white px-4 shadow-[14px_0_22px_-22px_rgba(15,23,42,0.75)] dark:border-border/80 dark:bg-card">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300" aria-hidden="true">
                  <Car className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold leading-none tracking-[0.02em] text-slate-950 dark:text-foreground">{row.vehicle.plate}</p>
                  <p className="mt-1 truncate text-[11px] leading-none text-slate-500 dark:text-muted-foreground">{row.vehicle.brand} {row.vehicle.model}</p>
                </div>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${deadlineToneClass(maintenanceStatus.status)}`}
                    title={`${maintenanceStatus.label} · ${maintenanceStatus.detail}`}
                    aria-label={`${row.vehicle.plate}: ${maintenanceStatus.label}. ${maintenanceStatus.detail}`}
                  >
                    <Wrench className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${deadlineToneClass(revisionStatus.status)}`}
                    title={`${revisionStatus.label} · ${revisionStatus.detail}`}
                    aria-label={`${row.vehicle.plate}: ${revisionStatus.label}. ${revisionStatus.detail}`}
                  >
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  </span>
                </span>
              </div>
              <span className={`mt-1.5 inline-flex w-fit max-w-full items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${availabilityTone}`}>
                <span className="truncate">{availabilityLabel}</span>
              </span>
            </div>
            <div
              className="sticky z-20 flex h-[78px] items-center border-r border-slate-200/80 bg-white px-3 shadow-[14px_0_22px_-24px_rgba(15,23,42,0.55)] dark:border-border/80 dark:bg-card"
              style={{ left: `${vehicleColumnWidth}px` }}
            >
              <div className="min-w-0">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-border dark:bg-muted/25 dark:text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{row.vehicle.site?.name ?? "Sede non assegnata"}</span>
                </span>
                {row.vehicle.site?.city ? <p className="mt-1 truncate text-[10px] text-slate-400 dark:text-muted-foreground">{row.vehicle.site.city}</p> : null}
              </div>
            </div>
            <div className="relative">
              <div className="grid" style={{ gridTemplateColumns: daysColumns }}>
                {monthDays.map((date) => {
                  const allDayBookings = row.bookings.filter((booking) => overlapsDay(booking, date));
                  const visibleDayBookings = filteredBookings.filter((booking) => overlapsDay(booking, date));
                  const first = visibleDayBookings[0];
                  const isOccupied = allDayBookings.length > 0;
                  const isHiddenByFilter = isOccupied && !first;
                  const isSelected = Boolean(first && selectedBookingId === first.id);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = isSameCalendarDay(date, today);

                  return (
                    <button
                      key={`${row.vehicle.id}-${date.toISOString()}`}
                      type="button"
                      className={`group relative h-[78px] border-r border-slate-200/60 px-0.5 text-left transition-colors last:border-r-0 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed dark:border-border/60 ${
                        isWeekend ? "bg-slate-50/65 dark:bg-muted/[0.18]" : "bg-white dark:bg-card"
                      } ${isToday ? "bg-blue-50/80 dark:bg-primary/[0.045]" : ""} ${first ? "hover:bg-blue-50/80 dark:hover:bg-primary/5" : isHiddenByFilter ? "bg-slate-100/80 dark:bg-muted/45" : "bg-emerald-50/35 hover:bg-emerald-50/80 dark:bg-emerald-500/[0.035] dark:hover:bg-emerald-500/[0.08]"} ${
                        isSelected ? "ring-1 ring-primary/50" : ""
                      }`}
                      disabled={isHiddenByFilter}
                      onClick={() => {
                        if (first) onSelectBooking(first.id);
                        else if (!isOccupied) onEmptyCellClick({ vehicleId: row.vehicle.id, date });
                      }}
                      onContextMenu={(event) => {
                        if (!first) return;
                        event.preventDefault();
                        onBookingContextMenu({ booking: first, x: event.clientX, y: event.clientY });
                      }}
                      aria-label={
                        first
                          ? `Prenotazione ${first.code} - ${first.customerName}`
                          : isHiddenByFilter
                            ? `Occupata da una prenotazione esclusa dal filtro, ${row.vehicle.plate}, ${date.toLocaleDateString("it-IT")}`
                            : `Disponibile, ${row.vehicle.plate}, ${date.toLocaleDateString("it-IT")}`
                      }
                    >
                      {isToday ? <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-blue-500/35" aria-hidden="true" /> : null}
                      {!isOccupied ? (
                        <span className="absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400/55 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: daysColumns }}>
                {filteredBookings.map((booking) => {
                    const span = bookingSpanInMonth(booking, monthDays);
                    if (!span) return null;
                    const isSelected = selectedBookingId === booking.id;
                    const dateRange = `${formatShortDateTime(booking.pickupAt)} - ${formatShortDateTime(booking.returnAt)}`;
                    const duration = rentalDurationLabel(booking.pickupAt, booking.returnAt);
                    return (
                      <button
                        key={`bar-${booking.id}`}
                        type="button"
                        className={`pointer-events-auto relative mx-[4px] my-[18px] flex h-[42px] min-w-0 items-center rounded-[13px] border px-2.5 text-left text-[10px] font-bold leading-none shadow-sm transition-[box-shadow,transform,filter] duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${getStatusClass(booking.status)} ${
                          isSelected ? "ring-2 ring-primary/80" : ""
                        }`}
                        style={{ gridColumn: `${span.start + 1} / span ${span.span}` }}
                        onClick={() => onSelectBooking(booking.id)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onBookingContextMenu({ booking, x: event.clientX, y: event.clientY });
                        }}
                        title={`${booking.code} · ${booking.customerName} · ${dateRange}${duration ? ` · ${duration}` : ""}`}
                        aria-label={`Prenotazione ${booking.code} - ${booking.customerName}${duration ? ` - ${duration}` : ""}`}
                      >
                        <span className="absolute left-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
                        <span className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden px-2">
                          <span className="min-w-0 truncate">{booking.customerName}</span>
                          <span className="hidden shrink-0 rounded-full bg-white/45 px-1.5 py-0.5 text-[9px] font-black sm:inline dark:bg-black/15">
                            {booking.code}
                          </span>
                          {duration && span.span >= 6 ? (
                            <span className="hidden shrink-0 opacity-75 2xl:inline">{duration.split(" · ")[0]}</span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
