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
  const { preset, particlesPerBurst, maxParticles, durationMs, fadeDelayMs, minVerticalDistance, colors, symbols, disabled } = presetConfig;

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !layer || !enabled || disabled || reducedMotion.matches) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let emitted = false;

    const removeOldestParticle = () => {
      while (layer.childElementCount >= maxParticles) layer.firstElementChild?.remove();
    };

    const createParticle = (originX: number, originY: number) => {
      removeOldestParticle();
      const particle = document.createElement("span");
      const size = preset === "leaves" ? 8 + Math.random() * 8 : 10 + Math.random() * 13;
      particle.className = "touch-particle-trail__particle";
      particle.dataset.preset = preset;
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)] || "";
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.fontSize = `${size}px`;
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.setProperty("--touch-particle-size", `${size}px`);
      particle.style.setProperty("--touch-particle-drift-x", `${(Math.random() - 0.5) * 130}px`);
      particle.style.setProperty("--touch-particle-drift-y", `${-75 - Math.random() * 115}px`);
      particle.style.setProperty("--touch-particle-rotation", `${(Math.random() - 0.5) * 260}deg`);
      particle.style.setProperty("--touch-particle-scale", `${0.72 + Math.random() * 0.7}`);
      particle.style.setProperty("--touch-particle-duration", `${durationMs}ms`);
      particle.style.setProperty("--touch-particle-fade-delay", `${fadeDelayMs}ms`);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
      layer.appendChild(particle);
    };

    const emitBurst = (originX: number, originY: number) => {
      if (document.visibilityState !== "visible") return;
      for (let index = 0; index < particlesPerBurst; index += 1) createParticle(originX, originY);
    };

    const resetGesture = () => {
      pointerId = null;
      emitted = false;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !event.isPrimary || isInteractiveTarget(event.target)) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      emitted = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || emitted || event.pointerType !== "touch") return;
      const distanceX = event.clientX - startX;
      const distanceY = event.clientY - startY;
      if (Math.abs(distanceY) < minVerticalDistance || Math.abs(distanceY) <= Math.abs(distanceX)) return;
      emitBurst(event.clientX, event.clientY);
      emitted = true;
    };

    root.addEventListener("pointerdown", handlePointerDown, { passive: true });
    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerup", resetGesture, { passive: true });
    root.addEventListener("pointercancel", resetGesture, { passive: true });
    return () => {
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerup", resetGesture);
      root.removeEventListener("pointercancel", resetGesture);
      layer.replaceChildren();
    };
  }, [colors, disabled, durationMs, enabled, fadeDelayMs, layerRef, maxParticles, minVerticalDistance, particlesPerBurst, preset, rootRef, symbols]);
}
