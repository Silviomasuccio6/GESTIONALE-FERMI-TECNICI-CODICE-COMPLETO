import { CSSProperties, MouseEventHandler, useMemo, useState } from "react";

type MagneticOptions = {
  max?: number;
};

export const useMagneticMotion = (options?: MagneticOptions) => {
  const max = options?.max ?? 6;
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseMove: MouseEventHandler<HTMLElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: dx * max * 2, y: dy * max * 2 });
  };

  const onMouseLeave: MouseEventHandler<HTMLElement> = () => {
    setOffset({ x: 0, y: 0 });
  };

  const style = useMemo<CSSProperties>(
    () => ({ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }),
    [offset.x, offset.y]
  );

  return { style, onMouseMove, onMouseLeave };
};
