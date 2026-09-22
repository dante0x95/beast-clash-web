import { isRouteErrorResponse, Link, useRouteError } from "react-router";

function describeError(error: unknown): string {
  if (isRouteErrorResponse(error))
    return `${String(error.status)} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <section role="alert">
      <h1>Something went wrong</h1>
      <p>{describeError(error)}</p>
      <Link to="/monsters">Back to monsters</Link>
    </section>
  );
}
