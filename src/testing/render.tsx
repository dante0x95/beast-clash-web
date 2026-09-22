import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";

import type { ReactElement } from "react";

export function renderWithQueryClient(ui: ReactElement): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      // no retries: a failing request should fail the test immediately
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
