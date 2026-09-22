import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";

describe("ApiError", () => {
  it("reads code, message and issues from the API error body", () => {
    const error = new ApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        issues: [{ message: "Too small", path: "hp" }],
        message: "Invalid request",
      },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid request");
    expect(error.issues).toEqual([{ message: "Too small", path: "hp" }]);
  });

  it("defaults issues to an empty array when the body has none", () => {
    const error = new ApiError(404, { error: { code: "NOT_FOUND", message: "Monster not found" } });

    expect(error.issues).toEqual([]);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "Bad Gateway"],
    ["an unrelated object", { message: "nope" }],
    ["an error without code", { error: { message: "missing code" } }],
  ])("falls back to a generic error when the body is %s", (_label, body) => {
    const error = new ApiError(502, body);

    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.message).toBe("Request failed with status 502");
    expect(error.issues).toEqual([]);
  });
});
