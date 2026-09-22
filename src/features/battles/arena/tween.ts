import type { Ticker } from "pixi.js";

interface TweenOptions {
  readonly durationMs: number;
  readonly from: number;
  readonly onUpdate: (value: number) => void;
  readonly to: number;
}

function easeOutQuad(progress: number): number {
  return 1 - (1 - progress) ** 2;
}

export function tween(ticker: Ticker, options: TweenOptions): Promise<void> {
  const { durationMs, from, onUpdate, to } = options;

  return new Promise((resolve) => {
    let elapsed = 0;

    const update = (currentTicker: Ticker): void => {
      elapsed += currentTicker.deltaMS;

      const progress = Math.min(elapsed / durationMs, 1);

      const eased = easeOutQuad(progress);
      const value = from + (to - from) * eased;

      onUpdate(value);

      if (progress >= 1) {
        ticker.remove(update);
        resolve();
      }
    };

    ticker.add(update);
  });
}
