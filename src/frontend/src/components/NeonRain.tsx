import { useEffect, useRef } from "react";

interface Column {
  x: number;
  y: number;
  speed: number;
  color: "blue" | "magenta" | "pink";
  length: number;
}

const CHARS =
  "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポ0123456789╔╗╝╚║═╠╣╦╩╬▓▒░";

const COLORS = {
  blue: { r: 0, g: 180, b: 255 },
  magenta: { r: 200, g: 50, b: 240 },
  pink: { r: 240, g: 100, b: 230 },
};

export default function NeonRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 14;
    let columns: Column[] = [];
    let animFrame: number;

    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const numCols = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: numCols }, (_, i) => ({
        x: i * fontSize,
        y: Math.random() * -canvas.height,
        speed: Math.random() * 1.2 + 0.5,
        color:
          Math.random() < 0.05
            ? "pink"
            : Math.random() < 0.18
              ? "magenta"
              : "blue",
        length: Math.floor(Math.random() * 18) + 6,
      }));
    };

    initCanvas();

    const onResize = () => {
      initCanvas();
    };
    window.addEventListener("resize", onResize);

    const draw = () => {
      // Fade trail
      ctx.fillStyle = "rgba(5, 6, 18, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (const col of columns) {
        const { r, g, b } = COLORS[col.color];

        // Draw tail (fading chars above head)
        for (let t = 1; t <= col.length; t++) {
          const yPos = col.y - t * fontSize;
          if (yPos < 0) continue;
          const tailAlpha = ((col.length - t) / col.length) * 0.45;
          ctx.fillStyle = `rgba(${r},${g},${b},${tailAlpha})`;
          const tailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(tailChar, col.x, yPos);
        }

        // Draw bright head character
        if (col.y > 0 && col.y < canvas.height) {
          ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
          // Add glow for head
          ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
          ctx.shadowBlur = 8;
          const headChar = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(headChar, col.x, col.y);
          ctx.shadowBlur = 0;
        }

        col.y += col.speed * fontSize * 0.35;

        // Reset when off screen
        if (col.y - col.length * fontSize > canvas.height) {
          col.y = Math.random() * -100 - fontSize * col.length;
          col.speed = Math.random() * 1.2 + 0.5;
          col.color =
            Math.random() < 0.05
              ? "pink"
              : Math.random() < 0.18
                ? "magenta"
                : "blue";
          col.length = Math.floor(Math.random() * 18) + 6;
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.35,
      }}
    />
  );
}
