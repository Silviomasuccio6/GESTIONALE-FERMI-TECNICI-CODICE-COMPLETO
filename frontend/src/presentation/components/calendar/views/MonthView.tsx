import { CalendarEvent, CalendarItem } from "../calendar-types";
import { getMonthGridDays, toDateKey, weekdayLabelsShort } from "../calendar-utils";
import { cn } from "../../../../lib/utils";

type MonthViewProps = {
  viewDate: Date;
  selDay: Date;
  events: CalendarEvent[];
  calendars: CalendarItem[];
  onPickDay: (date: Date) => void;
};

export const MonthView = ({ viewDate, selDay, events, calendars, onPickDay }: MonthViewProps) => {
  const days = getMonthGridDays(viewDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selDay);

  const eventsByDate = days.reduce<Record<string, CalendarEvent[]>>((acc, day) => {
    const key = toDateKey(day);
    acc[key] = events
      .filter((event) => event.date === key)
      .sort((a, b) => `${a.start}`.localeCompare(`${b.start}`));
    return acc;
  }, {});

  return (
    <div className="calendar-month" role="grid" aria-label="Calendario mensile">
      <div className="calendar-month__weekdays">
        {weekdayLabelsShort.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="calendar-month__grid">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayEvents = eventsByDate[key] ?? [];
          const isOtherMonth = day.getMonth() !== viewDate.getMonth();
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              className={cn(
                "calendar-month__cell",
                isOtherMonth && "is-om",
                isToday && "is-today",
                isSelected && "is-selected"
              )}
              onClick={() => onPickDay(day)}
            >
              <span className={cn("calendar-month__daynum", isToday && "is-today", isSelected && "is-selected")}>{day.getDate()}</span>

              <div className="calendar-month__events">
                {dayEvents.slice(0, 3).map((event) => {
                  const calendar = calendars.find((item) => item.id === event.calendarId) ?? calendars[0];
                  return (
                    <span
                      key={event.id}
                      className="calendar-month__event"
                      style={{ background: calendar.bg, color: calendar.tc }}
                    >
                      {event.title}
                    </span>
                  );
                })}
                {dayEvents.length > 3 ? <span className="calendar-month__more">+{dayEvents.length - 3}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
