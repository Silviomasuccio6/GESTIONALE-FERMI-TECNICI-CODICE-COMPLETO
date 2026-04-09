export type CalendarView = "week" | "month" | "day";

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  calendarId: number;
  location?: string;
  description?: string;
  allDay?: boolean;
  source?: "custom" | "stoppage";
  remoteId?: string;
  readonly?: boolean;
  color?: string;
}

export interface CalendarItem {
  id: number;
  name: string;
  color: string;
  bg: string;
  tc: string;
  visible: boolean;
}

export interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  columnCount: number;
}

export const CALS_DEFAULT: CalendarItem[] = [
  {
    id: 0,
    name: "Lavoro",
    color: "#6d4bbf",
    bg: "#eee8fd",
    tc: "#3d2d8a",
    visible: true
  },
  {
    id: 1,
    name: "Personale",
    color: "#10b981",
    bg: "#d1fae5",
    tc: "#065f46",
    visible: true
  },
  {
    id: 2,
    name: "Finance",
    color: "#f59e0b",
    bg: "#fef3c7",
    tc: "#92400e",
    visible: true
  },
  {
    id: 3,
    name: "Dev",
    color: "#6366f1",
    bg: "#e0e7ff",
    tc: "#3730a3",
    visible: true
  },
  {
    id: 4,
    name: "Marketing",
    color: "#ec4899",
    bg: "#fce7f3",
    tc: "#9d174d",
    visible: true
  }
];
