import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initTheme } from "./infrastructure/theme/theme-manager";
import { SnackbarViewport } from "./presentation/components/ui/snackbar-viewport";
import { AppRoutes } from "./presentation/routes/app-routes";
import "./presentation/styles/global.css";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
      <SnackbarViewport />
    </BrowserRouter>
  </React.StrictMode>
);
