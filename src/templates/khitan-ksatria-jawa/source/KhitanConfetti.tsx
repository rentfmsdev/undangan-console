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
  shape: "star" | "petal" | "sparkle";
  opacity: number;
  sway: number;
  vSway: number;
};

const BERKAH_PALETTE = [
  "#FFF8DC", // Light Cream Gold
  "#FFD700", // Pure Gold
  "#D4AF37", // Royal Keraton Gold
  "#F3E5AB", // Champagne Gold
  "#FFFBEA", // Bright Sacred White-Gold
  "#E0A92E", // Warm Amber
  "#AA7C11", // Deep Antique Gold
];

export const KhitanConfetti = forwardRef<ConfettiHandle, { className?: string }>(function KhitanConfetti(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  function triggerBurst(count = 70) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;

    // Hujan Berkah: Rain cascading down from the heavens across the screen
    for (let i = 0; i < count; i++) {
      const shapeRoll = Math.random();
      const shape: "star" | "petal" | "sparkle" = shapeRoll < 0.4 ? "star" : shapeRoll < 0.75 ? "petal" : "sparkle";
      particlesRef.current.push({
        x: Math.random() * w,
        y: -15 - Math.random() * 120, // start above the top edge
        vx: (Math.random() - 0.5) * 1.6,
        vy: Math.random() * 2.6 + 2.0, // gentle rain speed downwards
        size: shape === "petal" ? Math.random() * 9 + 6 : shape === "star" ? Math.random() * 8 + 5 : Math.random() * 5 + 3,
        color: BERKAH_PALETTE[Math.floor(Math.random() * BERKAH_PALETTE.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 4,
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
      p.x += Math.sin(p.sway) * 1.5 + p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.opacity -= 0.005; // slowly fade as it falls

      if (p.opacity <= 0 || p.y > canvas.height + 40) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === "petal") {
        // Sacred golden jasmine petal
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "sparkle") {
        // Glowing divine blessing orb / droplet
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sacred 5-pointed radiant golden star
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
          ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.45), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size * 0.45));
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
      className={`khitan-confetti-canvas ${props.className || ""}`}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
});
