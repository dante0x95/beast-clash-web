import { Link } from "react-router";

import { MonsterList } from "./MonsterList";

import "./MonstersPage.css";

export function MonstersPage() {
  return (
    <section>
      <header className="monsters-page__header">
        <h1>Monsters</h1>
        <Link className="button" to="/monsters/new">
          + New monster
        </Link>
      </header>
      <MonsterList />
    </section>
  );
}
