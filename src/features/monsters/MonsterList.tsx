import { useState } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "../../shared/ConfirmDialog";
import { Pagination } from "../../shared/Pagination";
import { usePageParam } from "../../shared/use-page-param";
import { MonsterCard } from "./MonsterCard";
import {
  type Monster,
  MONSTERS_PAGE_SIZE,
  useDeleteMonster,
  useMonsters,
} from "./monsters.api";

import "./MonsterList.css";

export function MonsterList() {
  const [page, setPage] = usePageParam();
  const { data, error, isPending } = useMonsters(page);
  const deleteMonster = useDeleteMonster();
  const [monsterToDelete, setMonsterToDelete] = useState<Monster | null>(null);

  const closeDeleteDialog = (): void => {
    setMonsterToDelete(null);
    deleteMonster.reset();
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
        {`Could not load monsters: ${error.message}`}
      </p>
    );
  }
  if (data.total === 0) {
    return <p className="status-message">No monsters yet.</p>;
  }
  if (data.items.length === 0) {
    // e.g. ?page=9 typed by hand, or the last item of the last page was deleted
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
      <ul className="monster-list__grid">
        {data.items.map((monster) => (
          <li key={monster.id}>
            <MonsterCard
              actions={(
                <>
                  <Link
                    aria-label={`Edit ${monster.name}`}
                    className="monster-card__action"
                    to={`/monsters/${monster.id}/edit`}
                  >
                    ✎ Edit
                  </Link>
                  <button
                    aria-label={`Delete ${monster.name}`}
                    className="monster-card__action monster-card__action--danger"
                    onClick={() => {
                      setMonsterToDelete(monster);
                    }}
                    type="button"
                  >
                    ✖ Delete
                  </button>
                </>
              )}
              monster={monster}
            />
          </li>
        ))}
      </ul>
      <Pagination
        label="Monsters pages"
        onPageChange={setPage}
        page={page}
        pageSize={MONSTERS_PAGE_SIZE}
        total={data.total}
      />
      {monsterToDelete && (
        <ConfirmDialog
          confirmLabel="Delete"
          error={
            deleteMonster.error
              ? `Could not delete: ${deleteMonster.error.message}`
              : null
          }
          isPending={deleteMonster.isPending}
          onCancel={closeDeleteDialog}
          onConfirm={() => {
            deleteMonster.mutate(monsterToDelete.id, {
              onSuccess: closeDeleteDialog,
            });
          }}
          title="Delete monster?"
        >
          <p>
            <strong>{monsterToDelete.name}</strong>
            {
              " will be removed from the list. Past battles keep their record of it."
            }
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
