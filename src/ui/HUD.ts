import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, DEPTH } from '../config';

export class HUD {
  private scene: Phaser.Scene;

  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private staminaBar!: Phaser.GameObjects.Rectangle;
  private staminaBarBg!: Phaser.GameObjects.Rectangle;
  private dayText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private itemText!: Phaser.GameObjects.Text;
  private narrativeText!: Phaser.GameObjects.Text;
  private narrativeTween: Phaser.Tweens.Tween | null = null;

  private readonly BAR_W = 160;
  private readonly BAR_H = 14;
  private readonly PAD = 14;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  private build(): void {
    const d = DEPTH.HUD;
    const p = this.PAD;

    // HP bar background
    this.hpBarBg = this.scene.add.rectangle(p + this.BAR_W / 2, p + 10, this.BAR_W, this.BAR_H, 0x220000)
      .setScrollFactor(0).setDepth(d);
    this.hpBar = this.scene.add.rectangle(p + this.BAR_W / 2, p + 10, this.BAR_W, this.BAR_H, COLORS.UI_HP)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0.5);

    this.scene.add.text(p, p + 23, 'HP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#cc4444',
    }).setScrollFactor(0).setDepth(d + 2);

    // Stamina bar background
    this.staminaBarBg = this.scene.add.rectangle(p + this.BAR_W / 2, p + 36, this.BAR_W, this.BAR_H, 0x001122)
      .setScrollFactor(0).setDepth(d);
    this.staminaBar = this.scene.add.rectangle(p + this.BAR_W / 2, p + 36, this.BAR_W, this.BAR_H, COLORS.UI_STAMINA)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0.5);

    this.scene.add.text(p, p + 49, 'STA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2266cc',
    }).setScrollFactor(0).setDepth(d + 2);

    // Stats (top right)
    const rx = GAME_WIDTH - p;
    this.dayText = this.scene.add.text(rx, p, 'DAY 1', {
      fontFamily: 'monospace', fontSize: '20px', color: '#eeeeff', stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.killText = this.scene.add.text(rx, p + 28, 'Kills: 0', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaacc',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.itemText = this.scene.add.text(rx, p + 46, 'Loot: 0', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaaacc',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.timeText = this.scene.add.text(rx, p + 64, '00:00', {
      fontFamily: 'monospace', fontSize: '13px', color: '#666688',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    // Narrative text (center bottom)
    this.narrativeText = this.scene.add.text(GAME_WIDTH / 2, 640, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ddddff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 80 },
    }).setScrollFactor(0).setDepth(DEPTH.NARRATIVE).setOrigin(0.5, 0).setAlpha(0);

    // Suppress unused variable
    void this.hpBarBg;
    void this.staminaBarBg;
  }

  update(hp: number, maxHp: number, stamina: number, maxStamina: number, day: number, kills: number, items: number, survivalMs: number): void {
    // HP bar
    const hpPct = Math.max(0, hp / maxHp);
    this.hpBar.setSize(this.BAR_W * hpPct, this.BAR_H);
    this.hpBar.setX(this.PAD + (this.BAR_W * hpPct) / 2);
    this.hpBar.setFillStyle(hpPct < 0.3 ? 0xff2222 : COLORS.UI_HP);

    // Stamina bar
    const staPct = Math.max(0, stamina / maxStamina);
    this.staminaBar.setSize(this.BAR_W * staPct, this.BAR_H);
    this.staminaBar.setX(this.PAD + (this.BAR_W * staPct) / 2);

    // Text
    this.dayText.setText(`DAY ${day}`);
    this.killText.setText(`Kills: ${kills}`);
    this.itemText.setText(`Loot: ${items}`);

    const s = Math.floor(survivalMs / 1000);
    const m = Math.floor(s / 60);
    this.timeText.setText(`${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
  }

  showNarrative(text: string): void {
    if (this.narrativeTween) {
      this.narrativeTween.stop();
      this.narrativeTween = null;
    }

    this.narrativeText.setText(text).setAlpha(1);

    this.narrativeTween = this.scene.tweens.add({
      targets: this.narrativeText,
      alpha: 0,
      delay: 4500,
      duration: 800,
      ease: 'Linear',
    });
  }

  showDayBanner(day: number): void {
    const banner = this.scene.add.text(GAME_WIDTH / 2, 280, `— DAY ${day} —`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffcc44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(DEPTH.NARRATIVE).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      duration: 400,
      yoyo: true,
      hold: 1200,
      onComplete: () => banner.destroy(),
    });
  }
}
