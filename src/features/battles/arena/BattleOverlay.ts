import { Container, Graphics, Text, TextStyle, type Ticker } from "pixi.js";

import { BATTLE_HEIGHT, BATTLE_WIDTH } from "./BattleScene";
import { tween } from "./tween";

const overlayStyle = new TextStyle({
  fill: 0xffffff,
  fontFamily: "Press Start 2P",
  fontSize: 24,
  stroke: {
    color: 0x000000,
    width: 5,
  },
});

const winnerLabelStyle = new TextStyle({
  fill: 0xffd633,
  fontFamily: "Press Start 2P",
  fontSize: 10,
  stroke: {
    color: 0x000000,
    width: 3,
  },
});

export class BattleOverlay {
  readonly container = new Container();

  private readonly backdrop: Graphics;
  private readonly text: Text;

  constructor(private readonly ticker: Ticker) {
    this.backdrop = new Graphics()
      .rect(0, 0, BATTLE_WIDTH, BATTLE_HEIGHT)
      .fill(0x000000);

    this.backdrop.alpha = 0;

    this.text = new Text({
      style: overlayStyle,
      text: "",
    });

    this.text.anchor.set(0.5);
    this.text.position.set(BATTLE_WIDTH / 2, BATTLE_HEIGHT / 2);

    this.text.alpha = 0;

    this.container.addChild(this.backdrop, this.text);
  }

  async playIntro(): Promise<void> {
    await this.showMessage("ROUND 1", 450);

    await this.showMessage("FIGHT!", 300);
  }

  async playKnockout(): Promise<void> {
    await this.showMessage("K.O.", 700, 2);
  }

  async playWinner(winnerName: string): Promise<void> {
    await this.showWinner(winnerName);
  }

  private async showWinner(winnerName: string): Promise<void> {
    const label = new Text({
      style: winnerLabelStyle,
      text: "WINNER",
    });

    label.anchor.set(0.5);
    label.position.set(BATTLE_WIDTH / 2, BATTLE_HEIGHT / 2 - 28);
    label.alpha = 0;

    const winner = new Text({
      style: overlayStyle,
      text: winnerName,
    });

    winner.anchor.set(0.5);
    winner.position.set(BATTLE_WIDTH / 2, BATTLE_HEIGHT / 2 + 8);
    winner.alpha = 0;
    winner.scale.set(1.4);

    this.container.addChild(label, winner);

    try {
      await Promise.all([
        tween(this.ticker, {
          durationMs: 180,
          from: 0,
          onUpdate: (alpha) => {
            this.backdrop.alpha = alpha;
          },
          to: 0.65,
        }),

        tween(this.ticker, {
          durationMs: 180,
          from: 0,
          onUpdate: (alpha) => {
            label.alpha = alpha;
            winner.alpha = alpha;
          },
          to: 1,
        }),

        tween(this.ticker, {
          durationMs: 180,
          from: 1.4,
          onUpdate: (scale) => {
            winner.scale.set(scale);
          },
          to: 1,
        }),
      ]);

      await this.wait(1200);

      await Promise.all([
        tween(this.ticker, {
          durationMs: 250,
          from: 1,
          onUpdate: (alpha) => {
            label.alpha = alpha;
            winner.alpha = alpha;
          },
          to: 0,
        }),

        tween(this.ticker, {
          durationMs: 250,
          from: 0.65,
          onUpdate: (alpha) => {
            this.backdrop.alpha = alpha;
          },
          to: 0,
        }),
      ]);
    } finally {
      label.destroy();
      winner.destroy();
    }
  }

  private async showMessage(
    message: string,
    holdMs: number,
    startScale = 1.6,
  ): Promise<void> {
    this.text.text = message;
    this.text.alpha = 0;
    this.text.scale.set(startScale);

    await Promise.all([
      tween(this.ticker, {
        durationMs: 120,
        from: 0,
        onUpdate: (alpha) => {
          this.text.alpha = alpha;
        },
        to: 1,
      }),

      tween(this.ticker, {
        durationMs: 120,
        from: startScale,
        onUpdate: (scale) => {
          this.text.scale.set(scale);
        },
        to: 1,
      }),

      tween(this.ticker, {
        durationMs: 120,
        from: 0,
        onUpdate: (alpha) => {
          this.backdrop.alpha = alpha;
        },
        to: 0.45,
      }),
    ]);

    await this.wait(holdMs);

    await Promise.all([
      tween(this.ticker, {
        durationMs: 160,
        from: 1,
        onUpdate: (alpha) => {
          this.text.alpha = alpha;
        },
        to: 0,
      }),

      tween(this.ticker, {
        durationMs: 160,
        from: 0.45,
        onUpdate: (alpha) => {
          this.backdrop.alpha = alpha;
        },
        to: 0,
      }),
    ]);
  }

  private async wait(durationMs: number): Promise<void> {
    await tween(this.ticker, {
      durationMs,
      from: 0,
      onUpdate: () => { /* empty */ },
      to: 1,
    });
  }
}
