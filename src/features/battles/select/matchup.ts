import type { Slot } from "./selection";

/**
 * Mirror of the API's battle rules, used only to preview a matchup.
 * The API simulates the real battle and remains the source of truth.
 */
export const MIN_DAMAGE = 1;

interface Combatant {
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
}

export function damagePerHit(attacker: Combatant, defender: Combatant): number {
  return Math.max(MIN_DAMAGE, attacker.attack - defender.defense);
}

/** Higher speed strikes first; ties go to higher attack; a full tie goes to P1 (monster A). */
export function firstStriker(p1: Combatant, p2: Combatant): Slot {
  if (p1.speed !== p2.speed) return p1.speed > p2.speed ? "p1" : "p2";
  if (p1.attack !== p2.attack) return p1.attack > p2.attack ? "p1" : "p2";
  return "p1";
}
