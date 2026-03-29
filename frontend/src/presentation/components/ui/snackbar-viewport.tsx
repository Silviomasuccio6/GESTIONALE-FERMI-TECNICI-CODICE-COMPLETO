import { useEffect } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useSnackbarStore } from "../../../application/stores/snackbar-store";
import { Button } from "./button";

const toneStyles: Record<string, string> = {
  success:
    "border-emerald-500/60 bg-emerald-50 text-emerald-900 shadow-emerald-900/10 dark:bg-emerald-900/35 dark:text-emerald-100",
  error:
    "border-destructive/70 bg-red-50 text-red-900 shadow-red-900/10 dark:bg-red-900/35 dark:text-red-100",
  info:
    "border-blue-500/60 bg-blue-50 text-blue-900 shadow-blue-900/10 dark:bg-blue-900/35 dark:text-blue-100"
};

const toneLabel: Record<string, string> = {
  success: "Successo",
  error: "Errore",
  info: "Info"
};

export const SnackbarViewport = () => {
  const { items, remove } = useSnackbarStore();

  useEffect(() => {
    const timers = items.map((item) =>
      setTimeout(() => {
        remove(item.id);
      }, 3500)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [items, remove]);

  return (
    <div className="pointer-events-none fixed z-[120] inset-x-3 top-20 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[420px]">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-2xl backdrop-blur ring-1 ring-white/50 dark:ring-white/10 ${toneStyles[item.tone]}`}
        >
          <div className="flex items-start gap-2">
            {item.tone === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : item.tone === "error" ? <TriangleAlert className="mt-0.5 h-4 w-4" /> : <Info className="mt-0.5 h-4 w-4" />}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] opacity-80">{toneLabel[item.tone]}</p>
              <p className="mt-0.5 text-sm font-medium leading-snug">{item.message}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(item.id)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-black/10 dark:bg-white/10">
            <div className="h-full w-full animate-[shrink_3.5s_linear_forwards] rounded bg-current opacity-45" />
          </div>
        </div>
      ))}
    </div>
  );
};
