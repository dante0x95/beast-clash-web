import { describe, expect, it } from "vitest";

import { EMBERCLAW_ID, makeBattle, VOLTWING_ID } from "../battle.fixture";
import {
  createReplayState,
  InvalidReplayError,
  type ReplayEvent,
  replayReducer,
  type ReplayState,
  selectProgress,
  selectWinner,
} from "./replay";

function run(state: ReplayState, ...events: ReplayEvent[]): ReplayState {
  return events.reduce(replayReducer, state);
}

const step: ReplayEvent = { type: "step" };

describe("createReplayState", () => {
  it("starts idle, before the first turn, with both fighters at full hp", () => {
    const state = createReplayState(makeBattle());

    expect(state).toMatchObject({
      currentTurn: null,
      fighters: {
        a: { hp: 120, id: EMBERCLAW_ID, maxHp: 120, name: "Emberclaw" },
        b: { hp: 90, id: VOLTWING_ID, maxHp: 90, name: "Voltwing" },
      },
      nextTurnIndex: 0,
      speed: 1,
      status: "idle",
    });
  });

  it("accepts an initial speed", () => {
    expect(createReplayState(makeBattle(), 4).speed).toBe(4);
  });

  it("does not mutate the battle", () => {
    const battle = makeBattle();
    const snapshot = structuredClone(battle);

    run(createReplayState(battle), { type: "skip" }, { type: "restart" });

    expect(battle).toEqual(snapshot);
  });

  describe("rejects inconsistent battles", () => {
    const battle = makeBattle();
    const [first, ...rest] = battle.turns;
    if (!first) throw new Error("Fixture must have turns");

    it.each([
      ["no turns", makeBattle({ totalTurns: 0, turns: [] })],
      ["a totalTurns mismatch", makeBattle({ totalTurns: 7 })],
      [
        "the same id on both sides",
        makeBattle({ monsterB: { ...battle.monsterB, id: EMBERCLAW_ID } }),
      ],
      [
        "non sequential turn numbers",
        makeBattle({ turns: [{ ...first, turn: 2 }, ...rest] }),
      ],
      [
        "an unknown attacker",
        makeBattle({ turns: [{ ...first, attackerId: "stranger" }, ...rest] }),
      ],
      [
        "a fighter attacking itself",
        makeBattle({ turns: [{ ...first, defenderId: VOLTWING_ID }, ...rest] }),
      ],
      [
        "a winner that did not land the last hit",
        makeBattle({ loserId: EMBERCLAW_ID, winnerId: VOLTWING_ID }),
      ],
    ])("%s", (_label, invalid) => {
      expect(() => createReplayState(invalid)).toThrow(InvalidReplayError);
    });
  });
});

describe("replayReducer", () => {
  describe("play / pause", () => {
    it("plays from idle and from paused", () => {
      const playing = run(createReplayState(makeBattle()), { type: "play" });
      expect(playing.status).toBe("playing");

      const resumed = run(playing, { type: "pause" }, { type: "play" });
      expect(resumed.status).toBe("playing");
    });

    it("pauses only while playing", () => {
      const idle = createReplayState(makeBattle());

      expect(replayReducer(idle, { type: "pause" })).toBe(idle);
      expect(run(idle, { type: "play" }, { type: "pause" }).status).toBe(
        "paused",
      );
    });

    it("ignores play once finished", () => {
      const finished = run(createReplayState(makeBattle()), { type: "skip" });

      expect(replayReducer(finished, { type: "play" })).toBe(finished);
    });
  });

  describe("step", () => {
    it("applies one turn: the defender takes the hit, the attacker is untouched", () => {
      const state = run(
        createReplayState(makeBattle()),
        { type: "play" },
        step,
      );

      expect(state.currentTurn).toMatchObject({
        attackerId: VOLTWING_ID,
        damage: 35,
        turn: 1,
      });
      expect(state.fighters.a.hp).toBe(85);
      expect(state.fighters.b.hp).toBe(90);
      expect(state.nextTurnIndex).toBe(1);
      expect(state.status).toBe("playing");
    });

    it("moves an idle replay to paused (manual stepping)", () => {
      expect(run(createReplayState(makeBattle()), step).status).toBe("paused");
    });

    it("finishes on the last turn with the loser at 0 hp", () => {
      const state = run(
        createReplayState(makeBattle()),
        { type: "play" },
        ...Array<ReplayEvent>(6).fill(step),
      );

      expect(state.status).toBe("finished");
      expect(state.currentTurn?.turn).toBe(6);
      expect(state.fighters.a.hp).toBe(15);
      expect(state.fighters.b.hp).toBe(0);
    });

    it("ignores steps once finished", () => {
      const finished = run(createReplayState(makeBattle()), { type: "skip" });

      expect(replayReducer(finished, step)).toBe(finished);
    });
  });

  describe("skip", () => {
    it("reaches the same state as stepping through every turn", () => {
      const initial = createReplayState(makeBattle());
      const stepped = run(initial, ...Array<ReplayEvent>(6).fill(step));
      const skipped = run(initial, { type: "skip" });

      expect(skipped).toEqual(stepped);
    });

    it("works from the middle of a replay", () => {
      const state = run(createReplayState(makeBattle()), step, step, {
        type: "skip",
      });

      expect(state.status).toBe("finished");
      expect(state.fighters.b.hp).toBe(0);
    });
  });

  describe("restart", () => {
    it("goes back to idle at full hp and keeps the speed", () => {
      const state = run(
        createReplayState(makeBattle()),
        { speed: 2, type: "setSpeed" },
        { type: "skip" },
        { type: "restart" },
      );

      expect(state).toEqual(createReplayState(makeBattle(), 2));
    });

    it("is a no-op when already at the start", () => {
      const idle = createReplayState(makeBattle());

      expect(replayReducer(idle, { type: "restart" })).toBe(idle);
    });
  });

  describe("setSpeed", () => {
    it("changes the speed without touching playback", () => {
      const playing = run(
        createReplayState(makeBattle()),
        { type: "play" },
        step,
      );
      const faster = replayReducer(playing, { speed: 4, type: "setSpeed" });

      expect(faster).toEqual({ ...playing, speed: 4 });
    });

    it("is a no-op for the current speed", () => {
      const idle = createReplayState(makeBattle());

      expect(replayReducer(idle, { speed: 1, type: "setSpeed" })).toBe(idle);
    });
  });
});

describe("selectors", () => {
  it("reports the winner only when finished", () => {
    const initial = createReplayState(makeBattle());

    expect(selectWinner(run(initial, step, step, step, step, step))).toBeNull();
    expect(selectWinner(run(initial, { type: "skip" }))).toMatchObject({
      id: EMBERCLAW_ID,
      name: "Emberclaw",
    });
  });

  it("the first attacker does not necessarily win", () => {
    const state = run(createReplayState(makeBattle()), { type: "skip" });

    expect(state.turns[0]?.attackerId).toBe(VOLTWING_ID);
    expect(selectWinner(state)?.id).toBe(EMBERCLAW_ID);
  });

  it("reports progress from 0 to 1", () => {
    const initial = createReplayState(makeBattle());

    expect(selectProgress(initial)).toBe(0);
    expect(selectProgress(run(initial, step, step, step))).toBe(0.5);
    expect(selectProgress(run(initial, { type: "skip" }))).toBe(1);
  });
});
