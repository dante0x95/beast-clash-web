import type { Slot } from "./selection";

import "./SlotBar.css";

interface SlotBarProps {
  readonly active: Slot;
  readonly names: Readonly<Record<Slot, string | null>>;
  readonly onClear: (slot: Slot) => void;
  readonly onFocus: (slot: Slot) => void;
}

const SLOTS: readonly Slot[] = ["p1", "p2"];

export function SlotBar({ active, names, onClear, onFocus }: SlotBarProps) {
  return (
    <div className="slot-bar">
      {SLOTS.map((slot) => {
        const label = slot.toUpperCase();
        const name = names[slot];

        return (
          <div className={`slot-bar__slot slot-bar__slot--${slot}`} key={slot}>
            <button
              aria-label={`${label}: ${name ?? "empty"}`}
              aria-pressed={active === slot}
              className="slot-bar__focus"
              onClick={() => {
                onFocus(slot);
              }}
              type="button"
            >
              <span className="slot-bar__label">{label}</span>
              <span className="slot-bar__name">
                {name ?? "Select a monster"}
              </span>
            </button>
            {name && (
              <button
                aria-label={`Clear ${label}`}
                className="slot-bar__clear"
                onClick={() => {
                  onClear(slot);
                }}
                type="button"
              >
                ✕
              </button>
            )}
            {active === slot && (
              <span aria-hidden="true" className="slot-bar__cursor">
                ▼ picking
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
