import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  type Texture,
  type Ticker,
} from "pixi.js";

import { tween } from "./tween";

import type { Battle, BattleTurn } from "../battle.types";
import type { ReplayState } from "../replay/replay";

const P1_COLOR = 0xff4d6d;
const P2_COLOR = 0x4cc9f0;
const TRAIL_COLOR = 0xffd166;

const HP_BAR_WIDTH = 142;
const HP_BAR_HEIGHT = 8;
const TRAIL_DURATION_MS = 280;

const nameStyle = new TextStyle({
  fill: 0xffffff,
  fontFamily: "Press Start 2P",
  fontSize: 8,
});

const smallStyle = new TextStyle({
  fill: 0xb8b4d0,
  fontFamily: "Press Start 2P",
  fontSize: 6,
});

const turnStyle = new TextStyle({
  fill: 0xffd633,
  fontFamily: "Press Start 2P",
  fontSize: 8,
});

class HpBar {
  private currentRatio = 1;

  private readonly fill = new Graphics();
  private readonly hpText: Text;
  private readonly trail = new Graphics();

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly color: number,
    textAnchor: 0 | 1,
  ) {
    this.hpText = new Text({
      style: smallStyle,
      text: "",
    });

    this.hpText.anchor.set(textAnchor, 0);

    this.hpText.position.set(textAnchor === 0 ? x : x + HP_BAR_WIDTH, y + 12);
  }

  addTo(container: Container): void {
    const background = new Graphics()
      .rect(this.x, this.y, HP_BAR_WIDTH, HP_BAR_HEIGHT)
      .fill(0x29263d);

    container.addChild(background, this.trail, this.fill, this.hpText);
  }

  update(hp: number, maxHp: number): void {
    const ratio = this.toRatio(hp, maxHp);

    this.drawTrail(ratio);
    this.drawFill(ratio);

    this.hpText.text = `${String(hp)} / ${String(maxHp)}`;
    this.currentRatio = ratio;
  }

  async animateTo(hp: number, maxHp: number, ticker: Ticker): Promise<void> {
    const previousRatio = this.currentRatio;
    const nextRatio = this.toRatio(hp, maxHp);

    this.drawTrail(previousRatio);
    this.drawFill(nextRatio);

    this.hpText.text = `${String(hp)} / ${String(maxHp)}`;

    await tween(ticker, {
      durationMs: TRAIL_DURATION_MS,
      from: previousRatio,
      onUpdate: (ratio) => {
        this.drawTrail(ratio);
      },
      to: nextRatio,
    });

    this.currentRatio = nextRatio;
  }

  private drawFill(ratio: number): void {
    this.fill
      .clear()
      .rect(this.x, this.y, HP_BAR_WIDTH * ratio, HP_BAR_HEIGHT)
      .fill(this.color);
  }

  private drawTrail(ratio: number): void {
    this.trail
      .clear()
      .rect(this.x, this.y, HP_BAR_WIDTH * ratio, HP_BAR_HEIGHT)
      .fill(TRAIL_COLOR);
  }

  private toRatio(hp: number, maxHp: number): number {
    return Math.max(0, Math.min(1, hp / maxHp));
  }
}

export interface BattleHudTextures {
  readonly p1: Texture | null;
  readonly p2: Texture | null;
}

export class BattleHud {
  readonly container = new Container();

  private readonly p1HpBar: HpBar;
  private readonly p2HpBar: HpBar;
  private readonly turnText: Text;

  constructor(
    private readonly battle: Battle,
    state: ReplayState,
    textures: BattleHudTextures,
  ) {
    this.p1HpBar = new HpBar(70, 31, P1_COLOR, 0);

    this.p2HpBar = new HpBar(268, 31, P2_COLOR, 1);

    this.turnText = new Text({
      style: turnStyle,
      text: "",
    });

    this.buildStaticHud(textures);

    this.p1HpBar.addTo(this.container);
    this.p2HpBar.addTo(this.container);

    this.update(state);
  }

  update(state: ReplayState): void {
    this.p1HpBar.update(state.fighters.a.hp, state.fighters.a.maxHp);

    this.p2HpBar.update(state.fighters.b.hp, state.fighters.b.maxHp);

    this.updateTurnText(state);
  }

  async animateDamage(
    turn: BattleTurn,
    state: ReplayState,
    ticker: Ticker,
  ): Promise<void> {
    this.updateTurnText(state);

    if (turn.defenderId === this.battle.monsterA.id) {
      await this.p1HpBar.animateTo(
        state.fighters.a.hp,
        state.fighters.a.maxHp,
        ticker,
      );

      return;
    }

    if (turn.defenderId === this.battle.monsterB.id) {
      await this.p2HpBar.animateTo(
        state.fighters.b.hp,
        state.fighters.b.maxHp,
        ticker,
      );
    }
  }

  private updateTurnText(state: ReplayState): void {
    this.turnText.text = `TURN ${String(state.nextTurnIndex)} / ${String(state.turns.length)}`;
  }

  private buildStaticHud(textures: BattleHudTextures): void {
    const p1Name = new Text({
      style: nameStyle,
      text: this.battle.monsterA.name,
    });

    p1Name.position.set(70, 14);

    const p2Name = new Text({
      style: nameStyle,
      text: this.battle.monsterB.name,
    });

    p2Name.anchor.set(1, 0);
    p2Name.position.set(410, 14);

    this.turnText.anchor.set(0.5, 0);
    this.turnText.position.set(240, 13);

    this.container.addChild(p1Name, p2Name, this.turnText);

    this.addPortrait(18, 12, textures.p1, P1_COLOR);

    this.addPortrait(418, 12, textures.p2, P2_COLOR);
  }

  private addPortrait(
    x: number,
    y: number,
    texture: Texture | null,
    color: number,
  ): void {
    const frame = new Graphics().rect(x, y, 44, 44).fill(0x211e38).stroke({
      color,
      width: 2,
    });

    this.container.addChild(frame);

    if (texture) {
      const portrait = new Sprite(texture);

      portrait.position.set(x + 3, y + 3);
      portrait.width = 38;
      portrait.height = 38;

      this.container.addChild(portrait);

      return;
    }

    const fallback = new Text({
      style: nameStyle,
      text: "?",
    });

    fallback.anchor.set(0.5);
    fallback.position.set(x + 22, y + 22);

    this.container.addChild(fallback);
  }
}
