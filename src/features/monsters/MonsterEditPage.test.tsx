import { screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderRoute } from "../../testing/render";
import { makeMonster } from "./monster.fixture";

vi.mock("../../api/client", () => ({
  api: { GET: vi.fn(), PATCH: vi.fn() },
}));

const getMock = vi.mocked(api.GET);
const patchMock = vi.mocked(api.PATCH);

type GetResult = Awaited<ReturnType<typeof api.GET>>;

const monster = makeMonster();
const EDIT_PATH = `/monsters/${monster.id}/edit`;

function mockGet({ detailStatus = 200 }: { detailStatus?: number } = {}): void {
  getMock.mockImplementation((path) => {
    if (path === "/monsters/{id}") {
      return Promise.resolve(
        (detailStatus === 200
          ? { data: monster, response: new Response(null, { status: 200 }) }
          : {
              error: {
                error: { code: "NOT_FOUND", message: "Monster not found" },
              },
              response: new Response(null, { status: detailStatus }),
            }) as GetResult,
      );
    }
    return Promise.resolve({
      data: { items: [monster], page: 1, pageSize: 12, total: 1 },
      response: new Response(null, { status: 200 }),
    } as GetResult);
  });
}

async function replaceValue(
  user: UserEvent,
  input: HTMLElement,
  value: string,
): Promise<void> {
  await user.clear(input);
  await user.type(input, value);
}

describe("MonsterEditPage", () => {
  beforeEach(() => {
    mockGet();
    patchMock.mockResolvedValue({
      data: { ...monster, hp: 150 },
      response: new Response(null, { status: 200 }),
    });
  });

  it("is reachable from the monster card", async () => {
    const user = userEvent.setup();
    renderRoute("/monsters");

    await user.click(
      await screen.findByRole("link", { name: `Edit ${monster.name}` }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Edit Monster" }),
    ).toBeInTheDocument();
  });

  it("prefills the form with the current values", async () => {
    renderRoute(EDIT_PATH);

    expect(await screen.findByLabelText("Name")).toHaveValue(monster.name);
    expect(screen.getByRole("spinbutton", { name: "HP" })).toHaveValue(
      monster.hp,
    );
    expect(screen.getByRole("spinbutton", { name: "Speed" })).toHaveValue(
      monster.speed,
    );
    expect(getMock).toHaveBeenCalledWith(
      "/monsters/{id}",
      expect.objectContaining({ params: { path: { id: monster.id } } }),
    );
  });

  it("sends only the changed fields and goes back to the list", async () => {
    const user = userEvent.setup();
    renderRoute(EDIT_PATH);

    await replaceValue(
      user,
      await screen.findByRole("spinbutton", { name: "HP" }),
      "150",
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsters" }),
    ).toBeInTheDocument();
    expect(patchMock).toHaveBeenCalledWith("/monsters/{id}", {
      body: { hp: 150 },
      params: { path: { id: monster.id } },
    });
  });

  it("does not call the API when nothing changed", async () => {
    const user = userEvent.setup();
    renderRoute(EDIT_PATH);

    await user.click(
      await screen.findByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsters" }),
    ).toBeInTheDocument();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it("keeps the user on the form when the API rejects the change", async () => {
    const user = userEvent.setup();
    patchMock.mockResolvedValue({
      error: {
        error: {
          code: "VALIDATION_ERROR",
          issues: [{ message: "Name already taken", path: "name" }],
          message: "Invalid request",
        },
      },
      response: new Response(null, { status: 400 }),
    });
    renderRoute(EDIT_PATH);

    await replaceValue(user, await screen.findByLabelText("Name"), "Voltwing");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Name already taken")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Edit Monster" }),
    ).toBeInTheDocument();
  });

  it.each([404, 400])(
    "shows a not found message when the API answers %i",
    async (status) => {
      mockGet({ detailStatus: status });

      renderRoute(EDIT_PATH);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Monster not found.",
      );
      expect(
        screen.queryByRole("button", { name: "Save changes" }),
      ).not.toBeInTheDocument();
    },
  );
});
