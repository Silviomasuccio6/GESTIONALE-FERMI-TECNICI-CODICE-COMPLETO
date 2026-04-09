import { useMemo, useState } from "react";
import { CalendarView } from "../calendar-types";
import { addDays, formatDayTitle, formatMonthTitle, startOfDay, toDateKey } from "../calendar-utils";

export const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

export const getWeekStart = (date: Date) => {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
};

type UseCalendarState = {
  viewDate: Date;
  selDay: Date;
  miniDate: Date;
  curView: CalendarView;
  periodLabel: string;
  goToday: () => void;
  navigate: (dir: -1 | 1) => void;
  setView: (view: CalendarView) => void;
  pickDay: (date: Date) => void;
  miniNav: (dir: -1 | 1) => void;
  stepDay: (dir: -1 | 1) => void;
};

export const useCalendar = (initialView: CalendarView = "week"): UseCalendarState => {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(today);
  const [selDay, setSelDay] = useState(today);
  const [miniDate, setMiniDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [curView, setCurView] = useState<CalendarView>(initialView);

  const goToday = () => {
    const now = startOfDay(new Date());
    setViewDate(now);
    setSelDay(now);
    setMiniDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const navigate = (dir: -1 | 1) => {
    if (curView === "week") {
      setViewDate((prev) => addDays(prev, dir * 7));
      setSelDay((prev) => addDays(prev, dir * 7));
      return;
    }

    if (curView === "day") {
      setViewDate((prev) => addDays(prev, dir));
      setSelDay((prev) => addDays(prev, dir));
      return;
    }

    setViewDate((prev) => addMonths(prev, dir));
    setSelDay((prev) => addMonths(prev, dir));
  };

  const setView = (view: CalendarView) => {
    setCurView(view);
    if (view === "day") {
      setViewDate(startOfDay(selDay));
    }
  };

  const pickDay = (date: Date) => {
    const picked = startOfDay(date);
    setSelDay(picked);
    setViewDate(picked);
    setMiniDate(new Date(picked.getFullYear(), picked.getMonth(), 1));
    if (curView === "month") setCurView("day");
  };

  const miniNav = (dir: -1 | 1) => {
    setMiniDate((prev) => addMonths(prev, dir));
  };

  const stepDay = (dir: -1 | 1) => {
    const next = addDays(selDay, dir);
    setSelDay(next);
    setViewDate(next);
    setMiniDate(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const periodLabel = useMemo(() => {
    if (curView === "day") return formatDayTitle(viewDate);

    if (curView === "week") {
      const ws = getWeekStart(viewDate);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth() && ws.getFullYear() === we.getFullYear();
      const startLabel = ws.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short"
      });
      const endLabel = we.toLocaleDateString("it-IT", {
        day: "numeric",
        month: sameMonth ? undefined : "short",
        year: ws.getFullYear() === we.getFullYear() ? undefined : "numeric"
      });
      const monthLabel = formatMonthTitle(viewDate);
      return `${startLabel} - ${endLabel} · ${monthLabel}`;
    }

    return formatMonthTitle(viewDate);
  }, [curView, viewDate]);

  return {
    viewDate,
    selDay,
    miniDate,
    curView,
    periodLabel,
    goToday,
    navigate,
    setView,
    pickDay,
    miniNav,
    stepDay
  };
};

export { addDays, startOfDay, toDateKey };
