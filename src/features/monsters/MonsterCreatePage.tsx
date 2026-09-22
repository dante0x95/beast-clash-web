import { Link, useNavigate } from "react-router";

import { MONSTER_GALLERY } from "./monster.gallery";
import { MonsterForm } from "./MonsterForm";
import { useCreateMonster } from "./monsters.api";

import type { MonsterFormValues } from "./monster.form";

import "./MonstersPage.css";

const INITIAL_VALUES: MonsterFormValues = {
  attack: "30",
  defense: "20",
  hp: "100",
  imageUrl: MONSTER_GALLERY[0]?.url ?? "",
  name: "",
  speed: "30",
};

export function MonsterCreatePage() {
  const navigate = useNavigate();
  const createMonster = useCreateMonster();

  return (
    <section>
      <header className="monsters-page__header">
        <h1>New Monster</h1>
        <Link to="/monsters">◀ Back to monsters</Link>
      </header>
      <MonsterForm
        initialValues={INITIAL_VALUES}
        isSubmitting={createMonster.isPending}
        onSubmit={async (monster) => {
          await createMonster.mutateAsync(monster);
          await navigate("/monsters");
        }}
        submitLabel="Create monster"
      />
    </section>
  );
}
