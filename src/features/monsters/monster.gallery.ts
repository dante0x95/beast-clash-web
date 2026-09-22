const AVATAR_BASE_URL = "https://api.dicebear.com/10.x/bottts/svg";

/** Same style and URL shape as the API seeds. Will be replaced by PixelLab sprites in phase 5. */
export function avatarUrl(seed: string): string {
  return `${AVATAR_BASE_URL}?seed=${encodeURIComponent(seed)}`;
}

export interface GalleryImage {
  readonly label: string;
  readonly url: string;
}

const GALLERY_SEEDS = [
  "Blaze",
  "Gorgo",
  "Nyx",
  "Rustfang",
  "Quartz",
  "Viper",
  "Bolt",
  "Mossback",
  "Cinder",
  "Tidal",
  "Grimjaw",
  "Pixel",
] as const;

export const MONSTER_GALLERY: readonly GalleryImage[] = GALLERY_SEEDS.map(
  (seed) => ({
    label: seed,
    url: avatarUrl(seed),
  }),
);
