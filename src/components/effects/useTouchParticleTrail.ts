"use client";

import { useEffect, type RefObject } from "react";
import {
  resolveTouchParticleConfig,
  type TouchParticleConfig,
} from "./presets";

type Options = {
  rootRef: RefObject<HTMLElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  config: TouchParticleConfig;
  enabled?: boolean;
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest("button, a, input, textarea, select, [role='dialog'], [data-touch-particle-ignore]"),
  );
}

export function useTouchParticleTrail({ rootRef, layerRef, config, enabled = true }: Options) {
  const presetConfig = resolveTouchParticleConfig(config);
  const { preset, maxParticles, durationMs, colors, symbols, disabled } = presetConfig;

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !layer || !enabled || disabled || reducedMotion.matches) return;

    let lastX = 0;
    let lastY = 0;
    let isActive = false;

    const removeOldestParticle = () => {
      const cap = Math.min(maxParticles, 40);
      while (layer.childElementCount >= cap) {
        layer.firstElementChild?.remove();
      }
    };

    const createParticle = (clientX: number, clientY: number) => {
      const rect = layer.getBoundingClientRect();
      const originX = clientX - rect.left;
      const originY = clientY - rect.top;

      // Ensure coordinate is inside or near the layer bounds
      if (originX < -30 || originX > rect.width + 30 || originY < -30 || originY > rect.height + 30) {
        return;
      }

      removeOldestParticle();

      const particle = document.createElement("span");
      const size = preset === "leaves" ? 11 + Math.random() * 9 : 10 + Math.random() * 12;
      particle.className = "touch-particle-trail__particle";
      particle.dataset.preset = preset;

      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      if (symbol) {
        particle.textContent = symbol;
      }

      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.fontSize = `${size}px`;
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];

      const driftX = (Math.random() - 0.5) * 90;
      const driftY = preset === "leaves" ? 25 + Math.random() * 65 : -40 - Math.random() * 70;
      const rotation = (Math.random() - 0.5) * 280;
      const scale = 0.75 + Math.random() * 0.55;
      const duration = durationMs ? Math.min(durationMs, 2200) : 1800;

      particle.style.setProperty("--touch-particle-size", `${size}px`);
      particle.style.setProperty("--touch-particle-drift-x", `${driftX}px`);
      particle.style.setProperty("--touch-particle-drift-y", `${driftY}px`);
      particle.style.setProperty("--touch-particle-rotation", `${rotation}deg`);
      particle.style.setProperty("--touch-particle-scale", `${scale}`);
      particle.style.setProperty("--touch-particle-duration", `${duration}ms`);

      particle.addEventListener("animationend", () => particle.remove(), { once: true });
      // Fallback cleanup timer
      setTimeout(() => particle.remove(), duration + 100);

      layer.appendChild(particle);
    };

    const emitBurst = (clientX: number, clientY: number, count = 1) => {
      if (document.visibilityState !== "visible") return;
      for (let i = 0; i < count; i++) {
        createParticle(
          clientX + (count > 1 ? (Math.random() - 0.5) * 16 : 0),
          clientY + (count > 1 ? (Math.random() - 0.5) * 16 : 0),
        );
      }
    };

    // --- Touch Events (Mobile Touch & Scroll Trail) ---
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || isInteractiveTarget(event.target)) return;
      isActive = true;
      lastX = touch.clientX;
      lastY = touch.clientY;
      // Emit initial gentle burst on touch down (tap or start of drag)
      emitBurst(touch.clientX, touch.clientY, 2);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isActive) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dist = Math.hypot(touch.clientX - lastX, touch.clientY - lastY);
      // Emit continuously every 26px of finger travel along the scroll
      if (dist >= 26) {
        emitBurst(touch.clientX, touch.clientY, 1);
        lastX = touch.clientX;
        lastY = touch.clientY;
      }
    };

    const handleTouchEnd = () => {
      isActive = false;
    };

    // --- Pointer Events (Desktop Mouse Drag Fallback) ---
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || isInteractiveTarget(event.target)) return;
      isActive = true;
      lastX = event.clientX;
      lastY = event.clientY;
      emitBurst(event.clientX, event.clientY, 2);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isActive || event.pointerType === "touch") return;
      const dist = Math.hypot(event.clientX - lastX, event.clientY - lastY);
      if (dist >= 26) {
        emitBurst(event.clientX, event.clientY, 1);
        lastX = event.clientX;
        lastY = event.clientY;
      }
    };

    const handlePointerUp = () => {
      isActive = false;
    };

    // Listen on root with passive touch listeners so scrolling is never blocked
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("touchmove", handleTouchMove, { passive: true });
    root.addEventListener("touchend", handleTouchEnd, { passive: true });
    root.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    root.addEventListener("pointerdown", handlePointerDown, { passive: true });
    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerup", handlePointerUp, { passive: true });
    root.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchmove", handleTouchMove);
      root.removeEventListener("touchend", handleTouchEnd);
      root.removeEventListener("touchcancel", handleTouchEnd);

      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerup", handlePointerUp);
      root.removeEventListener("pointercancel", handlePointerUp);

      layer.replaceChildren();
    };
  }, [colors, disabled, durationMs, enabled, maxParticles, preset, rootRef, symbols]);
}
