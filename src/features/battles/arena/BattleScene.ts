import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Texture,
  type Ticker,
} from "pixi.js";

import { BattleHud, type BattleHudTextures } from "./BattleHud";
import { BattleOverlay } from "./BattleOverlay";
import { tween, wait } from "./tween";

import type { Battle, BattleTurn } from "../battle.types";
import type { ReplaySpeed, ReplayState } from "../replay/replay";

export const BATTLE_HEIGHT = 270;
export const BATTLE_WIDTH = 480;

const FIGHTER_HEIGHT = 88;
const PLATFORM_Y = 225;

const LUNGE_DISTANCE = 52;
const LUNGE_DURATION_MS = 160;
const RETURN_DURATION_MS = 190;

const KNOCKOUT_PUSH_X = 22;
const KNOCKOUT_REST_Y = 6;
const KNOCKOUT_ROTATION = 0.65;
const KNOCKOUT_ALPHA = 0.35;

const damageStyle = new TextStyle({
  fill: 0xffd633,
  fontFamily: "Press Start 2P",
  fontSize: 12,
  stroke: {
    color: 0x000000,
    width: 3,
  },
});

interface FighterView {
  readonly container: Container;
  readonly homeX: number;
}

export class BattleScene {
  private readonly fighters = new Map<string, FighterView>();
  private readonly root = new Container();

  private animating = false;
  private hud: BattleHud | undefined;
  private overlay: BattleOverlay | undefined;

  constructor(
    private readonly battle: Battle,
    private readonly replay: ReplayState,
    private readonly textures: BattleHudTextures,
    private readonly ticker: Ticker,
  ) {}

  mount(stage: Container): void {
    stage.addChild(this.root);

    this.buildArena();
    this.buildFighters();

    this.hud = new BattleHud(this.battle, this.replay, this.textures);

    this.root.addChild(this.hud.container);
    this.overlay = new BattleOverlay(this.ticker);

    this.root.addChild(this.overlay.container);
  }

  /** Scales every tween (turns and overlays) because they all run on this ticker. */
  setSpeed(speed: ReplaySpeed): void {
    this.ticker.speed = speed;
  }

  async playIntro(): Promise<void> {
    await this.overlay?.playIntro();
  }

  async wait(durationMs: number): Promise<void> {
    await wait(this.ticker, durationMs);
  }

  /** Puts fighters and HUD back to the initial state, without replaying the intro. */
  reset(replay: ReplayState): void {
    this.resetFighters();
    this.hud?.update(replay);
  }

  /** Jumps to the end of the battle: final HP, loser knocked out, then K.O. and winner overlays. */
  async showFinalState(replay: ReplayState): Promise<void> {
    this.resetFighters();
    this.hud?.update(replay);

    const loser = this.fighters.get(this.battle.loserId);

    if (loser) {
      const direction = this.knockoutDirection(this.battle.loserId);

      loser.container.position.set(
        loser.homeX + KNOCKOUT_PUSH_X * direction,
        PLATFORM_Y + KNOCKOUT_REST_Y,
      );
      loser.container.rotation = KNOCKOUT_ROTATION * direction;
      loser.container.alpha = KNOCKOUT_ALPHA;
    }

    await this.playResult();
  }

  async animateTurn(turn: BattleTurn, nextReplay: ReplayState): Promise<void> {
    if (this.animating) {
      return;
    }

    const attacker = this.fighters.get(turn.attackerId);
    const defender = this.fighters.get(turn.defenderId);

    if (!attacker || !defender) {
      return;
    }

    this.animating = true;

    const direction = turn.attackerId === this.battle.monsterA.id ? 1 : -1;

    const strikeX = attacker.homeX + LUNGE_DISTANCE * direction;

    try {
      await tween(this.ticker, {
        durationMs: LUNGE_DURATION_MS,
        from: attacker.container.x,
        onUpdate: (x) => {
          attacker.container.x = x;
        },
        to: strikeX,
      });

      const impact = this.createImpact(
        defender.container.x,
        PLATFORM_Y - FIGHTER_HEIGHT / 2,
      );

      this.root.addChild(impact);

      const damageText = this.createDamageText(
        turn.damage,
        defender.container.x,
        PLATFORM_Y - FIGHTER_HEIGHT - 6,
      );

      this.root.addChild(damageText);

      await Promise.all([
        this.animateDefenderHit(defender.container),

        this.hud?.animateDamage(turn, nextReplay, this.ticker)
        ?? Promise.resolve(),

        this.animateDamageText(damageText),
      ]);

      impact.destroy();

      const isKnockout = turn.defenderHpAfter === 0;

      const returnAttacker = tween(this.ticker, {
        durationMs: RETURN_DURATION_MS,
        from: attacker.container.x,
        onUpdate: (x) => {
          attacker.container.x = x;
        },
        to: attacker.homeX,
      });

      if (isKnockout) {
        await Promise.all([
          returnAttacker,
          this.animateKnockout(
            defender.container,
            this.knockoutDirection(turn.defenderId),
          ),
        ]);

        await this.playResult();
      } else {
        await returnAttacker;
      }
    } finally {
      attacker.container.x = attacker.homeX;

      if (turn.defenderHpAfter !== 0) {
        defender.container.alpha = 1;
      }

      this.animating = false;
    }
  }

  private async playResult(): Promise<void> {
    const winnerName
      = this.battle.winnerId === this.battle.monsterA.id
        ? this.battle.monsterA.name
        : this.battle.monsterB.name;

    await this.overlay?.playKnockout();
    await this.overlay?.playWinner(winnerName);
  }

  /** The knocked-out fighter falls away from the center of the arena. */
  private knockoutDirection(fighterId: string): -1 | 1 {
    return fighterId === this.battle.monsterA.id ? -1 : 1;
  }

  private resetFighters(): void {
    for (const { container, homeX } of this.fighters.values()) {
      container.position.set(homeX, PLATFORM_Y);
      container.rotation = 0;
      container.alpha = 1;
    }
  }

  private async animateDefenderHit(defender: Container): Promise<void> {
    await tween(this.ticker, {
      durationMs: 45,
      from: 1,
      onUpdate: (alpha) => {
        defender.alpha = alpha;
      },
      to: 0.25,
    });

    await tween(this.ticker, {
      durationMs: 75,
      from: 0.25,
      onUpdate: (alpha) => {
        defender.alpha = alpha;
      },
      to: 1,
    });
  }

  private async animateKnockout(
    defender: Container,
    direction: -1 | 1,
  ): Promise<void> {
    const startX = defender.x;
    const startY = defender.y;

    await Promise.all([
      tween(this.ticker, {
        durationMs: 120,
        from: startX,
        onUpdate: (x) => {
          defender.x = x;
        },
        to: startX + KNOCKOUT_PUSH_X * direction,
      }),

      tween(this.ticker, {
        durationMs: 120,
        from: startY,
        onUpdate: (y) => {
          defender.y = y;
        },
        to: startY - 8,
      }),
    ]);

    await Promise.all([
      tween(this.ticker, {
        durationMs: 240,
        from: defender.y,
        onUpdate: (y) => {
          defender.y = y;
        },
        to: startY + KNOCKOUT_REST_Y,
      }),

      tween(this.ticker, {
        durationMs: 240,
        from: 0,
        onUpdate: (rotation) => {
          defender.rotation = rotation;
        },
        to: KNOCKOUT_ROTATION * direction,
      }),

      tween(this.ticker, {
        durationMs: 240,
        from: 1,
        onUpdate: (alpha) => {
          defender.alpha = alpha;
        },
        to: KNOCKOUT_ALPHA,
      }),
    ]);
  }

  private async animateDamageText(text: Text): Promise<void> {
    const startY = text.y;

    try {
      await Promise.all([
        tween(this.ticker, {
          durationMs: 280,
          from: startY,
          onUpdate: (y) => {
            text.y = y;
          },
          to: startY - 18,
        }),

        tween(this.ticker, {
          durationMs: 280,
          from: 1,
          onUpdate: (alpha) => {
            text.alpha = alpha;
          },
          to: 0,
        }),
      ]);
    } finally {
      text.destroy();
    }
  }

  private buildArena(): void {
    const background = new Graphics()
      .rect(0, 0, BATTLE_WIDTH, BATTLE_HEIGHT)
      .fill(0x0b0a1a);

    const p1Accent = new Graphics()
      .rect(0, 0, BATTLE_WIDTH / 2, 4)
      .fill(0xff4d6d);

    const p2Accent = new Graphics()
      .rect(BATTLE_WIDTH / 2, 0, BATTLE_WIDTH / 2, 4)
      .fill(0x4cc9f0);

    const horizon = new Graphics().rect(0, 178, BATTLE_WIDTH, 4).fill(0x302a4f);

    const floor = new Graphics().rect(0, 182, BATTLE_WIDTH, 88).fill(0x171528);

    const leftPlatform = new Graphics()
      .roundRect(48, PLATFORM_Y, 130, 12, 3)
      .fill(0x312c4c);

    const rightPlatform = new Graphics()
      .roundRect(302, PLATFORM_Y, 130, 12, 3)
      .fill(0x312c4c);

    this.root.addChild(
      background,
      p1Accent,
      p2Accent,
      horizon,
      floor,
      leftPlatform,
      rightPlatform,
    );
  }

  private buildFighters(): void {
    const p1 = this.createFighter(113, PLATFORM_Y, this.textures.p1, false);

    const p2 = this.createFighter(367, PLATFORM_Y, this.textures.p2, true);

    this.fighters.set(this.battle.monsterA.id, {
      container: p1,
      homeX: 113,
    });

    this.fighters.set(this.battle.monsterB.id, {
      container: p2,
      homeX: 367,
    });

    this.root.addChild(p1, p2);
  }

  private createFighter(
    x: number,
    y: number,
    texture: Texture | null,
    flip: boolean,
  ): Container {
    const container = new Container();

    container.position.set(x, y);

    if (!texture) {
      const fallback = new Graphics()
        .roundRect(-32, -FIGHTER_HEIGHT, 64, FIGHTER_HEIGHT, 4)
        .fill(0x29263d);

      const questionMark = new Text({
        style: {
          fill: 0xffffff,
          fontFamily: "Press Start 2P",
          fontSize: 20,
        },
        text: "?",
      });

      questionMark.anchor.set(0.5);
      questionMark.position.set(0, -FIGHTER_HEIGHT / 2);

      container.addChild(fallback, questionMark);

      return container;
    }

    const fighter = new Sprite(texture);

    fighter.anchor.set(0.5, 1);

    const scale = FIGHTER_HEIGHT / texture.height;

    fighter.scale.set(scale);

    if (flip) {
      fighter.scale.x *= -1;
    }

    container.addChild(fighter);

    return container;
  }

  private createImpact(x: number, y: number): Graphics {
    const impact = new Graphics()
      .rect(-10, -2, 20, 4)
      .fill(0xffd633)
      .rect(-2, -10, 4, 20)
      .fill(0xffffff);

    impact.position.set(x, y);

    return impact;
  }

  private createDamageText(damage: number, x: number, y: number): Text {
    const text = new Text({
      style: damageStyle,
      text: `-${String(damage)}`,
    });

    text.anchor.set(0.5);
    text.position.set(x, y);

    return text;
  }
}
