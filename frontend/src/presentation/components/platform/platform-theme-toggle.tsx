import { Moon, Sun } from "lucide-react";
import { ThemeMode } from "../../../infrastructure/theme/theme-manager";
import { Button } from "../ui/button";

type PlatformThemeToggleProps = {
  mode: ThemeMode;
  onToggle: () => void;
};

export const PlatformThemeToggle = ({ mode, onToggle }: PlatformThemeToggleProps) => {
  const isDark = mode === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="platform-theme-toggle"
      onClick={onToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Attiva tema chiaro" : "Attiva tema scuro"}
      title={isDark ? "Passa a tema chiaro" : "Passa a tema scuro"}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Night"}</span>
    </Button>
  );
};
