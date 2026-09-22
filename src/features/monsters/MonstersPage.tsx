import { MonsterList } from "./MonsterList";

import "./MonstersPage.css";

export function MonstersPage() {
  return (
    <section>
      <header className="monsters-page__header">
        <h1>Monsters</h1>
      </header>
      <MonsterList />
    </section>
  );
}
