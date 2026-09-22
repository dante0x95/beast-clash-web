import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderRoute } from "../../testing/render";
import { makeMonster } from "./monster.fixture";

vi.mock("../../api/client", () => ({
  api: { DELETE: vi.fn(), GET: vi.fn() },
}));

const getMock = vi.mocked(api.GET);
const deleteMock = vi.mocked(api.DELETE);

type GetResult = Awaited<ReturnType<typeof api.GET>>;
type DeleteResult = Awaited<ReturnType<typeof api.DELETE>>;

const emberclaw = makeMonster();
const voltwing = makeMonster({
  id: "01900000-0000-7000-8000-000000000002",
  name: "Voltwing",
});

function listResponse(items: ReturnType<typeof makeMonster>[]): GetResult {
  return {
    data: { items, page: 1, pageSize: 12, total: items.length },
    response: new Response(null, { status: 200 }),
  } as GetResult;
}

function deleteResponse(status: number): DeleteResult {
  return (
    status === 204
      ? { response: new Response(null, { status }) }
      : {
          error: {
            error: {
              code: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
              message: "Unexpected error",
            },
          },
          response: new Response(null, { status }),
        }
  ) as DeleteResult;
}

async function openDeleteDialog(name: string) {
  const user = userEvent.setup();
  renderRoute("/monsters");
  await user.click(
    await screen.findByRole("button", { name: `Delete ${name}` }),
  );
  return {
    dialog: screen.getByRole("dialog", { name: "Delete monster?" }),
    user,
  };
}

describe("MonsterList: delete", () => {
  beforeEach(() => {
    getMock.mockResolvedValue(listResponse([emberclaw, voltwing]));
  });

  it("asks for confirmation naming the monster", async () => {
    const { dialog } = await openDeleteDialog("Voltwing");

    expect(dialog).toHaveTextContent("Voltwing will be removed from the list");
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("closes without deleting when cancelled", async () => {
    const { dialog, user } = await openDeleteDialog("Voltwing");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes the monster and refreshes the list", async () => {
    deleteMock.mockResolvedValue(deleteResponse(204));
    const { dialog, user } = await openDeleteDialog("Voltwing");
    getMock.mockResolvedValue(listResponse([emberclaw]));

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("article", { name: "Voltwing" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Emberclaw" }),
    ).toBeInTheDocument();
    expect(deleteMock).toHaveBeenCalledWith("/monsters/{id}", {
      params: { path: { id: voltwing.id } },
    });
  });

  it("treats a 404 as already deleted", async () => {
    deleteMock.mockResolvedValue(deleteResponse(404));
    const { dialog, user } = await openDeleteDialog("Voltwing");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("keeps the dialog open and shows the error when the delete fails", async () => {
    deleteMock.mockResolvedValue(deleteResponse(500));
    const { dialog, user } = await openDeleteDialog("Voltwing");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Could not delete: Unexpected error",
    );
    expect(
      screen.getByRole("article", { name: "Voltwing" }),
    ).toBeInTheDocument();
  });

  it("clears a previous error when the dialog is opened again", async () => {
    deleteMock.mockResolvedValue(deleteResponse(500));
    const { dialog, user } = await openDeleteDialog("Voltwing");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await within(dialog).findByRole("alert");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete Emberclaw" }));

    expect(
      within(screen.getByRole("dialog")).queryByRole("alert"),
    ).not.toBeInTheDocument();
  });
});
