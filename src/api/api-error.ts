interface ErrorBody {
  error: {
    code: string;
    issues?: { message: string; path: string }[];
    message: string;
  };
}

function isErrorBody(body: unknown): body is ErrorBody {
  if (typeof body !== "object" || body === null || !("error" in body))
    return false;
  const { error } = body;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}

export class ApiError extends Error {
  readonly code: string;
  readonly issues: { message: string; path: string }[];
  readonly status: number;

  constructor(status: number, body: unknown) {
    const parsed = isErrorBody(body)
      ? body.error
      : {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status ${String(status)}`,
        };
    super(parsed.message);
    this.name = "ApiError";
    this.status = status;
    this.code = parsed.code;
    this.issues = parsed.issues ?? [];
  }
}
