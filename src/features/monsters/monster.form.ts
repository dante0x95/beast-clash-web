import { z } from "zod";

import { MONSTER_LIMITS } from "./monster.limits";

import type { ApiError } from "../../api/api-error";
import type { components } from "../../api/schema";

export type CreateMonsterRequest
  = components["schemas"]["CreateMonsterRequest"];

export interface MonsterFormValues {
  attack: string;
  defense: string;
  hp: string;
  imageUrl: string;
  name: string;
  speed: string;
}

export type MonsterField = keyof MonsterFormValues;

export type MonsterFieldErrors = Partial<Record<MonsterField, string>>;

const MONSTER_FIELDS: readonly MonsterField[] = [
  "name",
  "hp",
  "attack",
  "defense",
  "speed",
  "imageUrl",
];

function integerField(
  label: string,
  { max, min }: { max: number; min: number },
) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .pipe(
      z.coerce
        .number<string>({ error: `${label} must be a number` })
        .int(`${label} must be a whole number`)
        .min(min, `${label} must be at least ${String(min)}`)
        .max(max, `${label} must be at most ${String(max)}`),
    );
}

export const monsterFormSchema = z.object({
  attack: integerField("Attack", MONSTER_LIMITS.attack),
  defense: integerField("Defense", MONSTER_LIMITS.defense),
  hp: integerField("HP", MONSTER_LIMITS.hp),
  imageUrl: z.url({
    error: "Image must be a valid http(s) URL",
    protocol: /^https?$/,
  }),
  name: z
    .string()
    .trim()
    .min(MONSTER_LIMITS.name.minLength, "Name is required")
    .max(
      MONSTER_LIMITS.name.maxLength,
      `Name must be at most ${String(MONSTER_LIMITS.name.maxLength)} characters`,
    ),
  speed: integerField("Speed", MONSTER_LIMITS.speed),
}) satisfies z.ZodType<CreateMonsterRequest, MonsterFormValues>;

export type MonsterFormResult
  = | { readonly data: CreateMonsterRequest; readonly success: true }
    | { readonly errors: MonsterFieldErrors; readonly success: false };

function isMonsterField(path: string): path is MonsterField {
  return (MONSTER_FIELDS as readonly string[]).includes(path);
}

export function validateMonsterForm(
  values: MonsterFormValues,
): MonsterFormResult {
  const result = monsterFormSchema.safeParse(values);
  if (result.success) return { data: result.data, success: true };

  const errors: MonsterFieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    if (isMonsterField(field)) errors[field] ??= issue.message;
  }
  return { errors, success: false };
}

export function toFieldErrors(error: ApiError): MonsterFieldErrors {
  const errors: MonsterFieldErrors = {};
  for (const issue of error.issues) {
    if (isMonsterField(issue.path)) errors[issue.path] ??= issue.message;
  }
  return errors;
}

export function toFormValues(monster: CreateMonsterRequest): MonsterFormValues {
  return {
    attack: String(monster.attack),
    defense: String(monster.defense),
    hp: String(monster.hp),
    imageUrl: monster.imageUrl,
    name: monster.name,
    speed: String(monster.speed),
  };
}
