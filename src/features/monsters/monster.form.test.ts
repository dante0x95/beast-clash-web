import { describe, expect, it } from "vitest";

import { ApiError } from "../../api/api-error";
import {
  diffMonster,
  type MonsterFormValues,
  toFieldErrors,
  toFormValues,
  validateMonsterForm,
} from "./monster.form";

function makeValues(
  overrides: Partial<MonsterFormValues> = {},
): MonsterFormValues {
  return {
    attack: "45",
    defense: "20",
    hp: "120",
    imageUrl: "https://api.dicebear.com/10.x/bottts/svg?seed=Blaze",
    name: "Emberclaw",
    speed: "60",
    ...overrides,
  };
}

describe("validateMonsterForm", () => {
  it("converts valid input into the API request", () => {
    expect(
      validateMonsterForm(makeValues({ hp: " 120 ", name: "  Emberclaw  " })),
    ).toEqual({
      data: {
        attack: 45,
        defense: 20,
        hp: 120,
        imageUrl: "https://api.dicebear.com/10.x/bottts/svg?seed=Blaze",
        name: "Emberclaw",
        speed: 60,
      },
      success: true,
    });
  });

  it("accepts the limits", () => {
    const result = validateMonsterForm(
      makeValues({ attack: "0", defense: "100", hp: "1", speed: "100" }),
    );

    expect(result.success).toBe(true);
  });

  it.each<
    [string, Partial<MonsterFormValues>, keyof MonsterFormValues, string]
  >([
    ["an empty name", { name: "" }, "name", "Name is required"],
    ["a blank name", { name: "   " }, "name", "Name is required"],
    [
      "a long name",
      { name: "x".repeat(51) },
      "name",
      "Name must be at most 50 characters",
    ],
    ["an empty hp", { hp: "" }, "hp", "HP is required"],
    ["a non numeric hp", { hp: "abc" }, "hp", "HP must be a number"],
    [
      "a decimal attack",
      { attack: "1.5" },
      "attack",
      "Attack must be a whole number",
    ],
    ["hp below 1", { hp: "0" }, "hp", "HP must be at least 1"],
    ["hp above 1000", { hp: "1001" }, "hp", "HP must be at most 1000"],
    [
      "a negative defense",
      { defense: "-1" },
      "defense",
      "Defense must be at least 0",
    ],
    ["speed above 100", { speed: "101" }, "speed", "Speed must be at most 100"],
    [
      "an invalid url",
      { imageUrl: "not a url" },
      "imageUrl",
      "Image must be a valid http(s) URL",
    ],
    [
      "a non http url",
      { imageUrl: "ftp://example.com/a.png" },
      "imageUrl",
      "Image must be a valid http(s) URL",
    ],
  ])("rejects %s", (_label, overrides, field, message) => {
    expect(validateMonsterForm(makeValues(overrides))).toEqual({
      errors: { [field]: message },
      success: false,
    });
  });

  it("reports every invalid field at once", () => {
    const result = validateMonsterForm(
      makeValues({ hp: "", imageUrl: "", name: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success)
      expect(Object.keys(result.errors).sort()).toEqual([
        "hp",
        "imageUrl",
        "name",
      ]);
  });
});

describe("toFieldErrors", () => {
  it("maps API issues to fields and ignores unknown paths", () => {
    const error = new ApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        issues: [
          { message: "Too big", path: "hp" },
          { message: "Unknown", path: "hitPoints" },
          { message: "Second hp message", path: "hp" },
        ],
        message: "Invalid request",
      },
    });

    expect(toFieldErrors(error)).toEqual({ hp: "Too big" });
  });
});

describe("toFormValues", () => {
  it("turns a monster into input strings", () => {
    expect(
      toFormValues({
        attack: 45,
        defense: 20,
        hp: 120,
        imageUrl: "https://x.test/a.png",
        name: "Emberclaw",
        speed: 60,
      }),
    ).toEqual({
      attack: "45",
      defense: "20",
      hp: "120",
      imageUrl: "https://x.test/a.png",
      name: "Emberclaw",
      speed: "60",
    });
  });
});

describe("diffMonster", () => {
  const original = {
    attack: 45,
    defense: 20,
    hp: 120,
    imageUrl: "https://x.test/a.png",
    name: "Emberclaw",
    speed: 60,
  };

  it("returns only the fields that changed", () => {
    expect(
      diffMonster(original, { ...original, hp: 150, name: "Emberclaw II" }),
    ).toEqual({
      hp: 150,
      name: "Emberclaw II",
    });
  });

  it("returns an empty object when nothing changed", () => {
    expect(diffMonster(original, { ...original })).toEqual({});
  });

  it("detects a change to 0", () => {
    expect(diffMonster(original, { ...original, attack: 0 })).toEqual({
      attack: 0,
    });
  });
});
