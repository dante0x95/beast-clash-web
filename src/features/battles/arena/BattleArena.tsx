import { Application } from "pixi.js";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { createReplayState, replayReducer } from "../replay/replay";
import { describeReplay } from "../replay/replay-announcer";
import { BATTLE_HEIGHT, BATTLE_WIDTH, BattleScene } from "./BattleScene";
import { loadMonsterTexture } from "./monster-texture";
import { ReplayControls } from "./ReplayControls";

import type { Battle } from "../battle.types";
import type { ReplayEvent, ReplaySpeed, ReplayState } from "../replay/replay";

import "./BattleArena.css";

/** Pause between turns while auto-playing (scaled by the replay speed). */
const TURN_GAP_MS = 250;

/** Actions that drive the Pixi scene and must never overlap. */
type SceneAction = "restart" | "skip" | "step";

interface BattleArenaProps {
  readonly battle: Battle;
}

export function BattleArena({ battle }: BattleArenaProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BattleScene | null>(null);

  const [renderFailed, setRenderFailed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  const [replay, dispatch] = useReducer(
    replayReducer,
    battle,
    createReplayState,
  );

  // Latest replay state for async scene actions, updated eagerly by `commit`
  // so chained actions never read a state React has not rendered yet.
  const replayRef = useRef<ReplayState>(replay);
  const busyRef = useRef(false);
  const pendingActionRef = useRef<SceneAction | null>(null);

  useEffect(() => {
    replayRef.current = replay;
  }, [replay]);

  useEffect(() => {
    sceneRef.current?.setSpeed(replay.speed);
  }, [replay.speed]);

  const commit = useCallback((event: ReplayEvent): ReplayState => {
    const next = replayReducer(replayRef.current, event);

    replayRef.current = next;
    dispatch(event);

    return next;
  }, []);

  const runSceneAction = useCallback(
    async (scene: BattleScene, action: SceneAction): Promise<void> => {
      switch (action) {
        case "restart": {
          scene.reset(commit({ type: "restart" }));

          return;
        }
        case "skip": {
          if (replayRef.current.status === "finished") {
            return;
          }

          await scene.showFinalState(commit({ type: "skip" }));

          return;
        }
        case "step": {
          const current = replayRef.current;
          const turn = current.turns[current.nextTurnIndex];

          if (!turn || current.status === "finished") {
            return;
          }

          // HP always comes from the API (`defenderHpAfter`) through the reducer
          await scene.animateTurn(
            turn,
            replayReducer(current, { type: "step" }),
          );

          const next = commit({ type: "step" });

          if (next.status === "playing") {
            await scene.wait(TURN_GAP_MS);
          }
        }
      }
    },
    [commit],
  );

  /**
   * Runs one scene action at a time. Skip or Restart requested mid-animation
   * pause the replay and run as soon as the current animation ends.
   */
  const performSceneAction = useCallback(
    async (action: SceneAction): Promise<void> => {
      const scene = sceneRef.current;

      if (!scene) {
        return;
      }

      if (busyRef.current) {
        if (action !== "step") {
          pendingActionRef.current = action;
          commit({ type: "pause" });
        }

        return;
      }

      busyRef.current = true;
      setIsAnimating(true);

      try {
        let next: SceneAction | null = action;

        while (next) {
          await runSceneAction(scene, next);

          next = pendingActionRef.current;
          pendingActionRef.current = null;
        }
      } finally {
        busyRef.current = false;
        setIsAnimating(false);
      }
    },
    [commit, runSceneAction],
  );

  // Auto-play: each finished turn re-renders with isAnimating=false and schedules the next one
  useEffect(() => {
    if (!isSceneReady || isAnimating || replay.status !== "playing") {
      return;
    }

    void performSceneAction("step");
  }, [
    isAnimating,
    isSceneReady,
    performSceneAction,
    replay.nextTurnIndex,
    replay.status,
  ]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    setRenderFailed(false);

    const app = new Application();

    let destroyed = false;
    let initialized = false;
    let resizeObserver: ResizeObserver | undefined;

    const destroyApp = (): void => {
      if (!initialized || destroyed) {
        return;
      }

      destroyed = true;
      sceneRef.current = null;
      setIsSceneReady(false);

      app.destroy({ removeView: true }, { children: true });
    };

    const initialize = async (): Promise<void> => {
      await app.init({
        antialias: false,
        background: "#0b0a1a",
        height: BATTLE_HEIGHT,
        preference: "webgl",
        resolution: 1,
        width: BATTLE_WIDTH,
      });

      initialized = true;

      if (destroyed) {
        destroyApp();

        return;
      }

      await document.fonts.load("8px \"Press Start 2P\"");

      const [p1Texture, p2Texture] = await Promise.all([
        loadMonsterTexture(battle.monsterA.imageUrl),
        loadMonsterTexture(battle.monsterB.imageUrl),
      ]);

      if (destroyed) {
        destroyApp();

        return;
      }

      const canvas = app.canvas;

      canvas.className = "battle-arena__canvas";
      canvas.setAttribute("aria-hidden", "true");

      host.replaceChildren(canvas);

      const scene = new BattleScene(
        battle,
        replayRef.current,
        {
          p1: p1Texture,
          p2: p2Texture,
        },
        app.ticker,
        {
          reducedMotion: window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches,
        },
      );
      scene.mount(app.stage);
      scene.setSpeed(replayRef.current.speed);
      sceneRef.current = scene;

      await scene.playIntro();

      if (destroyed) {
        return;
      }

      setIsSceneReady(true);

      const updateScale = (): void => {
        const ratio = host.clientWidth / BATTLE_WIDTH;
        // integer scale keeps pixels crisp; below 1x (phones) it shrinks to fit instead of scrolling
        const scale = ratio >= 1 ? Math.floor(ratio) : ratio;

        canvas.style.width = `${String(BATTLE_WIDTH * scale)}px`;

        canvas.style.height = `${String(BATTLE_HEIGHT * scale)}px`;
      };

      updateScale();

      resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(host);
    };

    void initialize().catch(() => {
      if (!destroyed) {
        setRenderFailed(true);
      }
    });

    return () => {
      resizeObserver?.disconnect();
      destroyApp();
    };
  }, [battle]);

  if (renderFailed) {
    return (
      <p className="status-message" role="alert">
        Could not initialize the battle arena.
      </p>
    );
  }

  return (
    <div
      aria-label={`${battle.monsterA.name} versus ${battle.monsterB.name}`}
      className="battle-arena"
      role="region"
    >
      <div className="battle-arena__viewport" ref={hostRef} />

      <ReplayControls
        canRestart={replay.nextTurnIndex > 0 || replay.status !== "idle"}
        isAnimating={isAnimating}
        isReady={isSceneReady}
        onPause={() => {
          commit({ type: "pause" });
        }}
        onPlay={() => {
          commit({ type: "play" });
        }}
        onRestart={() => {
          void performSceneAction("restart");
        }}
        onSkip={() => {
          void performSceneAction("skip");
        }}
        onSpeedChange={(speed: ReplaySpeed) => {
          commit({ type: "setSpeed", speed });
        }}
        onStep={() => {
          void performSceneAction("step");
        }}
        speed={replay.speed}
        status={replay.status}
      />
      <p className="visually-hidden" role="status">
        {describeReplay(replay)}
      </p>
    </div>
  );
}
