import { REPLAY_SPEEDS } from "../replay/replay";

import type { ReplaySpeed, ReplayStatus } from "../replay/replay";

import "./ReplayControls.css";

interface ReplayControlsProps {
  readonly canRestart: boolean;
  /** A turn or the result overlays are animating. */
  readonly isAnimating: boolean;
  /** The Pixi scene finished loading and the intro played. */
  readonly isReady: boolean;
  readonly onPause: () => void;
  readonly onPlay: () => void;
  readonly onRestart: () => void;
  readonly onSkip: () => void;
  readonly onSpeedChange: (speed: ReplaySpeed) => void;
  readonly onStep: () => void;
  readonly speed: ReplaySpeed;
  readonly status: ReplayStatus;
}

export function ReplayControls({
  canRestart,
  isAnimating,
  isReady,
  onPause,
  onPlay,
  onRestart,
  onSkip,
  onSpeedChange,
  onStep,
  speed,
  status,
}: ReplayControlsProps) {
  const isPlaying = status === "playing";
  const isFinished = status === "finished";

  return (
    <div
      aria-label="Replay controls"
      className="replay-controls"
      role="toolbar"
    >
      <div className="replay-controls__group">
        <button
          className="button"
          disabled={!isReady || isFinished}
          onClick={isPlaying ? onPause : onPlay}
          type="button"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          className="button button--secondary"
          disabled={!isReady || isAnimating || isPlaying || isFinished}
          onClick={onStep}
          type="button"
        >
          Next turn
        </button>

        <button
          className="button button--secondary"
          disabled={!isReady || isFinished}
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>

        <button
          className="button button--secondary"
          disabled={!isReady || !canRestart}
          onClick={onRestart}
          type="button"
        >
          Restart
        </button>
      </div>

      <div
        aria-label="Replay speed"
        className="replay-controls__group"
        role="group"
      >
        {REPLAY_SPEEDS.map((option) => (
          <button
            aria-pressed={option === speed}
            className="button button--secondary replay-controls__speed"
            disabled={!isReady}
            key={option}
            onClick={() => {
              onSpeedChange(option);
            }}
            type="button"
          >
            {`${String(option)}x`}
          </button>
        ))}
      </div>
    </div>
  );
}
