import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../api/client";
import { renderRoute } from "../../../testing/render";
import { makeBattleSummary, VOLTWING_ID } from "../battle.fixture";

import type { BattleSummary } from "../battle.types";

vi.mock("../../../api/client", () => ({
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

function page(items: BattleSummary[], total = items.length, pageNumber = 1) {
  return { items, page: pageNumber, pageSize: 10, total };
}

describe("BattleList", () => {
  afterEach(() => {
    getMock.mockReset();
  });

  it("shows each battle with its winner, loser and turn count", async () => {
    respondWith(200, page([makeBattleSummary()]));

    renderRoute("/battles");

    const card = await screen.findByRole("article", {
      name: "Emberclaw vs Voltwing",
    });
    const emberclaw = within(card).getByText("Emberclaw").closest("div");
    const voltwing = within(card).getByText("Voltwing").closest("div");

    expect(emberclaw).toHaveTextContent("Winner");
    expect(voltwing).toHaveTextContent("Loser");
    expect(card).toHaveTextContent("6 turns");
    expect(card.querySelector("time")).toHaveAttribute(
      "dateTime",
      "2026-09-21T00:00:00.000Z",
    );
  });

  it("marks the winner correctly when monster B wins", async () => {
    const battle = makeBattleSummary();
    respondWith(
      200,
      page([{ ...battle, loserId: battle.monsterA.id, winnerId: VOLTWING_ID }]),
    );

    renderRoute("/battles");

    const card = await screen.findByRole("article", {
      name: "Emberclaw vs Voltwing",
    });

    expect(within(card).getByText("Voltwing").closest("div")).toHaveTextContent(
      "Winner",
    );
    expect(
      within(card).getByText("Emberclaw").closest("div"),
    ).toHaveTextContent("Loser");
  });

  it("links each battle to its replay", async () => {
    respondWith(200, page([makeBattleSummary()]));

    renderRoute("/battles");

    expect(
      await screen.findByRole("link", { name: "Replay Emberclaw vs Voltwing" }),
    ).toHaveAttribute("href", `/battles/${makeBattleSummary().id}`);
  });

  it("requests the page from the URL", async () => {
    respondWith(200, page([makeBattleSummary()], 25, 2));

    renderRoute("/battles?page=2");

    await screen.findByRole("article", { name: "Emberclaw vs Voltwing" });

    expect(getMock).toHaveBeenCalledWith(
      "/battles",
      expect.objectContaining({
        params: { query: { page: 2, pageSize: 10 } },
      }),
    );
    expect(
      screen.getByRole("navigation", { name: "Battles pages" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no battles", async () => {
    respondWith(200, page([]));

    renderRoute("/battles");

    expect(
      await screen.findByText("No battles yet. Start one!"),
    ).toBeInTheDocument();
  });

  it("offers a way back when the page is out of range", async () => {
    const user = userEvent.setup();
    respondWith(200, page([], 3, 9));

    renderRoute("/battles?page=9");

    await user.click(
      await screen.findByRole("button", { name: "Go to page 1" }),
    );

    expect(getMock).toHaveBeenLastCalledWith(
      "/battles",
      expect.objectContaining({
        params: { query: { page: 1, pageSize: 10 } },
      }),
    );
  });

  it("shows the API error message when the request fails", async () => {
    respondWith(500, { error: { code: "INTERNAL_ERROR", message: "boom" } });

    renderRoute("/battles");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load battles",
    );
  });
});
