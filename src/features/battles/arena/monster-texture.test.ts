import { Assets, type Texture } from "pixi.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadMonsterTexture } from "./monster-texture";

vi.mock("pixi.js", () => ({
  Assets: {
    load: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/unbound-method
const loadMock = vi.mocked(Assets.load);

function makeTexture(): Texture {
  return {
    source: {
      scaleMode: "linear",
    },
  } as unknown as Texture;
}

describe("loadMonsterTexture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forces the SVG parser for DiceBear SVG URLs", async () => {
    const texture = makeTexture();
    const url = "https://api.dicebear.com/10.x/bottts/svg?seed=Frostmaw";

    loadMock.mockResolvedValue(texture as unknown as Record<string, unknown>);

    const result = await loadMonsterTexture(url);

    expect(loadMock).toHaveBeenCalledWith({
      parser: "svg",
      src: url,
    });

    expect(result).toBe(texture);
    expect(texture.source.scaleMode).toBe("nearest");
  });

  it("uses the texture parser for DiceBear PNG URLs", async () => {
    const texture = makeTexture();
    const url = "https://api.dicebear.com/10.x/bottts/png?seed=Frostmaw";

    loadMock.mockResolvedValue(texture as unknown as Record<string, unknown>);

    await loadMonsterTexture(url);

    expect(loadMock).toHaveBeenCalledWith({
      parser: "texture",
      src: url,
    });
  });

  it("lets Pixi resolve image URLs with an unknown format", async () => {
    const texture = makeTexture();
    const url = "https://example.com/avatar?id=123";

    loadMock.mockResolvedValue(texture as unknown as Record<string, unknown>);

    await loadMonsterTexture(url);

    expect(loadMock).toHaveBeenCalledWith(url);
  });

  it("returns null when the image cannot be loaded", async () => {
    loadMock.mockRejectedValue(new Error("Image failed"));

    const result = await loadMonsterTexture("https://example.com/missing.png");

    expect(result).toBeNull();
  });
});
