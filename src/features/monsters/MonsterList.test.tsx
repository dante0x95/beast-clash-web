import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderWithQueryClient } from "../../testing/render";
import { makeMonster } from "./monster.fixture";
import { MonsterList } from "./MonsterList";

vi.mock("../../api/client", () => ({
  api: { GET: vi.fn() },
}));

const getMock = vi.mocked(api.GET);

function respondWith(status: number, body: unknown): void {
  const ok = status >= 200 && status < 300;
  getMock.mockResolvedValue({
    ...(ok ? { data: body } : { error: body }),
    response: new Response(null, { status }),
  } as Awaited<ReturnType<typeof api.GET>>);
}

describe("MonsterList", () => {
  afterEach(() => {
    getMock.mockReset();
  });

  it("renders every monster with its stats", async () => {
    respondWith(200, {
      items: [
        makeMonster(),
        makeMonster({ id: "01900000-0000-7000-8000-000000000002", name: "Voltwing", speed: 80 }),
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    });

    renderWithQueryClient(<MonsterList />);

    expect(await screen.findByRole("heading", { name: "Emberclaw" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Voltwing" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Voltwing" })).toHaveAttribute(
      "src",
      makeMonster().imageUrl,
    );
  });

  it("shows an empty state when there are no monsters", async () => {
    respondWith(200, { items: [], page: 1, pageSize: 20, total: 0 });

    renderWithQueryClient(<MonsterList />);

    expect(await screen.findByText("No monsters yet.")).toBeInTheDocument();
  });

  it("shows the API error message when the request fails", async () => {
    respondWith(429, { error: { code: "RATE_LIMITED", message: "Too many requests" } });

    renderWithQueryClient(<MonsterList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
  });

  it("requests the first page by default", async () => {
    respondWith(200, { items: [], page: 1, pageSize: 20, total: 0 });

    renderWithQueryClient(<MonsterList />);
    await screen.findByText("No monsters yet.");

    expect(getMock).toHaveBeenCalledWith(
      "/monsters",
      expect.objectContaining({ params: { query: { page: 1, pageSize: 20 } } }),
    );
  });
});
