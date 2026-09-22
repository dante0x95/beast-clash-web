import { NavLink, Outlet } from "react-router";

import "./AppLayout.css";

export function AppLayout() {
  return (
    <>
      <header className="app-header">
        <NavLink className="app-header__brand" to="/">
          Beast Clash
        </NavLink>
        <nav aria-label="Main">
          <ul className="app-header__nav">
            <li>
              <NavLink className="app-header__nav-link" to="/monsters">
                Monsters
              </NavLink>
            </li>
            <li>
              <NavLink className="app-header__nav-link" to="/battles">
                Battles
              </NavLink>
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
