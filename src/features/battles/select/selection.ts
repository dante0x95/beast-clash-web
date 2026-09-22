export type Slot = "p1" | "p2";

export interface SelectionState {
  /** Slot that the next pick fills. */
  readonly active: Slot;
  readonly p1: string | null;
  readonly p2: string | null;
}

export type SelectionEvent
  = | { readonly monsterId: string; readonly type: "pick" }
    | { readonly slot: Slot; readonly type: "clear" }
    | { readonly slot: Slot; readonly type: "focusSlot" }
    | { readonly type: "reset" };

export const initialSelection: SelectionState = {
  active: "p1",
  p1: null,
  p2: null,
};

export function otherSlot(slot: Slot): Slot {
  return slot === "p1" ? "p2" : "p1";
}

/** Pure reducer; invalid moves return the same reference so React skips the render. */
export function selectionReducer(
  state: SelectionState,
  event: SelectionEvent,
): SelectionState {
  switch (event.type) {
    case "clear": {
      if (state[event.slot] === null && state.active === event.slot)
        return state;
      return { ...state, active: event.slot, [event.slot]: null };
    }
    case "focusSlot": {
      return state.active === event.slot
        ? state
        : { ...state, active: event.slot };
    }
    case "pick": {
      const other = otherSlot(state.active);
      // a monster cannot fight itself, and re-picking the same one changes nothing
      if (
        state[other] === event.monsterId
        || state[state.active] === event.monsterId
      )
        return state;

      const next = { ...state, [state.active]: event.monsterId };
      // like an arcade select screen: once P1 locks in, the cursor moves to P2
      return next[other] === null ? { ...next, active: other } : next;
    }
    case "reset": {
      return initialSelection;
    }
  }
}

export function slotOf(state: SelectionState, monsterId: string): Slot | null {
  if (state.p1 === monsterId) return "p1";
  if (state.p2 === monsterId) return "p2";
  return null;
}

export function isComplete(
  state: SelectionState,
): state is SelectionState & { p1: string; p2: string } {
  return state.p1 !== null && state.p2 !== null;
}
