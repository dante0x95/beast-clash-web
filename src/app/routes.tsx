import { Navigate, type RouteObject } from "react-router";

import { BattlesPage } from "../features/battles/BattlesPage";
import { CharacterSelectPage } from "../features/battles/select/CharacterSelectPage.tsx";
import { MonsterCreatePage } from "../features/monsters/MonsterCreatePage.tsx";
import { MonsterEditPage } from "../features/monsters/MonsterEditPage.tsx";
import { MonstersPage } from "../features/monsters/MonstersPage";
import { AppLayout } from "./AppLayout";
import { NotFoundPage } from "./NotFoundPage";
import { RouteErrorPage } from "./RouteErrorPage";

export const routes: RouteObject[] = [
  {
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { element: <Navigate replace to="/monsters" />, index: true },
          { element: <MonstersPage />, path: "monsters" },
          { element: <MonsterCreatePage />, path: "monsters/new" },
          { element: <MonsterEditPage />, path: "monsters/:monsterId/edit" },
          { element: <CharacterSelectPage />, path: "battles/new" },
          { element: <BattlesPage />, path: "battles" },
          {
            // lazy: the replay will pull in Pixi, which should not weigh on the rest of the app
            lazy: async () => {
              const { BattleDetailPage }
                = await import("../features/battles/BattleDetailPage.tsx");
              return { Component: BattleDetailPage };
            },
            path: "battles/:battleId",
          },
          { element: <NotFoundPage />, path: "*" },
        ],
      },
    ],
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
  },
];
