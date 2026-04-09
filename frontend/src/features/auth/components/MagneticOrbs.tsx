import { useMouseParallax } from "../hooks/useMouseParallax";

export const MagneticOrbs = () => {
  const { nx, ny } = useMouseParallax();

  return (
    <>
      <div
        className="premium-login-orb premium-login-orb--violet"
        style={{ transform: `translate(${nx * 60}px, ${ny * 40}px)` }}
        aria-hidden
      />
      <div
        className="premium-login-orb premium-login-orb--teal"
        style={{ transform: `translate(${-nx * 50}px, ${-ny * 35}px)` }}
        aria-hidden
      />
      <div
        className="premium-login-orb premium-login-orb--rose"
        style={{ transform: `translate(calc(-50% + ${nx * 30}px), calc(-50% + ${ny * 20}px))` }}
        aria-hidden
      />
    </>
  );
};
