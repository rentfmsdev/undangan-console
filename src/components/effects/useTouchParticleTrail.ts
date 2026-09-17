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
  const { preset, maxParticles, durationMs, colors, symbols, disabled, particlesPerBurst } = presetConfig;
  const burstCount = Math.max(1, particlesPerBurst ?? 3);

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
      if (originX < -40 || originX > rect.width + 40 || originY < -40 || originY > rect.height + 40) {
        return;
      }

      removeOldestParticle();

      const particle = document.createElement("span");
      const size = preset === "leaves" ? 12 + Math.random() * 8 : 10 + Math.random() * 12;
      particle.className = "touch-particle-trail__particle";
      particle.dataset.preset = preset;

      if (preset === "leaves") {
        // 3 subtle shape variants for organic leaf look
        particle.dataset.shape = String(Math.floor(Math.random() * 3));
      }

      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      if (symbol) {
        particle.textContent = symbol;
      }

      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.fontSize = `${size}px`;
      particle.style.color = chosenColor;
      if (preset === "leaves") {
        particle.style.backgroundColor = chosenColor;
      }

      const driftX = (Math.random() - 0.5) * 85;
      const driftY = preset === "leaves" ? 28 + Math.random() * 62 : -40 - Math.random() * 70;
      const rotation = (Math.random() - 0.5) * 260;
      const scale = 0.75 + Math.random() * 0.55;
      const duration = durationMs ? Math.min(durationMs, 2200) : 1800;

      particle.style.setProperty("--touch-particle-size", `${size}px`);
      particle.style.setProperty("--touch-particle-drift-x", `${driftX}px`);
      particle.style.setProperty("--touch-particle-drift-y", `${driftY}px`);
      particle.style.setProperty("--touch-particle-rotation", `${rotation}deg`);
      particle.style.setProperty("--touch-particle-scale", `${scale}`);
      particle.style.setProperty("--touch-particle-duration", `${duration}ms`);

      particle.addEventListener("animationend", () => particle.remove(), { once: true });
      // Fallback cleanup timer for Safari iOS under scroll throttling
      setTimeout(() => particle.remove(), duration + 100);

      layer.appendChild(particle);
    };

    const emitBurst = (clientX: number, clientY: number, count = 1) => {
      if (document.visibilityState !== "visible") return;
      for (let i = 0; i < count; i++) {
        createParticle(
          clientX + (count > 1 ? (Math.random() - 0.5) * 24 : 0),
          clientY + (count > 1 ? (Math.random() - 0.5) * 24 : 0),
        );
      }
    };

    // --- Touch Events (Mobile Touch & Scroll Trail on iOS & Android) ---
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || isInteractiveTarget(event.target)) return;
      isActive = true;
      lastX = touch.clientX;
      lastY = touch.clientY;
      // Emit burst of 3 particles on touch down
      emitBurst(touch.clientX, touch.clientY, burstCount);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isActive) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dist = Math.hypot(touch.clientX - lastX, touch.clientY - lastY);
      // Emit continuous trail every 26px along the finger path
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
      emitBurst(event.clientX, event.clientY, burstCount);
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

    // Listen on root and window with passive listeners for maximum iOS Safari compatibility
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    root.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      root.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);

      root.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      layer.replaceChildren();
    };
  }, [burstCount, colors, disabled, durationMs, enabled, maxParticles, preset, rootRef, symbols]);
}
