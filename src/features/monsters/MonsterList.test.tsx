import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../api/client";
import { renderRoute } from "../../testing/render";
import { makeMonster } from "./monster.fixture";

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

function page(
  items: ReturnType<typeof makeMonster>[],
  total = items.length,
  pageNumber = 1,
) {
  return { items, page: pageNumber, pageSize: 12, total };
}

describe("MonsterList", () => {
  afterEach(() => {
    getMock.mockReset();
  });

  it("renders every monster with its stats", async () => {
    respondWith(
      200,
      page([
        makeMonster(),
        makeMonster({
          id: "01900000-0000-7000-8000-000000000002",
          name: "Voltwing",
          speed: 80,
        }),
      ]),
    );

    renderRoute("/monsters");

    const card = await screen.findByRole("article", { name: "Voltwing" });
    expect(
      screen.getByRole("article", { name: "Emberclaw" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Voltwing" })).toHaveAttribute(
      "src",
      makeMonster().imageUrl,
    );
    expect(card.querySelector("[aria-label='Speed']")).toHaveAttribute(
      "aria-valuenow",
      "80",
    );
  });

  it("shows a placeholder when the image fails to load", async () => {
    respondWith(200, page([makeMonster()]));

    renderRoute("/monsters");
    fireEvent.error(await screen.findByRole("img", { name: "Emberclaw" }));

    expect(
      screen.getByRole("img", { name: "Emberclaw (image unavailable)" }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no monsters", async () => {
    respondWith(200, page([]));

    renderRoute("/monsters");

    expect(await screen.findByText("No monsters yet.")).toBeInTheDocument();
  });

  it("shows the API error message when the request fails", async () => {
    respondWith(429, {
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });

    renderRoute("/monsters");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load monsters: Too many requests",
    );
  });

  describe("pagination", () => {
    it("requests the first page by default and hides pagination when everything fits", async () => {
      respondWith(200, page([makeMonster()]));

      renderRoute("/monsters");
      await screen.findByRole("article", { name: "Emberclaw" });

      expect(getMock).toHaveBeenCalledWith(
        "/monsters",
        expect.objectContaining({
          params: { query: { page: 1, pageSize: 12 } },
        }),
      );
      expect(
        screen.queryByRole("navigation", { name: "Monsters pages" }),
      ).not.toBeInTheDocument();
    });

    it("reads the page from the URL", async () => {
      respondWith(200, page([makeMonster()], 30, 2));

      renderRoute("/monsters?page=2");

      expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument();
      expect(getMock).toHaveBeenCalledWith(
        "/monsters",
        expect.objectContaining({
          params: { query: { page: 2, pageSize: 12 } },
        }),
      );
    });

    it.each(["0", "-1", "abc", "1.5"])(
      "falls back to page 1 for ?page=%s",
      async (value) => {
        respondWith(200, page([makeMonster()]));

        renderRoute(`/monsters?page=${value}`);
        await screen.findByRole("article", { name: "Emberclaw" });

        expect(getMock).toHaveBeenCalledWith(
          "/monsters",
          expect.objectContaining({
            params: { query: { page: 1, pageSize: 12 } },
          }),
        );
      },
    );

    it("moves between pages", async () => {
      const user = userEvent.setup();
      respondWith(200, page([makeMonster()], 30));

      renderRoute("/monsters");
      await user.click(await screen.findByRole("button", { name: "Next ▶" }));

      expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "◀ Prev" })).toBeEnabled();
    });

    it("offers a way back when the page is out of range", async () => {
      const user = userEvent.setup();
      respondWith(200, page([], 7, 9));

      renderRoute("/monsters?page=9");
      await user.click(
        await screen.findByRole("button", { name: "Go to page 1" }),
      );

      expect(getMock).toHaveBeenLastCalledWith(
        "/monsters",
        expect.objectContaining({
          params: { query: { page: 1, pageSize: 12 } },
        }),
      );
    });

    it("disables Prev on the first page and Next on the last", async () => {
      respondWith(200, page([makeMonster()], 30, 3));

      renderRoute("/monsters?page=3");

      expect(
        await screen.findByRole("button", { name: "Next ▶" }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "◀ Prev" })).toBeEnabled();
    });
  });
});
