import Phaser from 'phaser';
import { COLORS, DEPTH } from '../config';

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
    scene.scale.on('resize', this.onResize, this);
  }

  private get W(): number { return this.scene.cameras.main.width; }
  private get H(): number { return this.scene.cameras.main.height; }

  private get isMobile(): boolean {
    return this.W < 600 || this.scene.sys.game.device.input.touch;
  }

  private get scale(): number {
    return this.isMobile ? Math.min(this.W, this.H) / 420 : 1;
  }

  private build(): void {
    const d = DEPTH.HUD;
    const sc = this.scale;
    const barW = Math.round(140 * sc);
    const barH = Math.round(13 * sc);
    const pad = Math.round(14 * sc);
    const fontSize = Math.round(11 * sc);
    const dayFontSize = Math.round(20 * sc);
    const statFontSize = Math.round(12 * sc);

    // ── HP bar ────────────────────────────────────────────────────
    this.hpBarBg = this.scene.add.rectangle(pad + barW / 2, pad + barH / 2, barW, barH, 0x330000)
      .setScrollFactor(0).setDepth(d);
    this.hpBar = this.scene.add.rectangle(pad + barW / 2, pad + barH / 2, barW, barH, COLORS.UI_HP)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0, 0.5).setX(pad);

    this.scene.add.text(pad, pad + barH + 2, 'HP', {
      fontFamily: 'monospace', fontSize: `${fontSize}px`, color: '#cc4444',
    }).setScrollFactor(0).setDepth(d + 2);

    // ── Stamina bar ───────────────────────────────────────────────
    const stY = pad + barH + fontSize + 6;
    this.staminaBarBg = this.scene.add.rectangle(pad + barW / 2, stY + barH / 2, barW, barH, 0x001122)
      .setScrollFactor(0).setDepth(d);
    this.staminaBar = this.scene.add.rectangle(pad + barW / 2, stY + barH / 2, barW, barH, COLORS.UI_STAMINA)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0, 0.5).setX(pad);

    this.scene.add.text(pad, stY + barH + 2, 'STA', {
      fontFamily: 'monospace', fontSize: `${fontSize}px`, color: '#2266cc',
    }).setScrollFactor(0).setDepth(d + 2);

    // ── Top-right stats ───────────────────────────────────────────
    const rx = this.W - pad;
    this.dayText = this.scene.add.text(rx, pad, 'DAY 1', {
      fontFamily: 'monospace', fontSize: `${dayFontSize}px`,
      color: '#eeeeff', stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.killText = this.scene.add.text(rx, pad + dayFontSize + 4, '☠ 0', {
      fontFamily: 'monospace', fontSize: `${statFontSize}px`, color: '#cc6666',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.itemText = this.scene.add.text(rx, pad + dayFontSize + statFontSize + 10, '📦 0', {
      fontFamily: 'monospace', fontSize: `${statFontSize}px`, color: '#ccaa44',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    this.timeText = this.scene.add.text(rx, pad + dayFontSize + statFontSize * 2 + 16, '00:00', {
      fontFamily: 'monospace', fontSize: `${statFontSize}px`, color: '#666688',
    }).setScrollFactor(0).setDepth(d).setOrigin(1, 0);

    // ── Narrative text (center, above joystick on mobile) ─────────
    const narY = this.isMobile ? this.H * 0.62 : this.H * 0.85;
    this.narrativeText = this.scene.add.text(this.W / 2, narY, '', {
      fontFamily: 'monospace',
      fontSize: `${Math.round(14 * sc)}px`,
      color: '#ddddff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: this.W - Math.round(60 * sc) },
    }).setScrollFactor(0).setDepth(DEPTH.NARRATIVE).setOrigin(0.5, 0).setAlpha(0);
  }

  private onResize(): void {
    // Simple reposition of key elements
    const pad = Math.round(14 * this.scale);
    const dayFontSize = Math.round(20 * this.scale);
    const statFontSize = Math.round(12 * this.scale);
    const rx = this.W - pad;
    this.dayText.setPosition(rx, pad);
    this.killText.setPosition(rx, pad + dayFontSize + 4);
    this.itemText.setPosition(rx, pad + dayFontSize + statFontSize + 10);
    this.timeText.setPosition(rx, pad + dayFontSize + statFontSize * 2 + 16);
    const narY = this.isMobile ? this.H * 0.62 : this.H * 0.85;
    this.narrativeText.setPosition(this.W / 2, narY);
    this.narrativeText.setWordWrapWidth(this.W - Math.round(60 * this.scale));
  }

  update(
    hp: number, maxHp: number,
    stamina: number, maxStamina: number,
    day: number, kills: number, items: number, survivalMs: number,
  ): void {
    const sc = this.scale;
    const barW = Math.round(140 * sc);
    const barH = Math.round(13 * sc);
    const pad = Math.round(14 * sc);

    const hpPct = Math.max(0, hp / maxHp);
    this.hpBar.setSize(barW * hpPct, barH);
    this.hpBarBg.setSize(barW, barH);
    this.hpBar.setFillStyle(hpPct < 0.3 ? 0xff2222 : COLORS.UI_HP);

    const staPct = Math.max(0, stamina / maxStamina);
    const stY = pad + barH + Math.round(11 * sc) + 6;
    this.staminaBar.setSize(barW * staPct, barH);
    this.staminaBarBg.setPosition(pad + barW / 2, stY + barH / 2);
    this.staminaBar.setY(stY + barH / 2);

    this.dayText.setText(`DAY ${day}`);
    this.killText.setText(`☠ ${kills}`);
    this.itemText.setText(`📦 ${items}`);
    const s = Math.floor(survivalMs / 1000);
    const m = Math.floor(s / 60);
    this.timeText.setText(`${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
  }

  showNarrative(text: string): void {
    if (this.narrativeTween) { this.narrativeTween.stop(); this.narrativeTween = null; }
    this.narrativeText.setText(text).setAlpha(1);
    this.narrativeTween = this.scene.tweens.add({
      targets: this.narrativeText,
      alpha: 0, delay: 4500, duration: 800, ease: 'Linear',
    });
  }

  showDayBanner(day: number): void {
    const sc = this.scale;
    const banner = this.scene.add.text(this.W / 2, this.H * 0.38, `— DAY ${day} —`, {
      fontFamily: 'monospace',
      fontSize: `${Math.round(28 * sc)}px`,
      color: '#ffcc44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(DEPTH.NARRATIVE).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: banner, alpha: { from: 0, to: 1 },
      duration: 400, yoyo: true, hold: 1200,
      onComplete: () => banner.destroy(),
    });
  }
}
