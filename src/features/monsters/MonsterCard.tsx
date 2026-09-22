import { MONSTER_LIMITS } from "./monster.limits"; ;
import { MonsterPortrait } from "./MonsterPortrait";
import { StatBar } from "./StatBar";

import type { Monster } from "./monsters.api";

import "./MonsterCard.css";

interface MonsterCardProps {
  readonly monster: Monster;
}

export function MonsterCard({ monster }: MonsterCardProps) {
  return (
    <article aria-labelledby={`monster-${monster.id}`} className="monster-card">
      <MonsterPortrait name={monster.name} src={monster.imageUrl} />
      <h3 className="monster-card__name" id={`monster-${monster.id}`}>
        {monster.name}
      </h3>
      <div className="monster-card__stats">
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
    </article>
  );
}
