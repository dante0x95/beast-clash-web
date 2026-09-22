import { describe, expect, it } from "vitest";

import { damagePerHit, firstStriker, MIN_DAMAGE } from "./matchup";

const fighter = (attack: number, defense: number, speed: number) => ({
  attack,
  defense,
  speed,
});

describe("damagePerHit", () => {
  it("is the attacker's attack minus the defender's defense", () => {
    expect(damagePerHit(fighter(50, 0, 0), fighter(0, 15, 0))).toBe(35);
  });

  it.each([
    ["equal", 20, 20],
    ["lower", 10, 45],
  ])(
    "never drops below the minimum when attack is %s than defense",
    (_label, attack, defense) => {
      expect(damagePerHit(fighter(attack, 0, 0), fighter(0, defense, 0))).toBe(
        MIN_DAMAGE,
      );
    },
  );
});

describe("firstStriker", () => {
  it("the faster monster strikes first", () => {
    expect(firstStriker(fighter(10, 0, 60), fighter(90, 0, 80))).toBe("p2");
    expect(firstStriker(fighter(10, 0, 90), fighter(90, 0, 80))).toBe("p1");
  });

  it("breaks a speed tie with attack", () => {
    expect(firstStriker(fighter(40, 0, 60), fighter(45, 0, 60))).toBe("p2");
    expect(firstStriker(fighter(50, 0, 60), fighter(45, 0, 60))).toBe("p1");
  });

  it("gives a full tie to P1", () => {
    expect(firstStriker(fighter(40, 0, 60), fighter(40, 0, 60))).toBe("p1");
  });
});
