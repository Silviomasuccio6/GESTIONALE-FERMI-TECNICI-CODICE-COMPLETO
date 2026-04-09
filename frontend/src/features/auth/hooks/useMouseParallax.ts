import { useCallback, useEffect, useState } from "react";

interface MousePosition {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export function useMouseParallax(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0, nx: 0, ny: 0 });

  const handler = useCallback((event: MouseEvent) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    setPosition({
      x: event.clientX,
      y: event.clientY,
      nx: event.clientX / width - 0.5,
      ny: event.clientY / height - 0.5
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [handler]);

  return position;
}
