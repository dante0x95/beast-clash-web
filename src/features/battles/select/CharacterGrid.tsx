import { MonsterPortrait } from "../../monsters/MonsterPortrait";
import { otherSlot, type SelectionState, slotOf } from "./selection";

import type { Monster } from "../../monsters/monsters.api";

import "./CharacterGrid.css";

interface CharacterGridProps {
  readonly monsters: readonly Monster[];
  readonly onPick: (monsterId: string) => void;
  readonly selection: SelectionState;
}

export function CharacterGrid({
  monsters,
  onPick,
  selection,
}: CharacterGridProps) {
  const lockedSlot = otherSlot(selection.active);

  return (
    <ul
      aria-label="Monsters"
      className="character-grid"
      data-active-slot={selection.active}
    >
      {monsters.map((monster) => {
        const slot = slotOf(selection, monster.id);
        const label = slot
          ? `${monster.name}, ${slot.toUpperCase()}`
          : monster.name;

        return (
          <li key={monster.id}>
            <button
              aria-label={label}
              aria-pressed={slot !== null}
              className={`character-grid__tile${slot ? ` character-grid__tile--${slot}` : ""}`}
              // the monster held by the other player cannot be picked again
              disabled={slot === lockedSlot}
              onClick={() => {
                onPick(monster.id);
              }}
              type="button"
            >
              {slot && (
                <span aria-hidden="true" className="character-grid__badge">
                  {slot.toUpperCase()}
                </span>
              )}
              <MonsterPortrait
                name={monster.name}
                size={80}
                src={monster.imageUrl}
              />
              <span aria-hidden="true" className="character-grid__name">
                {monster.name}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
