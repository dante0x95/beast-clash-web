import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../api/client";
import { renderRoute } from "../../../testing/render";
import { makeBattleSummary, makeParticipant } from "../battle.fixture";

import type { BattleSummary } from "../battle.types";

vi.mock("../../../api/client", () => ({
  api: { DELETE: vi.fn(), GET: vi.fn() },
}));

const getMock = vi.mocked(api.GET);
const deleteMock = vi.mocked(api.DELETE);

type GetResult = Awaited<ReturnType<typeof api.GET>>;
type DeleteResult = Awaited<ReturnType<typeof api.DELETE>>;

const MIREFANG_ID = "01900000-0000-7000-8000-00000000000c";

const emberclawVsVoltwing = makeBattleSummary();
const emberclawVsMirefang = makeBattleSummary({
  id: "01900000-0000-7000-8000-0000000000fe",
  loserId: MIREFANG_ID,
  monsterB: makeParticipant({ id: MIREFANG_ID, name: "Mirefang" }),
});

function listResponse(items: BattleSummary[]): GetResult {
  return {
    data: { items, page: 1, pageSize: 10, total: items.length },
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

async function openDeleteDialog(title: string) {
  const user = userEvent.setup();
  renderRoute("/battles");
  await user.click(
    await screen.findByRole("button", { name: `Delete ${title}` }),
  );
  return {
    dialog: screen.getByRole("dialog", { name: "Delete battle?" }),
    user,
  };
}

describe("BattleList: delete", () => {
  beforeEach(() => {
    getMock.mockResolvedValue(
      listResponse([emberclawVsVoltwing, emberclawVsMirefang]),
    );
  });

  it("asks for confirmation naming the matchup", async () => {
    const { dialog } = await openDeleteDialog("Emberclaw vs Mirefang");

    expect(dialog).toHaveTextContent(
      "Emberclaw vs Mirefang will be permanently removed from the history",
    );
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("closes without deleting when cancelled", async () => {
    const { dialog, user } = await openDeleteDialog("Emberclaw vs Mirefang");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes the battle and refreshes the list", async () => {
    deleteMock.mockResolvedValue(deleteResponse(204));
    const { dialog, user } = await openDeleteDialog("Emberclaw vs Mirefang");
    getMock.mockResolvedValue(listResponse([emberclawVsVoltwing]));

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("article", { name: "Emberclaw vs Mirefang" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Emberclaw vs Voltwing" }),
    ).toBeInTheDocument();
    expect(deleteMock).toHaveBeenCalledWith("/battles/{id}", {
      params: { path: { id: emberclawVsMirefang.id } },
    });
  });

  it("treats a 404 as already deleted", async () => {
    deleteMock.mockResolvedValue(deleteResponse(404));
    const { dialog, user } = await openDeleteDialog("Emberclaw vs Mirefang");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("keeps the dialog open and shows the error when the delete fails", async () => {
    deleteMock.mockResolvedValue(deleteResponse(500));
    const { dialog, user } = await openDeleteDialog("Emberclaw vs Mirefang");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Could not delete: Unexpected error",
    );
    expect(
      screen.getByRole("article", { name: "Emberclaw vs Mirefang" }),
    ).toBeInTheDocument();
  });

  it("clears a previous error when the dialog is opened again", async () => {
    deleteMock.mockResolvedValue(deleteResponse(500));
    const { dialog, user } = await openDeleteDialog("Emberclaw vs Mirefang");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await within(dialog).findByRole("alert");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await user.click(
      screen.getByRole("button", { name: "Delete Emberclaw vs Voltwing" }),
    );

    expect(
      within(screen.getByRole("dialog")).queryByRole("alert"),
    ).not.toBeInTheDocument();
  });
});
