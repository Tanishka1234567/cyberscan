import { type ReactNode, useRef } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 8,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const rx = -(dy / (rect.height / 2)) * maxTilt;
    const ry = (dx / (rect.width / 2)) * maxTilt;

    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`;
    card.style.transition = "transform 0.1s ease";

    // Radial glow follows mouse
    if (glowRef.current) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      glowRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, oklch(0.65 0.22 250 / 0.1) 0%, transparent 60%)`;
    }
  }

  function onMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    card.style.transition = "transform 0.4s ease";
    if (glowRef.current) {
      glowRef.current.style.background = "transparent";
    }
  }

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ willChange: "transform", transformStyle: "preserve-3d" }}
    >
      {/* Mouse-following inner glow */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
          transition: "background 0.15s ease",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
