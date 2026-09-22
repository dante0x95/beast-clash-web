import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderRoute } from "../../testing/render";
import { makeBattle } from "./battle.fixture";

import type { Battle } from "./battle.types";

vi.mock("../../api/client", () => ({
  api: {
    GET: vi.fn(),
  },
}));

vi.mock("./arena/BattleArena", () => ({
  BattleArena: ({ battle }: { readonly battle: Battle }) => (
    <div
      aria-label={`${battle.monsterA.name} versus ${battle.monsterB.name}`}
      role="region"
    >
      Battle arena
    </div>
  ),
}));

const getMock = vi.mocked(api.GET);

type GetResult = Awaited<ReturnType<typeof api.GET>>;

describe("BattleDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the battle and renders the arena", async () => {
    const battle = makeBattle();

    getMock.mockResolvedValue({
      data: battle,
      response: new Response(null, { status: 200 }),
    } as GetResult);

    renderRoute(`/battles/${battle.id}`);

    expect(
      await screen.findByRole("region", {
        name: `${battle.monsterA.name} versus ${battle.monsterB.name}`,
      }),
    ).toBeInTheDocument();

    expect(getMock).toHaveBeenCalledWith(
      "/battles/{id}",
      expect.objectContaining({
        params: {
          path: {
            id: battle.id,
          },
        },
      }),
    );
  });

  it("shows not found when the battle does not exist", async () => {
    const battle = makeBattle();

    getMock.mockResolvedValue({
      error: {
        error: {
          code: "NOT_FOUND",
          message: "Battle not found",
        },
      },
      response: new Response(null, { status: 404 }),
    } as GetResult);

    renderRoute(`/battles/${battle.id}`);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Battle not found.",
    );
  });
});
