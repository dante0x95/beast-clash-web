import { useMemo, useReducer } from "react";
import { Link } from "react-router";

import { useMonsters } from "../../monsters/monsters.api";
import { CharacterGrid } from "./CharacterGrid";
import { initialSelection, selectionReducer } from "./selection";
import { VersusPreview } from "./VersusPreview";

import "../../monsters/MonstersPage.css";

/** The API's maximum page size; enough for a select screen. */
const SELECT_PAGE_SIZE = 100;

export function CharacterSelectPage() {
  const { data, error, isPending } = useMonsters(1, SELECT_PAGE_SIZE);
  const [selection, dispatch] = useReducer(selectionReducer, initialSelection);

  const monstersById = useMemo(
    () => new Map(data?.items.map((monster) => [monster.id, monster])),
    [data],
  );

  const header = (
    <header className="monsters-page__header">
      <h1>Choose your fighters</h1>
      <Link to="/battles">◀ Back to battles</Link>
    </header>
  );

  if (isPending) {
    return (
      <section>
        {header}
        <p className="status-message">
          Waking up the server… first load can take a few seconds.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        {header}
        <p className="status-message" role="alert">
          {`Could not load monsters: ${error.message}`}
        </p>
      </section>
    );
  }

  if (data.total < 2) {
    return (
      <section>
        {header}
        <div className="status-message">
          <p>You need at least 2 monsters to start a battle.</p>
          <Link className="button" to="/monsters/new">
            + New monster
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      {header}
      <VersusPreview
        active={selection.active}
        onClear={(slot) => {
          dispatch({ slot, type: "clear" });
        }}
        onFocus={(slot) => {
          dispatch({ slot, type: "focusSlot" });
        }}
        p1={selection.p1 ? (monstersById.get(selection.p1) ?? null) : null}
        p2={selection.p2 ? (monstersById.get(selection.p2) ?? null) : null}
      />
      <CharacterGrid
        monsters={data.items}
        onPick={(monsterId) => {
          dispatch({ monsterId, type: "pick" });
        }}
        selection={selection}
      />
      {data.total > data.items.length && (
        <p className="status-message">{`Showing the first ${String(data.items.length)} of ${String(data.total)} monsters.`}</p>
      )}
    </section>
  );
}
