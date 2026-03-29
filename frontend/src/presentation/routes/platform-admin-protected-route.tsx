import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { platformAuthStorage } from "../../infrastructure/platform/platform-auth-storage";

type Props = { children: ReactNode };

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    if (typeof payload?.exp !== "number") return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
};

export const PlatformAdminProtectedRoute = ({ children }: Props) => {
  const token = platformAuthStorage.get();
  if (token && isTokenExpired(token)) {
    platformAuthStorage.clear();
    return <Navigate to="/login" replace />;
  }
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
