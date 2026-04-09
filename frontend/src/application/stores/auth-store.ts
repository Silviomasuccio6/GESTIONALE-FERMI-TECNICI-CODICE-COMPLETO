import { create } from "zustand";
import { User } from "../../domain/entities/models";
import { tokenStorage } from "../../infrastructure/auth/token-storage";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User, remember?: boolean) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: tokenStorage.get(),
  user: null,
  setSession: (token, user, remember = true) => {
    tokenStorage.set(token, remember);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    tokenStorage.clear();
    set({ token: null, user: null });
  }
}));
