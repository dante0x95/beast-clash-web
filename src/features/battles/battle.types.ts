import type { components } from "../../api/schema";

export type Battle = components["schemas"]["Battle"];
export type BattleParticipant = Battle["monsterA"];
export type BattleTurn = Battle["turns"][number];
export type BattleSummary = components["schemas"]["BattleSummary"];
export type CreateBattleRequest = components["schemas"]["CreateBattleRequest"];
