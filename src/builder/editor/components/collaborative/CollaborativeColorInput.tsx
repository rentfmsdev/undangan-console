"use client";

import { FigmaColorPicker } from "../FigmaColorPicker";

type Props = {
  label: string;
  value?: string;
  fallbackValue: string;
  disabled?: boolean;
  placement?: "auto" | "top" | "bottom";
  onChange: (value: string) => void;
  onReset?: () => void;
};

export function CollaborativeColorInput(props: Props) {
  return <FigmaColorPicker {...props} />;
}

