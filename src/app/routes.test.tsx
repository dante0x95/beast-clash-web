import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import { renderRoute } from "../testing/render";

vi.mock("../api/client", () => ({
  api: { GET: vi.fn() },
}));

describe("routes", () => {
  beforeEach(() => {
    vi.mocked(api.GET).mockResolvedValue({
      data: { items: [], page: 1, pageSize: 20, total: 0 },
      response: new Response(null, { status: 200 }),
    } as Awaited<ReturnType<typeof api.GET>>);
  });

  it("redirects the root path to the monsters page", async () => {
    renderRoute("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsters" }),
    ).toBeInTheDocument();
  });

  it("marks the current section as active in the navigation", async () => {
    renderRoute("/battles");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Battles" }),
    ).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelector("[aria-current='page']")).toHaveTextContent(
      "Battles",
    );
  });

  it("lazy loads the battle detail page with its id", async () => {
    renderRoute("/battles/01900000-0000-7000-8000-000000000001");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Battle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/01900000-0000-7000-8000-000000000001/),
    ).toBeInTheDocument();
  });

  it("shows the not found page for unknown paths, inside the layout", async () => {
    renderRoute("/does-not-exist");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Main" }),
    ).toBeInTheDocument();
  });
});
