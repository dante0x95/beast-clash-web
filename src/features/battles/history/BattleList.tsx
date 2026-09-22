import { Pagination } from "../../../shared/Pagination";
import { usePageParam } from "../../../shared/use-page-param";
import { BATTLES_PAGE_SIZE, useBattles } from "../battles.api";
import { BattleHistoryCard } from "./BattleHistoryCard";

import "./BattleList.css";

export function BattleList() {
  const [page, setPage] = usePageParam();
  const { data, error, isPending } = useBattles(page);

  if (isPending) {
    return (
      <p className="status-message">
        Waking up the server… first load can take a few seconds.
      </p>
    );
  }
  if (error) {
    return (
      <p className="status-message" role="alert">
        {`Could not load battles: ${error.message}`}
      </p>
    );
  }
  if (data.total === 0) {
    return <p className="status-message">No battles yet. Start one!</p>;
  }
  if (data.items.length === 0) {
    // e.g. ?page=9 typed by hand, or the last battle of the last page was deleted
    return (
      <div className="status-message">
        <p>This page is empty.</p>
        <button
          className="button"
          onClick={() => {
            setPage(1);
          }}
          type="button"
        >
          Go to page 1
        </button>
      </div>
    );
  }

  return (
    <>
      <ul className="battle-list">
        {data.items.map((battle) => (
          <li key={battle.id}>
            <BattleHistoryCard battle={battle} />
          </li>
        ))}
      </ul>
      <Pagination
        label="Battles pages"
        onPageChange={setPage}
        page={page}
        pageSize={BATTLES_PAGE_SIZE}
        total={data.total}
      />
    </>
  );
}
