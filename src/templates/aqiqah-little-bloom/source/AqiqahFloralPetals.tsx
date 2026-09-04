"use client";

import React, { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  sway: number;
  vSway: number;
  type: "rose-petal" | "sakura-petal" | "sage-leaf";
  opacity: number;
};

const PETAL_COLORS = [
  "#f7a8b8", // Soft Rose Pink
  "#fbc4cd", // Blush Pastel
  "#fce8ec", // Light Rose Cream
  "#fcd2d8", // Petal Peach Pink
  "#e896a6", // Deep Blush
  "#c1d8c3", // Soft Sage Leaf Green
  "#d6e5d7", // Mint Leaf Pastel
];

export function AqiqahFloralPetals({ maxPetals = 24 }: { maxPetals?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize initial petals scattered in viewport
    petalsRef.current = Array.from({ length: maxPetals }).map(() => {
      const typeRoll = Math.random();
      const type: Petal["type"] =
        typeRoll < 0.5 ? "rose-petal" : typeRoll < 0.8 ? "sakura-petal" : "sage-leaf";
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8 + 0.3,
        vy: Math.random() * 0.9 + 0.7,
        size: type === "sage-leaf" ? Math.random() * 8 + 8 : Math.random() * 9 + 10,
        color:
          type === "sage-leaf"
            ? (Math.random() > 0.5 ? "#b9d3bb" : "#cde0ce")
            : PETAL_COLORS[Math.floor(Math.random() * (PETAL_COLORS.length - 2))],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 1.5,
        sway: Math.random() * Math.PI * 2,
        vSway: Math.random() * 0.025 + 0.015,
        type,
        opacity: Math.random() * 0.35 + 0.45,
      };
    });

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const petals = petalsRef.current;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.sway += p.vSway;
        p.x += Math.sin(p.sway) * 0.9 + p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Reset to top once fallen below screen
        if (p.y > canvas.height + 25) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 25) {
          p.x = -20;
        } else if (p.x < -25) {
          p.x = canvas.width + 10;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.type === "rose-petal") {
          // Curved organic rose petal
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.7);
          ctx.bezierCurveTo(
            p.size * 0.65,
            -p.size * 0.5,
            p.size * 0.65,
            p.size * 0.5,
            0,
            p.size * 0.8
          );
          ctx.bezierCurveTo(
            -p.size * 0.65,
            p.size * 0.5,
            -p.size * 0.65,
            -p.size * 0.5,
            0,
            -p.size * 0.7
          );
          ctx.closePath();
          ctx.fill();
        } else if (p.type === "sakura-petal") {
          // Soft heart/sakura notched petal
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.5);
          ctx.quadraticCurveTo(p.size * 0.5, -p.size * 0.2, p.size * 0.3, p.size * 0.6);
          ctx.quadraticCurveTo(0, p.size * 0.8, -p.size * 0.3, p.size * 0.6);
          ctx.quadraticCurveTo(-p.size * 0.5, -p.size * 0.2, 0, -p.size * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          // Delicate eucalyptus / sage leaf with center vein
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.45, p.size * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();

          // Subtle leaf spine line
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 0.75);
          ctx.lineTo(0, p.size * 0.75);
          ctx.stroke();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [maxPetals]);

  return (
    <canvas
      ref={canvasRef}
      className="aqiqah-petals-canvas"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 25,
      }}
    />
  );
}
