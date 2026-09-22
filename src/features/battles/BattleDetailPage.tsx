import { Link, useParams } from "react-router";

import { ApiError } from "../../api/api-error";
import { BattleArena } from "./arena/BattleArena";
import { useBattle } from "./battles.api";

function isNotFound(error: Error): boolean {
  return (
    error instanceof ApiError && (error.status === 400 || error.status === 404)
  );
}

export function BattleDetailPage() {
  const { battleId = "" } = useParams<"battleId">();
  const battle = useBattle(battleId);

  const header = (
    <header>
      <h1>Battle</h1>
      <Link to="/battles">◀ Back to battles</Link>
    </header>
  );

  if (battle.isPending) {
    return (
      <section>
        {header}
        <p className="status-message">Loading battle…</p>
      </section>
    );
  }

  if (battle.error) {
    return (
      <section>
        {header}
        <p className="status-message" role="alert">
          {isNotFound(battle.error)
            ? "Battle not found."
            : `Could not load the battle: ${battle.error.message}`}
        </p>
      </section>
    );
  }

  return (
    <section>
      {header}

      <BattleArena battle={battle.data} key={battle.data.id} />
    </section>
  );
}
