import { NavLink, Outlet } from "react-router";

export function AppLayout() {
  return (
    <>
      <header className="app-header">
        <NavLink className="app-brand" to="/">
          Beast Clash
        </NavLink>
        <nav aria-label="Main">
          <ul className="app-nav">
            <li>
              <NavLink to="/monsters">Monsters</NavLink>
            </li>
            <li>
              <NavLink to="/battles">Battles</NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
