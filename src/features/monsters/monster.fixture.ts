import type { Monster } from "./monsters.api";

export function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    attack: 40,
    createdAt: "2026-09-21T00:00:00.000Z",
    defense: 5,
    hp: 120,
    id: "01900000-0000-7000-8000-000000000001",
    imageUrl: "https://api.dicebear.com/10.x/bottts/png?seed=emberclaw",
    name: "Emberclaw",
    speed: 60,
    updatedAt: "2026-09-21T00:00:00.000Z",
    ...overrides,
  };
}
