"use client";

import { useRef, type RefObject } from "react";
import type { TouchParticleConfig } from "./presets";
import { useTouchParticleTrail } from "./useTouchParticleTrail";
import "./touch-particle-trail.css";

type Props = {
  rootRef: RefObject<HTMLElement | null>;
  config: TouchParticleConfig;
  enabled?: boolean;
};

export function TouchParticleTrail({ rootRef, config, enabled = true }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  useTouchParticleTrail({ rootRef, layerRef, config, enabled });
  return <div ref={layerRef} className="touch-particle-trail" aria-hidden="true" />;
}
