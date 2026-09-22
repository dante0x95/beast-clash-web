import { selectWinner } from "./replay";

import type { ReplayFighter, ReplayState } from "./replay";

function fighterById(state: ReplayState, id: string): ReplayFighter {
  return state.fighters.a.id === id ? state.fighters.a : state.fighters.b;
}

/**
 * Text for the screen-reader live region: the last resolved turn and, at the end, the result.
 * Empty before the first turn (and after a restart), so nothing is announced.
 */
export function describeReplay(state: ReplayState): string {
  const turn = state.currentTurn;

  if (!turn) {
    return "";
  }

  const attacker = fighterById(state, turn.attackerId);
  const defender = fighterById(state, turn.defenderId);

  const turnText = `Turn ${String(turn.turn)} of ${String(state.turns.length)}: ${attacker.name} hits ${defender.name} for ${String(turn.damage)} damage. ${defender.name} has ${String(turn.defenderHpAfter)} HP left.`;

  const winner = selectWinner(state);

  if (!winner) {
    return turnText;
  }

  return `${turnText} ${defender.name} is knocked out. ${winner.name} wins!`;
}
