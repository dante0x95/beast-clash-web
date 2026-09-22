import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../api/client";
import { renderRoute } from "../../../testing/render";
import { makeMonster } from "../../monsters/monster.fixture";

vi.mock("../../../api/client", () => ({
  api: { GET: vi.fn() },
}));

const getMock = vi.mocked(api.GET);

type GetResult = Awaited<ReturnType<typeof api.GET>>;

const monsters = [
  makeMonster({
    id: "01900000-0000-7000-8000-000000000001",
    name: "Emberclaw",
  }),
  makeMonster({ id: "01900000-0000-7000-8000-000000000002", name: "Voltwing" }),
  makeMonster({ id: "01900000-0000-7000-8000-000000000003", name: "Mirefang" }),
];

function mockMonsters(
  items: ReturnType<typeof makeMonster>[],
  total = items.length,
): void {
  getMock.mockResolvedValue({
    data: { items, page: 1, pageSize: 100, total },
    response: new Response(null, { status: 200 }),
  } as GetResult);
}

async function renderSelect() {
  const user = userEvent.setup();
  renderRoute("/battles/new");
  const grid = await screen.findByRole("list", { name: "Monsters" });
  return { grid, user };
}

describe("CharacterSelectPage", () => {
  beforeEach(() => {
    mockMonsters(monsters);
  });

  it("is reachable from the battles page", async () => {
    const user = userEvent.setup();
    renderRoute("/battles");

    await user.click(screen.getByRole("link", { name: "+ New battle" }));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Choose your fighters",
      }),
    ).toBeInTheDocument();
  });

  it("loads up to 100 monsters in one request", async () => {
    await renderSelect();

    expect(getMock).toHaveBeenCalledWith(
      "/monsters",
      expect.objectContaining({
        params: { query: { page: 1, pageSize: 100 } },
      }),
    );
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(
      monsters.length + 1,
    );
  });

  it("assigns the first pick to P1 and the second to P2", async () => {
    const { grid, user } = await renderSelect();

    await user.click(within(grid).getByRole("button", { name: "Emberclaw" }));
    expect(
      screen.getByRole("button", { name: "P1: Emberclaw" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "P2: empty" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(within(grid).getByRole("button", { name: "Voltwing" }));

    expect(
      within(grid).getByRole("button", { name: "Emberclaw, P1" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(grid).getByRole("button", { name: "Voltwing, P2" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("does not let P2 pick the monster chosen by P1", async () => {
    const { grid, user } = await renderSelect();

    await user.click(within(grid).getByRole("button", { name: "Emberclaw" }));

    expect(
      within(grid).getByRole("button", { name: "Emberclaw, P1" }),
    ).toBeDisabled();
  });

  it("lets the user switch slots and replace a pick", async () => {
    const { grid, user } = await renderSelect();
    await user.click(within(grid).getByRole("button", { name: "Emberclaw" }));
    await user.click(within(grid).getByRole("button", { name: "Voltwing" }));

    await user.click(screen.getByRole("button", { name: "P1: Emberclaw" }));
    await user.click(within(grid).getByRole("button", { name: "Mirefang" }));

    expect(
      screen.getByRole("button", { name: "P1: Mirefang" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "P2: Voltwing" }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole("button", { name: "Emberclaw" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("clears a slot", async () => {
    const { grid, user } = await renderSelect();
    await user.click(within(grid).getByRole("button", { name: "Emberclaw" }));

    await user.click(screen.getByRole("button", { name: "Clear P1" }));

    expect(screen.getByRole("button", { name: "P1: empty" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(grid).getByRole("button", { name: "Emberclaw" }),
    ).toBeEnabled();
  });

  it("asks for more monsters when there are fewer than two", async () => {
    mockMonsters([monsters[0] ?? makeMonster()]);

    renderRoute("/battles/new");

    expect(
      await screen.findByText(
        "You need at least 2 monsters to start a battle.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ New monster" })).toHaveAttribute(
      "href",
      "/monsters/new",
    );
  });

  it("warns when not every monster fits", async () => {
    mockMonsters(monsters, 150);

    await renderSelect();

    expect(
      screen.getByText("Showing the first 3 of 150 monsters."),
    ).toBeInTheDocument();
  });
});

describe("CharacterSelectPage: versus preview", () => {
  const emberclaw = makeMonster({
    attack: 50,
    defense: 10,
    hp: 120,
    id: "01900000-0000-7000-8000-00000000000a",
    name: "Emberclaw",
    speed: 60,
  });
  const voltwing = makeMonster({
    attack: 45,
    defense: 15,
    hp: 90,
    id: "01900000-0000-7000-8000-00000000000b",
    name: "Voltwing",
    speed: 80,
  });

  beforeEach(() => {
    mockMonsters([emberclaw, voltwing]);
  });

  it("shows two empty fighter panels before any pick", async () => {
    await renderSelect();

    expect(screen.getAllByText("Select a monster")).toHaveLength(2);
    expect(
      screen.queryByRole("list", { name: /matchup/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the picked monster's stats in its panel", async () => {
    const { grid, user } = await renderSelect();

    await user.click(within(grid).getByRole("button", { name: "Voltwing" }));

    const p1 = screen.getByRole("group", { name: "P1 fighter" });
    expect(
      within(p1).getByRole("img", { name: "Voltwing" }),
    ).toBeInTheDocument();
    expect(within(p1).getByRole("meter", { name: "Speed" })).toHaveAttribute(
      "aria-valuenow",
      "80",
    );
    expect(
      within(screen.getByRole("group", { name: "P2 fighter" })).getByText(
        "Select a monster",
      ),
    ).toBeInTheDocument();
  });

  it("previews damage per hit and who strikes first once both are chosen", async () => {
    const { grid, user } = await renderSelect();

    await user.click(within(grid).getByRole("button", { name: "Emberclaw" }));
    await user.click(within(grid).getByRole("button", { name: "Voltwing" }));

    const p1Matchup = screen.getByRole("list", { name: "P1 matchup" });
    const p2Matchup = screen.getByRole("list", { name: "P2 matchup" });
    expect(p1Matchup).toHaveTextContent("Hits for 35");
    expect(p1Matchup).not.toHaveTextContent("First strike");
    expect(p2Matchup).toHaveTextContent("Hits for 35");
    expect(p2Matchup).toHaveTextContent("First strike");
  });
});
