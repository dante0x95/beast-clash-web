import type { Battle, BattleParticipant, BattleTurn } from "./battle.types";

export const EMBERCLAW_ID = "01900000-0000-7000-8000-00000000000a";
export const VOLTWING_ID = "01900000-0000-7000-8000-00000000000b";

export function makeParticipant(
  overrides: Partial<BattleParticipant> = {},
): BattleParticipant {
  return {
    attack: 50,
    defense: 10,
    hp: 120,
    id: EMBERCLAW_ID,
    imageUrl: "https://api.dicebear.com/10.x/bottts/png?seed=emberclaw",
    name: "Emberclaw",
    speed: 60,
    ...overrides,
  };
}

export function makeBattle(overrides: Partial<Battle> = {}): Battle {
  const turns: BattleTurn[] = [
    {
      attackerId: VOLTWING_ID,
      damage: 35,
      defenderHpAfter: 85,
      defenderId: EMBERCLAW_ID,
      turn: 1,
    },
    {
      attackerId: EMBERCLAW_ID,
      damage: 35,
      defenderHpAfter: 55,
      defenderId: VOLTWING_ID,
      turn: 2,
    },
    {
      attackerId: VOLTWING_ID,
      damage: 35,
      defenderHpAfter: 50,
      defenderId: EMBERCLAW_ID,
      turn: 3,
    },
    {
      attackerId: EMBERCLAW_ID,
      damage: 35,
      defenderHpAfter: 20,
      defenderId: VOLTWING_ID,
      turn: 4,
    },
    {
      attackerId: VOLTWING_ID,
      damage: 35,
      defenderHpAfter: 15,
      defenderId: EMBERCLAW_ID,
      turn: 5,
    },
    {
      attackerId: EMBERCLAW_ID,
      damage: 35,
      defenderHpAfter: 0,
      defenderId: VOLTWING_ID,
      turn: 6,
    },
  ];

  return {
    createdAt: "2026-09-21T00:00:00.000Z",
    id: "01900000-0000-7000-8000-0000000000ff",
    loserId: VOLTWING_ID,
    monsterA: makeParticipant(),
    monsterB: makeParticipant({
      attack: 45,
      defense: 15,
      hp: 90,
      id: VOLTWING_ID,
      imageUrl: "https://api.dicebear.com/10.x/bottts/png?seed=voltwing",
      name: "Voltwing",
      speed: 80,
    }),
    totalTurns: turns.length,
    turns,
    winnerId: EMBERCLAW_ID,
    ...overrides,
  };
}
