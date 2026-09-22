import { screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderRoute } from "../../testing/render";
import { makeMonster } from "./monster.fixture";
import { MONSTER_GALLERY } from "./monster.gallery";

vi.mock("../../api/client", () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const getMock = vi.mocked(api.GET);
const postMock = vi.mocked(api.POST);

async function replaceValue(
  user: UserEvent,
  label: string,
  value: string,
): Promise<void> {
  const input = screen.getByRole("spinbutton", { name: label });
  await user.clear(input);
  if (value !== "") await user.type(input, value);
}

describe("MonsterCreatePage", () => {
  beforeEach(() => {
    getMock.mockResolvedValue({
      data: { items: [], page: 1, pageSize: 12, total: 0 },
      response: new Response(null, { status: 200 }),
    } as Awaited<ReturnType<typeof api.GET>>);
  });

  it("is reachable from the monsters page", async () => {
    const user = userEvent.setup();
    renderRoute("/monsters");

    await user.click(
      await screen.findByRole("link", { name: "+ New monster" }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "New Monster" }),
    ).toBeInTheDocument();
  });

  it("creates the monster with numeric stats and goes back to the list", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue({
      data: makeMonster(),
      response: new Response(null, { status: 201 }),
    });
    renderRoute("/monsters/new");

    await user.type(screen.getByLabelText("Name"), "Emberclaw");
    await replaceValue(user, "HP", "120");
    await replaceValue(user, "Speed", "60");
    await user.click(
      screen.getByRole("radio", { name: MONSTER_GALLERY[2]?.label ?? "" }),
    );
    await user.click(screen.getByRole("button", { name: "Create monster" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Monsters" }),
    ).toBeInTheDocument();
    expect(postMock).toHaveBeenCalledWith("/monsters", {
      body: {
        attack: 30,
        defense: 20,
        hp: 120,
        imageUrl: MONSTER_GALLERY[2]?.url,
        name: "Emberclaw",
        speed: 60,
      },
    });
  });

  it("does not call the API while the form is invalid", async () => {
    const user = userEvent.setup();
    renderRoute("/monsters/new");

    await replaceValue(user, "HP", "5000");
    await user.click(screen.getByRole("button", { name: "Create monster" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("HP must be at most 1000")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "HP" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("clears a field error as soon as the user edits it", async () => {
    const user = userEvent.setup();
    renderRoute("/monsters/new");

    await user.click(screen.getByRole("button", { name: "Create monster" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "E");

    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("shows API validation issues next to their fields", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue({
      error: {
        error: {
          code: "VALIDATION_ERROR",
          issues: [{ message: "Name already taken", path: "name" }],
          message: "Invalid request",
        },
      },
      response: new Response(null, { status: 400 }),
    });
    renderRoute("/monsters/new");

    await user.type(screen.getByLabelText("Name"), "Emberclaw");
    await user.click(screen.getByRole("button", { name: "Create monster" }));

    expect(await screen.findByText("Name already taken")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid request");
    expect(
      screen.getByRole("heading", { level: 1, name: "New Monster" }),
    ).toBeInTheDocument();
  });

  it("accepts a custom image URL", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue({
      data: makeMonster(),
      response: new Response(null, { status: 201 }),
    });
    renderRoute("/monsters/new");

    await user.type(screen.getByLabelText("Name"), "Emberclaw");
    await user.click(
      screen.getByRole("radio", { name: "Use my own image URL" }),
    );
    await user.type(
      screen.getByLabelText("Image URL"),
      "https://example.com/emberclaw.png",
    );
    await user.click(screen.getByRole("button", { name: "Create monster" }));

    await screen.findByRole("heading", { level: 1, name: "Monsters" });
    expect(postMock).toHaveBeenCalledWith("/monsters", {
      body: expect.objectContaining({
        imageUrl: "https://example.com/emberclaw.png",
      }) as unknown,
    });
  });

  it("updates the preview while typing", async () => {
    const user = userEvent.setup();
    renderRoute("/monsters/new");

    await user.type(screen.getByLabelText("Name"), "Voltwing");
    await replaceValue(user, "Speed", "80");

    const preview = screen.getByRole("complementary", { name: "Preview" });
    expect(
      within(preview).getByRole("article", { name: "Voltwing" }),
    ).toBeInTheDocument();
    expect(
      within(preview).getByRole("meter", { name: "Speed" }),
    ).toHaveAttribute("aria-valuenow", "80");
  });
});
