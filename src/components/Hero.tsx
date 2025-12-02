"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const w = (canvas.width = window.innerWidth);
            const h = (canvas.height = 320);

            const particles = Array.from({ length: 40 }).map(() => ({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: (Math.random() - 0.5) * 0.4,
              vy: (Math.random() - 0.5) * 0.4,
              r: 1 + Math.random() * 2,
            }));

            const loop = () => {
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.fillRect(0, 0, w, h);

              particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                ctx.fillStyle = "rgba(0, 255, 180, 0.8)";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
              });

              requestAnimationFrame(loop);
            };

            loop();
  }, []);

  return (
    <div className="relative w-full h-[320px] overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <h1 className="relative text-5xl font-bold text-center drop-shadow-xl">
        DigiEmu Marketplace
      </h1>
    </div>
  );
}
