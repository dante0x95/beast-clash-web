import { describe, expect, it } from "vitest";

import {
  initialSelection,
  isComplete,
  type SelectionEvent,
  selectionReducer,
  type SelectionState,
  slotOf,
} from "./selection";

function run(
  state: SelectionState,
  ...events: SelectionEvent[]
): SelectionState {
  return events.reduce(selectionReducer, state);
}

const pick = (monsterId: string): SelectionEvent => ({
  monsterId,
  type: "pick",
});

describe("selectionReducer", () => {
  it("starts empty with P1 active", () => {
    expect(initialSelection).toEqual({ active: "p1", p1: null, p2: null });
  });

  it("fills P1 first and moves the cursor to P2", () => {
    expect(run(initialSelection, pick("a"))).toEqual({
      active: "p2",
      p1: "a",
      p2: null,
    });
  });

  it("fills P2 next and keeps the cursor there", () => {
    expect(run(initialSelection, pick("a"), pick("b"))).toEqual({
      active: "p2",
      p1: "a",
      p2: "b",
    });
  });

  it("replaces the active slot when both are filled", () => {
    expect(run(initialSelection, pick("a"), pick("b"), pick("c"))).toEqual({
      active: "p2",
      p1: "a",
      p2: "c",
    });
  });

  it("does not let a monster fight itself", () => {
    const state = run(initialSelection, pick("a"));

    expect(selectionReducer(state, pick("a"))).toBe(state);
  });

  it("ignores re-picking the monster already in the active slot", () => {
    const state = run(initialSelection, pick("a"), pick("b"));

    expect(selectionReducer(state, pick("b"))).toBe(state);
  });

  it("focusing a slot makes the next pick replace it", () => {
    const state = run(
      initialSelection,
      pick("a"),
      pick("b"),
      { slot: "p1", type: "focusSlot" },
      pick("c"),
    );

    expect(state).toEqual({ active: "p1", p1: "c", p2: "b" });
  });

  it("focusing the active slot is a no-op", () => {
    expect(
      selectionReducer(initialSelection, { slot: "p1", type: "focusSlot" }),
    ).toBe(initialSelection);
  });

  it("clearing a slot empties it and makes it active", () => {
    const state = run(initialSelection, pick("a"), pick("b"), {
      slot: "p1",
      type: "clear",
    });

    expect(state).toEqual({ active: "p1", p1: null, p2: "b" });
  });

  it("clearing an empty active slot is a no-op", () => {
    expect(
      selectionReducer(initialSelection, { slot: "p1", type: "clear" }),
    ).toBe(initialSelection);
  });

  it("resets to the initial state", () => {
    expect(run(initialSelection, pick("a"), pick("b"), { type: "reset" })).toBe(
      initialSelection,
    );
  });
});

describe("selectors", () => {
  it("slotOf tells which slot holds a monster", () => {
    const state = run(initialSelection, pick("a"), pick("b"));

    expect(slotOf(state, "a")).toBe("p1");
    expect(slotOf(state, "b")).toBe("p2");
    expect(slotOf(state, "c")).toBeNull();
  });

  it("isComplete requires both slots", () => {
    expect(isComplete(run(initialSelection, pick("a")))).toBe(false);
    expect(isComplete(run(initialSelection, pick("a"), pick("b")))).toBe(true);
  });
});
