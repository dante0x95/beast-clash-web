import { FighterPanel } from "./FighterPanel";
import { damagePerHit, firstStriker } from "./matchup";

import type { Monster } from "../../monsters/monsters.api";
import type { Slot } from "./selection";

import "./VersusPreview.css";

interface VersusPreviewProps {
  readonly active: Slot;
  readonly onClear: (slot: Slot) => void;
  readonly onFocus: (slot: Slot) => void;
  readonly p1: Monster | null;
  readonly p2: Monster | null;
}

export function VersusPreview({
  active,
  onClear,
  onFocus,
  p1,
  p2,
}: VersusPreviewProps) {
  const striker = p1 && p2 ? firstStriker(p1, p2) : null;

  return (
    <div className="versus-preview">
      <FighterPanel
        active={active === "p1"}
        matchup={
          p1 && p2
            ? { damage: damagePerHit(p1, p2), strikesFirst: striker === "p1" }
            : null
        }
        monster={p1}
        onClear={() => {
          onClear("p1");
        }}
        onFocus={() => {
          onFocus("p1");
        }}
        slot="p1"
      />
      <p
        aria-hidden="true"
        className={`versus-preview__vs${p1 && p2 ? " versus-preview__vs--ready" : ""}`}
      >
        VS
      </p>
      <FighterPanel
        active={active === "p2"}
        matchup={
          p1 && p2
            ? { damage: damagePerHit(p2, p1), strikesFirst: striker === "p2" }
            : null
        }
        monster={p2}
        onClear={() => {
          onClear("p2");
        }}
        onFocus={() => {
          onFocus("p2");
        }}
        slot="p2"
      />
    </div>
  );
}
