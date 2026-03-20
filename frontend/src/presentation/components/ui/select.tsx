import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/utils";

type OptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

const extractOptions = (children: React.ReactNode): OptionItem[] =>
  React.Children.toArray(children)
    .filter(React.isValidElement)
    .flatMap((child) => {
      const option = child as React.ReactElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>;
      if (option.type !== "option") return [];
      return [
        {
          value: String(option.props.value ?? ""),
          label: typeof option.props.children === "string" ? option.props.children : String(option.props.children ?? ""),
          disabled: Boolean(option.props.disabled)
        }
      ];
    });

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, defaultValue, onChange, disabled, name, id, required, ...props }, ref) => {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? options[0]?.value ?? ""));
    const currentValue = isControlled ? String(value ?? "") : internalValue;
    const selected = options.find((option) => option.value === currentValue);
    const [open, setOpen] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = React.useState<{ top: number; left: number; width: number }>({
      top: 0,
      left: 0,
      width: 0
    });

    React.useEffect(() => {
      if (!isControlled && defaultValue !== undefined) setInternalValue(String(defaultValue));
    }, [defaultValue, isControlled]);

    React.useEffect(() => {
      if (!open) return;
      const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMenuStyle({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width
        });
      };
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [open]);

    React.useEffect(() => {
      const onPointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
      };
      const onEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onEscape);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onEscape);
      };
    }, []);

    const handleSelect = (next: string) => {
      if (!isControlled) setInternalValue(next);
      const synthetic = { target: { value: next }, currentTarget: { value: next } } as React.ChangeEvent<HTMLSelectElement>;
      onChange?.(synthetic);
      setOpen(false);
    };

    return (
      <div ref={wrapperRef} className="relative w-full">
        <select
          ref={ref}
          id={id}
          name={name}
          required={required}
          value={currentValue}
          onChange={() => {
            // Native select kept for form compatibility.
          }}
          disabled={disabled}
          className="pointer-events-none absolute inset-0 h-0 w-0 opacity-0"
          {...props}
        >
          {children}
        </select>

        <button
          type="button"
          ref={triggerRef}
          disabled={disabled}
          onClick={() => setOpen((x) => !x)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-left text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
            open ? "ring-2 ring-ring" : "",
            className
          )}
        >
          <span className={cn("truncate", !selected ? "text-muted-foreground" : "")}>{selected?.label ?? "Seleziona..."}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
        </button>

        {open
          ? createPortal(
              <div
                ref={menuRef}
                style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
                className="fixed z-[140] max-h-64 overflow-auto rounded-xl border border-border bg-card p-1 text-foreground shadow-2xl"
              >
            {options.map((option) => {
              const active = option.value === currentValue;
              return (
                <button
                  key={`${name ?? "select"}-${option.value}`}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    active ? "bg-accent text-accent-foreground" : ""
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
              </div>,
              document.body
            )
          : null}
      </div>
    );
  }
);

Select.displayName = "Select";
