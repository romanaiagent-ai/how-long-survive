import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { getDailySeed, getRandomSeed } from '../systems/DailySeed';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.drawBackground();
    this.buildUI();
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.BACKGROUND, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid
    g.lineStyle(1, 0x1a1a2e, 0.5);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      g.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      g.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  private buildUI(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Title
    this.add.text(cx, cy - 160, 'HOW LONG CAN YOU SURVIVE?', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#eeeeff',
      stroke: '#ff3300',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 110, 'A daily survival roguelike', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#6666aa',
    }).setOrigin(0.5);

    // Daily Run button
    this.createButton(cx, cy - 20, 'DAILY RUN', 'Same seed for everyone today', () => {
      this.scene.start('GameScene', { seed: getDailySeed(), isDaily: true });
    });

    // Random Run button
    this.createButton(cx, cy + 70, 'RANDOM RUN', 'New seed every run', () => {
      this.scene.start('GameScene', { seed: getRandomSeed(), isDaily: false });
    });

    // Instructions
    this.add.text(cx, cy + 160, 'WASD / Arrow Keys to move  •  Collect loot  •  Survive as long as possible', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#444466',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 185, 'Each day brings more enemies  •  Narrative events shape your run', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#444466',
    }).setOrigin(0.5);

    // Version
    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 12, 'v1.0', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#333355',
    }).setOrigin(1, 1);
  }

  private createButton(x: number, y: number, label: string, subtitle: string, onClick: () => void): void {
    const w = 340;
    const h = 60;

    const bg = this.add.rectangle(x, y, w, h, 0x1a1a2e, 1)
      .setInteractive({ useHandCursor: true });
    const border = this.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x3333aa, 1).setFillStyle();

    const labelText = this.add.text(x, y - 8, label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#eeeeff',
    }).setOrigin(0.5);

    this.add.text(x, y + 12, subtitle, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#4444aa',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4e);
      border.setStrokeStyle(1, COLORS.UI_ACCENT);
      labelText.setColor('#ff6644');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e);
      border.setStrokeStyle(1, 0x3333aa);
      labelText.setColor('#eeeeff');
    });
    bg.on('pointerdown', onClick);

    // Also handle keyboard: if button is "focused" first time
    border; // used to suppress unused warning
  }
}
