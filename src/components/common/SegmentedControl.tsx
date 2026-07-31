import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  style
}: SegmentedControlProps<T>) {
  return (
    <div className={`seg ${className}`.trim()} style={style}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`seg-opt ${active ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
