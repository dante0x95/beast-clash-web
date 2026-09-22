import { Link } from "react-router";

import { BattleList } from "./history/BattleList";

import "../monsters/MonstersPage.css";

export function BattlesPage() {
  return (
    <section>
      <header className="monsters-page__header">
        <h1>Battles</h1>
        <Link className="button" to="/battles/new">
          + New battle
        </Link>
      </header>
      <BattleList />
    </section>
  );
}
