import { Link } from "react-router";

import { MonsterPortrait } from "../../monsters/MonsterPortrait";

import type { BattleParticipant, BattleSummary } from "../battle.types";
import type { ReactNode } from "react";

import "./BattleHistoryCard.css";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface BattleHistoryCardProps {
  /** Extra actions next to Replay (e.g. delete). */
  readonly actions?: ReactNode;
  readonly battle: BattleSummary;
}

interface FighterProps {
  readonly fighter: BattleParticipant;
  readonly isWinner: boolean;
  readonly slot: "p1" | "p2";
}

function Fighter({ fighter, isWinner, slot }: FighterProps) {
  const result = isWinner ? "winner" : "loser";

  return (
    <div
      className={`battle-history-card__fighter battle-history-card__fighter--${slot} battle-history-card__fighter--${result}`}
    >
      <MonsterPortrait name={fighter.name} size={56} src={fighter.imageUrl} />
      <div className="battle-history-card__fighter-info">
        <span className="battle-history-card__name">{fighter.name}</span>
        <span className="battle-history-card__result">
          {isWinner ? "Winner" : "Loser"}
        </span>
      </div>
    </div>
  );
}

export function BattleHistoryCard({ actions, battle }: BattleHistoryCardProps) {
  const { createdAt, id, monsterA, monsterB, totalTurns, winnerId } = battle;
  const title = `${monsterA.name} vs ${monsterB.name}`;

  return (
    <article aria-label={title} className="battle-history-card">
      <div className="battle-history-card__matchup">
        <Fighter
          fighter={monsterA}
          isWinner={winnerId === monsterA.id}
          slot="p1"
        />
        <span aria-hidden="true" className="battle-history-card__versus">
          VS
        </span>
        <Fighter
          fighter={monsterB}
          isWinner={winnerId === monsterB.id}
          slot="p2"
        />
      </div>

      <footer className="battle-history-card__footer">
        <span className="battle-history-card__meta">
          {`${String(totalTurns)} ${totalTurns === 1 ? "turn" : "turns"} · `}
          <time dateTime={createdAt}>
            {dateFormat.format(new Date(createdAt))}
          </time>
        </span>
        <div className="battle-history-card__actions">
          <Link
            aria-label={`Replay ${title}`}
            className="battle-history-card__action"
            to={`/battles/${id}`}
          >
            ▶ Replay
          </Link>
          {actions}
        </div>
      </footer>
    </article>
  );
}
