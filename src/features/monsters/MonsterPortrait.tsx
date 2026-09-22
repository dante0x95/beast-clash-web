import { useState } from "react";

import "./MonsterPortrait.css";

interface MonsterPortraitProps {
  readonly name: string;
  readonly size?: number;
  readonly src: string;
}

export function MonsterPortrait({
  name,
  size = 96,
  src,
}: MonsterPortraitProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // keyed by src: an edited monster with a new image gets a fresh attempt
  if (failedSrc === src) {
    return (
      <div
        aria-label={`${name} (image unavailable)`}
        className="monster-portrait__fallback"
        role="img"
        style={{ height: size, width: size }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      alt={name}
      className="monster-portrait pixelated"
      decoding="async"
      height={size}
      loading="lazy"
      onError={() => {
        setFailedSrc(src);
      }}
      src={src}
      width={size}
    />
  );
}
