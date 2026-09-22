import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "../app/routes";

import type { ReactElement } from "react";

function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // no retries: a failing request should fail the test immediately
      queries: { retry: false },
    },
  });
}

export function renderWithQueryClient(ui: ReactElement): RenderResult {
  return render(
    <QueryClientProvider client={makeTestQueryClient()}>
      {ui}
    </QueryClientProvider>,
  );
}

export function renderRoute(path: string): RenderResult {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
