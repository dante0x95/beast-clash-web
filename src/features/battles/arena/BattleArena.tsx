import { Application } from "pixi.js";
import { useEffect, useReducer, useRef, useState } from "react";

import { createReplayState, replayReducer } from "../replay/replay";
import { BATTLE_HEIGHT, BATTLE_WIDTH, BattleScene } from "./BattleScene";
import { loadMonsterTexture } from "./monster-texture";

import type { Battle } from "../battle.types";

import "./BattleArena.css";

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

  const replayRef = useRef(replay);

  useEffect(() => {
    replayRef.current = replay;
    sceneRef.current?.update(replay);
  }, [replay]);

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
      );

      scene.mount(app.stage);
      sceneRef.current = scene;

      await scene.playIntro();

      if (destroyed) {
        return;
      }

      setIsSceneReady(true);

      const updateScale = (): void => {
        const scale = Math.max(1, Math.floor(host.clientWidth / BATTLE_WIDTH));

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

  const handleNextTurn = async (): Promise<void> => {
    if (isAnimating || replay.nextTurnIndex >= replay.turns.length) {
      return;
    }

    const scene = sceneRef.current;
    const turn = replay.turns[replay.nextTurnIndex];

    if (!scene || !turn) {
      return;
    }

    const nextReplay = replayReducer(replay, { type: "step" });

    if (nextReplay === replay) {
      return;
    }

    setIsAnimating(true);

    try {
      await scene.animateTurn(turn, nextReplay);

      dispatch({ type: "step" });
    } finally {
      setIsAnimating(false);
    }
  };

  if (renderFailed) {
    return (
      <p className="status-message" role="alert">
        Could not initialize the battle arena.
      </p>
    );
  }

  const finished = replay.nextTurnIndex >= replay.turns.length;

  return (
    <div
      aria-label={`${battle.monsterA.name} versus ${battle.monsterB.name}`}
      className="battle-arena"
      role="region"
    >
      <div className="battle-arena__viewport" ref={hostRef} />

      <div className="battle-arena__controls">
        <button
          className="button"
          disabled={isAnimating || finished || !isSceneReady}
          onClick={() => {
            void handleNextTurn();
          }}
          type="button"
        >
          {finished
            ? "Battle finished"
            : isAnimating
              ? "Resolving turn…"
              : "Next turn"}
        </button>
      </div>
    </div>
  );
}
