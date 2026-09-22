import { Assets, type Texture } from "pixi.js";

type TextureParser = "svg" | "texture";

function resolveTextureParser(url: string): TextureParser | undefined {
  let pathname: string;

  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    return undefined;
  }

  if (pathname.endsWith(".svg") || pathname.endsWith("/svg")) {
    return "svg";
  }

  if (
    /\.(?:png|jpe?g|gif|webp|avif)$/.test(pathname)
    || /\/(?:png|jpe?g|gif|webp|avif)$/.test(pathname)
  ) {
    return "texture";
  }

  return undefined;
}

export async function loadMonsterTexture(url: string): Promise<Texture | null> {
  try {
    const parser = resolveTextureParser(url);

    const texture = parser
      ? await Assets.load<Texture>({
          parser,
          src: url,
        })
      : await Assets.load<Texture>(url);

    if (!texture) {
      return null;
    }

    texture.source.scaleMode = "nearest";

    return texture;
  } catch {
    return null;
  }
}
