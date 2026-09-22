import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "../../api/api-error";
import { diffMonster, toFormValues } from "./monster.form";
import { MonsterForm } from "./MonsterForm";
import { useMonster, useUpdateMonster } from "./monsters.api";

import "./MonstersPage.css";

function isNotFound(error: Error): boolean {
  // 400 = malformed id in the URL; for the user it is the same as a missing monster
  return (
    error instanceof ApiError && (error.status === 404 || error.status === 400)
  );
}

export function MonsterEditPage() {
  const { monsterId = "" } = useParams<"monsterId">();
  const navigate = useNavigate();
  const monster = useMonster(monsterId);
  const updateMonster = useUpdateMonster(monsterId);

  const header = (
    <header className="monsters-page__header">
      <h1>Edit Monster</h1>
      <Link to="/monsters">◀ Back to monsters</Link>
    </header>
  );

  if (monster.isPending) {
    return (
      <section>
        {header}
        <p className="status-message">Loading monster…</p>
      </section>
    );
  }

  if (monster.error) {
    return (
      <section>
        {header}
        <p className="status-message" role="alert">
          {isNotFound(monster.error)
            ? "Monster not found."
            : `Could not load the monster: ${monster.error.message}`}
        </p>
      </section>
    );
  }

  const original = monster.data;

  return (
    <section>
      {header}
      <MonsterForm
        // remount with fresh values if the route changes to another monster
        initialValues={toFormValues(original)}
        isSubmitting={updateMonster.isPending}
        key={original.id}
        onSubmit={async (values) => {
          const changes = diffMonster(original, values);
          // the API rejects an empty PATCH; nothing changed means nothing to save
          if (Object.keys(changes).length > 0)
            await updateMonster.mutateAsync(changes);
          await navigate("/monsters");
        }}
        submitLabel="Save changes"
      />
    </section>
  );
}
