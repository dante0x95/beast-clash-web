/** Mirror of the API's MONSTER_LIMITS; the API remains the source of truth. */
export const MONSTER_LIMITS = {
  attack: { max: 100, min: 0 },
  defense: { max: 100, min: 0 },
  hp: { max: 1000, min: 1 },
  name: { maxLength: 50, minLength: 1 },
  speed: { max: 100, min: 0 },
} as const;
