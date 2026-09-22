import { MONSTER_LIMITS } from "../../monsters/monster.limits";
import { MonsterPortrait } from "../../monsters/MonsterPortrait";
import { StatBar } from "../../monsters/StatBar";

import type { Monster } from "../../monsters/monsters.api";
import type { Slot } from "./selection";

import "./FighterPanel.css";

interface FighterPanelProps {
  readonly active: boolean;
  /** Present only once both fighters are chosen. */
  readonly matchup: {
    readonly damage: number;
    readonly strikesFirst: boolean;
  } | null;
  readonly monster: Monster | null;
  readonly onClear: () => void;
  readonly onFocus: () => void;
  readonly slot: Slot;
}

export function FighterPanel({
  active,
  matchup,
  monster,
  onClear,
  onFocus,
  slot,
}: FighterPanelProps) {
  const label = slot.toUpperCase();

  return (
    <div
      aria-label={`${label} fighter`}
      className={`fighter-panel fighter-panel--${slot}${active ? " fighter-panel--active" : ""}`}
      role="group"
    >
      <div className="fighter-panel__header">
        <button
          aria-label={`${label}: ${monster?.name ?? "empty"}`}
          aria-pressed={active}
          className="fighter-panel__focus"
          onClick={onFocus}
          type="button"
        >
          <span className="fighter-panel__label">{label}</span>
          {active && (
            <span aria-hidden="true" className="fighter-panel__cursor">
              ▼ picking
            </span>
          )}
        </button>
        {monster && (
          <button
            aria-label={`Clear ${label}`}
            className="fighter-panel__clear"
            onClick={onClear}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {monster
        ? (
            <div className="fighter-panel__body">
              <MonsterPortrait
                name={monster.name}
                size={128}
                src={monster.imageUrl}
              />
              <p className="fighter-panel__name">{monster.name}</p>
              <div className="fighter-panel__stats">
                <StatBar
                  color="var(--color-hp)"
                  label="HP"
                  max={MONSTER_LIMITS.hp.max}
                  name="Health"
                  value={monster.hp}
                />
                <StatBar
                  color="var(--color-attack)"
                  label="ATK"
                  max={MONSTER_LIMITS.attack.max}
                  name="Attack"
                  value={monster.attack}
                />
                <StatBar
                  color="var(--color-defense)"
                  label="DEF"
                  max={MONSTER_LIMITS.defense.max}
                  name="Defense"
                  value={monster.defense}
                />
                <StatBar
                  color="var(--color-speed)"
                  label="SPD"
                  max={MONSTER_LIMITS.speed.max}
                  name="Speed"
                  value={monster.speed}
                />
              </div>
              {matchup && (
                <ul
                  aria-label={`${label} matchup`}
                  className="fighter-panel__matchup"
                >
                  <li>{`Hits for ${String(matchup.damage)}`}</li>
                  {matchup.strikesFirst && (
                    <li className="fighter-panel__first-strike">⚡ First strike</li>
                  )}
                </ul>
              )}
            </div>
          )
        : (
            <div className="fighter-panel__body fighter-panel__body--empty">
              <div aria-hidden="true" className="fighter-panel__placeholder">
                ?
              </div>
              <p className="fighter-panel__name">Select a monster</p>
            </div>
          )}
    </div>
  );
}
