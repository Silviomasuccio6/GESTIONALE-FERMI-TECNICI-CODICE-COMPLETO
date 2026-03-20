import { create } from "zustand";

export type SnackbarTone = "success" | "error" | "info";

export type SnackbarItem = {
  id: string;
  tone: SnackbarTone;
  message: string;
};

type SnackbarState = {
  items: SnackbarItem[];
  lastMessage: string | null;
  lastShownAt: number;
  push: (tone: SnackbarTone, message: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const messageCooldown = new Map<string, number>();
const PER_MESSAGE_COOLDOWN_MS = 15000;

export const useSnackbarStore = create<SnackbarState>((set) => ({
  items: [],
  lastMessage: null,
  lastShownAt: 0,
  push: (tone, message) =>
    set((state) => {
      const now = Date.now();
      const isDuplicateBurst = state.lastMessage === message && now - state.lastShownAt < 4000;
      const alreadyVisible = state.items.some((item) => item.message === message);
      const cooldownUntil = messageCooldown.get(message) ?? 0;
      if (isDuplicateBurst || alreadyVisible || cooldownUntil > now) return state;
      messageCooldown.set(message, now + PER_MESSAGE_COOLDOWN_MS);
      return {
        ...state,
        lastMessage: message,
        lastShownAt: now,
        items: [...state.items, { id: uid(), tone, message }].slice(-3)
      };
    }),
  remove: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    })),
  clear: () => set({ items: [], lastMessage: null, lastShownAt: 0 })
}));

export const snackbar = {
  success: (message: string) => useSnackbarStore.getState().push("success", message),
  error: (message: string) => useSnackbarStore.getState().push("error", message),
  info: (message: string) => useSnackbarStore.getState().push("info", message)
};
