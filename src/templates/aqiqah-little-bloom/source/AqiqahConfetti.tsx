"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export type ConfettiHandle = {
  triggerBurst: (count?: number) => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: "star" | "moon" | "sparkle" | "cloud";
  opacity: number;
  sway: number;
  vSway: number;
};

const PASTEL_PALETTE = [
  "#FFD700", // Pure Gold
  "#F6D06F", // Warm Pastel Gold
  "#B5D5F5", // Soft Sky Blue
  "#E8B4B8", // Pastel Rose
  "#C3E5D4", // Soft Mint
  "#FFF4D2", // Cream Sparkle
  "#FFFFFF", // Pure White
];

export const AqiqahConfetti = forwardRef<ConfettiHandle, { className?: string }>(
  function AqiqahConfetti(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animFrameRef = useRef<number | null>(null);

    function triggerBurst(count = 75) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;

      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const shape: Particle["shape"] =
          roll < 0.45 ? "star" : roll < 0.7 ? "moon" : roll < 0.9 ? "sparkle" : "cloud";

        particlesRef.current.push({
          x: Math.random() * w,
          y: -20 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 1.8,
          vy: Math.random() * 2.2 + 1.8,
          size:
            shape === "moon"
              ? Math.random() * 10 + 8
              : shape === "star"
              ? Math.random() * 9 + 6
              : shape === "cloud"
              ? Math.random() * 12 + 8
              : Math.random() * 5 + 3,
          color: PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 3,
          shape,
          opacity: 1,
          sway: Math.random() * Math.PI * 2,
          vSway: Math.random() * 0.04 + 0.02,
        });
      }

      if (!animFrameRef.current) {
        loop();
      }
    }

    useImperativeHandle(ref, () => ({
      triggerBurst,
    }));

    function loop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.sway += p.vSway;
        p.x += Math.sin(p.sway) * 1.4 + p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.opacity -= 0.005;

        if (p.opacity <= 0 || p.y > canvas.height + 40) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "moon") {
          // Crescent Moon
          ctx.beginPath();
          ctx.arc(0, 0, p.size, Math.PI * 0.3, Math.PI * 1.7, false);
          ctx.arc(p.size * 0.45, 0, p.size * 0.8, Math.PI * 1.5, Math.PI * 0.5, true);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "cloud") {
          // Soft little cloud
          ctx.beginPath();
          ctx.arc(-p.size * 0.3, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.arc(0, -p.size * 0.2, p.size * 0.45, 0, Math.PI * 2);
          ctx.arc(p.size * 0.3, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "sparkle") {
          // Glowing Starlight Orb
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 5-Pointed Star
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size,
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.48),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.48)
            );
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    }

    useEffect(() => {
      const handleResize = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`aqiqah-confetti-canvas ${props.className || ""}`}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 999,
        }}
      />
    );
  }
);
