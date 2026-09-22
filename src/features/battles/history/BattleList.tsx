import { useState } from "react";

import { ConfirmDialog } from "../../../shared/ConfirmDialog";
import { Pagination } from "../../../shared/Pagination";
import { usePageParam } from "../../../shared/use-page-param";
import { BATTLES_PAGE_SIZE, useBattles, useDeleteBattle } from "../battles.api";
import { BattleHistoryCard } from "./BattleHistoryCard";

import type { BattleSummary } from "../battle.types";

import "./BattleList.css";

export function BattleList() {
  const [page, setPage] = usePageParam();
  const { data, error, isPending } = useBattles(page);
  const deleteBattle = useDeleteBattle();
  const [battleToDelete, setBattleToDelete] = useState<BattleSummary | null>(
    null,
  );

  const closeDeleteDialog = (): void => {
    setBattleToDelete(null);
    deleteBattle.reset();
  };

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
            <BattleHistoryCard
              actions={(
                <button
                  aria-label={`Delete ${battle.monsterA.name} vs ${battle.monsterB.name}`}
                  className="battle-history-card__action battle-history-card__action--danger"
                  onClick={() => {
                    setBattleToDelete(battle);
                  }}
                  type="button"
                >
                  ✖ Delete
                </button>
              )}
              battle={battle}
            />
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
      {battleToDelete && (
        <ConfirmDialog
          confirmLabel="Delete"
          error={
            deleteBattle.error
              ? `Could not delete: ${deleteBattle.error.message}`
              : null
          }
          isPending={deleteBattle.isPending}
          onCancel={closeDeleteDialog}
          onConfirm={() => {
            deleteBattle.mutate(battleToDelete.id, {
              onSuccess: closeDeleteDialog,
            });
          }}
          title="Delete battle?"
        >
          <p>
            <strong>{`${battleToDelete.monsterA.name} vs ${battleToDelete.monsterB.name}`}</strong>
            {
              " will be permanently removed from the history. This cannot be undone."
            }
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
