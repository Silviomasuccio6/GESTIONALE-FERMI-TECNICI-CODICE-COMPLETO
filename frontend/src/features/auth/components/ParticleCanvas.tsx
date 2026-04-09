import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

const DOTS_MIN = 96;
const DOTS_MAX = 180;
const MAX_LINK_DISTANCE = 138;

const getDotsCount = (width: number, height: number) => {
  const byArea = Math.floor((width * height) / 14000);
  return Math.max(DOTS_MIN, Math.min(DOTS_MAX, byArea));
};

const createDots = (width: number, height: number) =>
  Array.from({ length: getDotsCount(width, height) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    radius: Math.random() * 1.25 + 0.45,
    opacity: Math.random() * 0.38 + 0.12
  }));

export const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dotsRef.current = createDots(canvas.width, canvas.height);
    };

    const onMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mouseX, y: mouseY } = mouseRef.current;

      dotsRef.current.forEach((dotA, index) => {
        const deltaMouseX = dotA.x - mouseX;
        const deltaMouseY = dotA.y - mouseY;
        const mouseDistance = Math.sqrt(deltaMouseX * deltaMouseX + deltaMouseY * deltaMouseY);

        if (mouseDistance > 0 && mouseDistance < MAX_LINK_DISTANCE) {
          dotA.vx += (deltaMouseX / mouseDistance) * 0.04;
          dotA.vy += (deltaMouseY / mouseDistance) * 0.04;
        }

        dotA.vx *= 0.982;
        dotA.vy *= 0.982;

        dotA.x += dotA.vx;
        dotA.y += dotA.vy;

        if (dotA.x <= 0 || dotA.x >= canvas.width) dotA.vx *= -1;
        if (dotA.y <= 0 || dotA.y >= canvas.height) dotA.vy *= -1;

        dotsRef.current.slice(index + 1).forEach((dotB) => {
          const deltaX = dotA.x - dotB.x;
          const deltaY = dotA.y - dotB.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < MAX_LINK_DISTANCE) {
            context.beginPath();
            context.moveTo(dotA.x, dotA.y);
            context.lineTo(dotB.x, dotB.y);
            context.strokeStyle = `rgba(79,70,229,${(1 - distance / MAX_LINK_DISTANCE) * 0.12})`;
            context.lineWidth = 0.65;
            context.stroke();
          }
        });

        context.beginPath();
        context.arc(dotA.x, dotA.y, dotA.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(79,70,229,${dotA.opacity})`;
        context.fill();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="premium-login-canvas" aria-hidden />;
};
