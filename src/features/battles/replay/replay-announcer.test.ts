import { describe, expect, it } from "vitest";

import { makeBattle } from "../battle.fixture";
import { createReplayState, replayReducer } from "./replay";
import { describeReplay } from "./replay-announcer";

describe("describeReplay", () => {
  const initial = createReplayState(makeBattle());

  it("announces nothing before the first turn", () => {
    expect(describeReplay(initial)).toBe("");
  });

  it("describes the last resolved turn with the HP from the API", () => {
    const state = replayReducer(initial, { type: "step" });

    expect(describeReplay(state)).toBe(
      "Turn 1 of 6: Voltwing hits Emberclaw for 35 damage. Emberclaw has 85 HP left.",
    );
  });

  it("adds the knockout and the winner on the last turn", () => {
    const state = replayReducer(initial, { type: "skip" });

    expect(describeReplay(state)).toBe(
      "Turn 6 of 6: Emberclaw hits Voltwing for 35 damage. Voltwing has 0 HP left. Voltwing is knocked out. Emberclaw wins!",
    );
  });

  it("goes quiet again after a restart", () => {
    const finished = replayReducer(initial, { type: "skip" });

    expect(describeReplay(replayReducer(finished, { type: "restart" }))).toBe(
      "",
    );
  });
});
