import type { Battle, BattleParticipant, BattleTurn } from "../battle.types";

export const REPLAY_SPEEDS = [1, 2, 4] as const;

export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

export type ReplayStatus = "finished" | "idle" | "paused" | "playing";

export type FighterSlot = "a" | "b";

export interface ReplayFighter {
  readonly hp: number;
  readonly id: string;
  readonly imageUrl: string;
  readonly maxHp: number;
  readonly name: string;
}

export interface ReplayState {
  readonly currentTurn: BattleTurn | null;
  readonly fighters: Readonly<Record<FighterSlot, ReplayFighter>>;
  readonly nextTurnIndex: number;
  readonly speed: ReplaySpeed;
  readonly status: ReplayStatus;
  readonly turns: readonly BattleTurn[];
  readonly winnerId: string;
}

export type ReplayEvent
  = | { readonly speed: ReplaySpeed; readonly type: "setSpeed" }
    | { readonly type: "pause" }
    | { readonly type: "play" }
    | { readonly type: "restart" }
    | { readonly type: "skip" }
    | { readonly type: "step" };

export class InvalidReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidReplayError";
  }
}

function toFighter(participant: BattleParticipant): ReplayFighter {
  return {
    hp: participant.hp,
    id: participant.id,
    imageUrl: participant.imageUrl,
    maxHp: participant.hp,
    name: participant.name,
  };
}

function assertValidBattle(battle: Battle): void {
  const { monsterA, monsterB, turns } = battle;
  const ids = new Set([monsterA.id, monsterB.id]);

  if (ids.size !== 2)
    throw new InvalidReplayError("Both participants have the same id");
  if (turns.length === 0) throw new InvalidReplayError("Battle has no turns");
  if (turns.length !== battle.totalTurns) {
    throw new InvalidReplayError(
      `Battle reports ${String(battle.totalTurns)} turns but contains ${String(turns.length)}`,
    );
  }

  for (const [index, turn] of turns.entries()) {
    if (turn.turn !== index + 1) {
      throw new InvalidReplayError(
        `Turn at position ${String(index)} is numbered ${String(turn.turn)}`,
      );
    }
    if (
      !ids.has(turn.attackerId)
      || !ids.has(turn.defenderId)
      || turn.attackerId === turn.defenderId
    ) {
      throw new InvalidReplayError(
        `Turn ${String(turn.turn)} has invalid participants`,
      );
    }
  }

  const lastTurn = turns.at(-1);
  if (
    lastTurn?.attackerId !== battle.winnerId
    || lastTurn.defenderId !== battle.loserId
    || lastTurn.defenderHpAfter !== 0
  ) {
    throw new InvalidReplayError("Last turn does not match the battle result");
  }
}

export function createReplayState(
  battle: Battle,
  speed: ReplaySpeed = 1,
): ReplayState {
  assertValidBattle(battle);

  return {
    currentTurn: null,
    fighters: { a: toFighter(battle.monsterA), b: toFighter(battle.monsterB) },
    nextTurnIndex: 0,
    speed,
    status: "idle",
    turns: battle.turns,
    winnerId: battle.winnerId,
  };
}

function isFinished(state: ReplayState): boolean {
  return state.nextTurnIndex >= state.turns.length;
}

function applyNextTurn(state: ReplayState): ReplayState {
  const turn = state.turns[state.nextTurnIndex];
  if (!turn) return state;

  const slot: FighterSlot = state.fighters.a.id === turn.defenderId ? "a" : "b";
  const nextTurnIndex = state.nextTurnIndex + 1;
  const finished = nextTurnIndex >= state.turns.length;

  return {
    ...state,
    currentTurn: turn,
    fighters: {
      ...state.fighters,
      [slot]: { ...state.fighters[slot], hp: turn.defenderHpAfter },
    },
    nextTurnIndex,
    status: finished ? "finished" : state.status,
  };
}

/**
 * Pure reducer: invalid transitions return the same state reference,
 * so React skips the re-render.
 */
export function replayReducer(
  state: ReplayState,
  event: ReplayEvent,
): ReplayState {
  switch (event.type) {
    case "pause": {
      return state.status === "playing"
        ? { ...state, status: "paused" }
        : state;
    }
    case "play": {
      return state.status === "idle" || state.status === "paused"
        ? { ...state, status: "playing" }
        : state;
    }
    case "restart": {
      if (state.nextTurnIndex === 0 && state.status === "idle") return state;
      return {
        ...state,
        currentTurn: null,
        fighters: {
          a: { ...state.fighters.a, hp: state.fighters.a.maxHp },
          b: { ...state.fighters.b, hp: state.fighters.b.maxHp },
        },
        nextTurnIndex: 0,
        status: "idle",
      };
    }
    case "setSpeed": {
      return state.speed === event.speed
        ? state
        : { ...state, speed: event.speed };
    }
    case "skip": {
      let next = state;
      while (!isFinished(next)) next = applyNextTurn(next);
      return next;
    }
    case "step": {
      if (isFinished(state)) return state;
      // stepping from the start is manual control, so it behaves like a paused replay
      const base
        = state.status === "idle"
          ? { ...state, status: "paused" as const }
          : state;
      return applyNextTurn(base);
    }
  }
}

export function selectWinner(state: ReplayState): ReplayFighter | null {
  if (state.status !== "finished") return null;
  return state.fighters.a.id === state.winnerId
    ? state.fighters.a
    : state.fighters.b;
}

export function selectProgress(state: ReplayState): number {
  return state.nextTurnIndex / state.turns.length;
}
