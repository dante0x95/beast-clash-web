import { Link } from "react-router";

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
      <p>Battle history coming soon.</p>
    </section>
  );
}
