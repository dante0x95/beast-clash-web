import "./StatBar.css";

interface StatBarProps {
  readonly color: string;
  readonly label: string;
  readonly max: number;
  readonly name: string;
  readonly value: number;
}

export function StatBar({ color, label, max, name, value }: StatBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="stat-bar">
      <span aria-hidden="true" className="stat-bar__label">
        {label}
      </span>
      <div
        aria-label={name}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={value}
        className="stat-bar__track"
        role="meter"
      >
        <div
          className="stat-bar__fill"
          style={{ background: color, width: `${String(percent)}%` }}
        />
      </div>
      <span aria-hidden="true" className="stat-bar__value">
        {value}
      </span>
    </div>
  );
}
