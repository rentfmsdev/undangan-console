export type TouchParticlePreset = "stardust" | "snow" | "leaves" | "editorial";

export type TouchParticleConfig = {
  preset: TouchParticlePreset;
  particlesPerBurst?: number;
  maxParticles?: number;
  durationMs?: number;
  fadeDelayMs?: number;
  minVerticalDistance?: number;
  colors?: string[];
  symbols?: string[];
  disabled?: boolean;
};

export const TOUCH_PARTICLE_PRESETS: Record<TouchParticlePreset, Required<Omit<TouchParticleConfig, "preset" | "disabled">>> = {
  stardust: {
    particlesPerBurst: 10,
    maxParticles: 96,
    durationMs: 3200,
    fadeDelayMs: 900,
    minVerticalDistance: 16,
    colors: ["#f5d980", "#b8d5ff", "#ffffff"],
    symbols: ["✦", "✧", "⋆"],
  },
  snow: {
    particlesPerBurst: 10,
    maxParticles: 96,
    durationMs: 3400,
    fadeDelayMs: 900,
    minVerticalDistance: 16,
    colors: ["#ffffff", "#cde6ff", "#8bc5f8"],
    symbols: ["✦", "✧", "✺"],
  },
  leaves: {
    particlesPerBurst: 3,
    maxParticles: 48,
    durationMs: 1800,
    fadeDelayMs: 600,
    minVerticalDistance: 20,
    colors: ["#235f4d", "#5f8977", "#c3a66a"],
    symbols: [""],
  },
  editorial: {
    particlesPerBurst: 10,
    maxParticles: 96,
    durationMs: 3000,
    fadeDelayMs: 850,
    minVerticalDistance: 16,
    colors: ["#151515", "#f3eadb", "#ed4b32"],
    symbols: ["✳", "✦", "◆"],
  },
};

export function resolveTouchParticleConfig(config: TouchParticleConfig) {
  const preset = TOUCH_PARTICLE_PRESETS[config.preset];
  return {
    ...preset,
    ...config,
    colors: config.colors?.length ? config.colors : preset.colors,
    symbols: config.symbols?.length ? config.symbols : preset.symbols,
  };
}
