"use client";

type Props = {
  label: string;
  value?: string;
  fallbackValue: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onReset?: () => void;
};

export function CollaborativeColorInput({
  label,
  value,
  fallbackValue,
  disabled = false,
  onChange,
  onReset,
}: Props) {
  const displayColor = value || fallbackValue;

  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-300">
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {onReset && value && (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReset();
            }}
            className="text-[9px] font-bold text-emerald-700 hover:underline"
          >
            Reset
          </button>
        )}
      </span>
      <span className="flex items-center gap-2">
        <code className="text-[9px] font-mono font-medium text-slate-500">{displayColor}</code>
        <input
          type="color"
          disabled={disabled}
          value={displayColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </span>
    </label>
  );
}
