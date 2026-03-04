import Phaser from 'phaser';
import { TILE_SIZE } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.createTextures();
    this.createSounds();
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    // ── NINJA PLAYER (48x48) ──────────────────────────────────────────
    const S = 48;
    const pg = this.make.graphics({ x: 0, y: 0 }, false);

    // Shadow
    pg.fillStyle(0x000000, 0.25);
    pg.fillEllipse(24, 43, 28, 8);

    // Body — dark navy gi
    pg.fillStyle(0x1a1a2e, 1);
    pg.fillRoundedRect(14, 22, 20, 18, 4);

    // Belt sash — dark red
    pg.fillStyle(0x8b0000, 1);
    pg.fillRect(14, 30, 20, 4);

    // Legs
    pg.fillStyle(0x111122, 1);
    pg.fillRoundedRect(14, 38, 8, 8, 2);
    pg.fillRoundedRect(26, 38, 8, 8, 2);

    // Head — slightly lighter
    pg.fillStyle(0x2a2a3e, 1);
    pg.fillCircle(24, 16, 11);

    // Mask / face wrap — dark red
    pg.fillStyle(0x8b0000, 1);
    pg.fillRect(14, 14, 20, 6); // lower face wrap
    pg.fillRect(14, 8, 20, 3);  // headband

    // Eyes — glowing white slits
    pg.fillStyle(0xffffff, 1);
    pg.fillRect(17, 11, 4, 3);
    pg.fillRect(27, 11, 4, 3);

    // Eye glow — cyan
    pg.fillStyle(0x00ffff, 0.7);
    pg.fillRect(18, 12, 2, 2);
    pg.fillRect(28, 12, 2, 2);

    // Katana — right side
    pg.fillStyle(0xcccccc, 1);
    pg.fillRect(34, 6, 2, 28);   // blade
    pg.fillStyle(0x8b4513, 1);
    pg.fillRect(33, 20, 4, 8);   // handle
    pg.fillStyle(0xffd700, 1);
    pg.fillRect(32, 19, 6, 3);   // guard
    pg.fillRect(32, 27, 6, 2);

    // Arms
    pg.fillStyle(0x1a1a2e, 1);
    pg.fillRoundedRect(8, 24, 7, 14, 2);   // left arm
    pg.fillRoundedRect(33, 24, 7, 14, 2);  // right arm

    // Shuriken on belt
    pg.fillStyle(0x888899, 1);
    pg.fillRect(17, 31, 4, 4);
    pg.fillRect(19, 29, 2, 8);

    pg.generateTexture('player', S, S);
    pg.destroy();

    // ── ZOMBIE ENEMY (48x48) ────────────────────────────────────────
    const zg = this.make.graphics({ x: 0, y: 0 }, false);

    // Shadow
    zg.fillStyle(0x000000, 0.2);
    zg.fillEllipse(24, 44, 26, 7);

    // Torn, decaying legs
    zg.fillStyle(0x3a2a1a, 1);
    zg.fillRoundedRect(13, 36, 9, 10, 2);
    zg.fillRoundedRect(26, 37, 8, 9, 2);  // uneven — one dragging

    // Body — ragged, rotting clothes
    zg.fillStyle(0x2d3a1e, 1);                // dark mold green shirt
    zg.fillRoundedRect(12, 20, 24, 18, 3);

    // Exposed decaying flesh patches
    zg.fillStyle(0x5a7a3a, 0.8);
    zg.fillRect(13, 23, 5, 8);
    zg.fillRect(31, 26, 4, 6);

    // Wound gashes — dark red
    zg.fillStyle(0x660000, 0.9);
    zg.fillRect(18, 24, 8, 2);
    zg.fillRect(16, 28, 5, 1);
    zg.fillRect(25, 27, 6, 2);

    // Head — bloated, sickly
    zg.fillStyle(0x4a6030, 1);   // sickly green-gray
    zg.fillCircle(24, 14, 12);

    // Skull damage
    zg.fillStyle(0x3a4a25, 1);
    zg.fillRect(14, 8, 5, 3);
    zg.fillRect(30, 10, 4, 4);

    // Hollow sunken eyes — glowing sickly yellow
    zg.fillStyle(0x111100, 1);
    zg.fillCircle(19, 13, 4);
    zg.fillCircle(29, 13, 4);
    zg.fillStyle(0xaacc00, 0.9);
    zg.fillCircle(19, 13, 2);
    zg.fillCircle(29, 13, 2);
    zg.fillStyle(0xffff00, 1);
    zg.fillCircle(19, 13, 1);
    zg.fillCircle(29, 13, 1);

    // Exposed teeth / hanging jaw
    zg.fillStyle(0x222200, 1);
    zg.fillRect(17, 19, 14, 4);   // open mouth / dark cavity
    zg.fillStyle(0xddccaa, 0.8);
    zg.fillRect(18, 19, 3, 3);    // teeth
    zg.fillRect(23, 19, 3, 3);
    zg.fillRect(28, 20, 2, 2);

    // Arms — outstretched, reaching
    zg.fillStyle(0x4a6030, 1);
    zg.fillRoundedRect(3, 20, 10, 7, 2);    // left arm reaching out
    zg.fillRoundedRect(35, 18, 10, 7, 2);   // right arm reaching out

    // Clawed hands
    zg.fillStyle(0x3a4a25, 1);
    zg.fillRect(0, 21, 4, 3);     // left claws
    zg.fillRect(44, 19, 4, 3);    // right claws
    // claw lines
    zg.fillStyle(0x222200, 1);
    zg.fillRect(1, 21, 1, 4);
    zg.fillRect(2, 21, 1, 5);
    zg.fillRect(3, 21, 1, 4);
    zg.fillRect(44, 19, 1, 4);
    zg.fillRect(45, 19, 1, 5);
    zg.fillRect(46, 19, 1, 4);

    zg.generateTexture('enemy', S, S);
    zg.destroy();

    // ── LOOT — supply crate / medkit (32x32) ────────────────────────
    const lg = this.make.graphics({ x: 0, y: 0 }, false);
    // Crate body
    lg.fillStyle(0x5a4020, 1);
    lg.fillRoundedRect(4, 8, 24, 18, 3);
    lg.fillStyle(0x7a5a30, 1);
    lg.fillRoundedRect(5, 9, 22, 16, 2);
    // Crate bands
    lg.fillStyle(0x3a2a10, 1);
    lg.fillRect(4, 14, 24, 3);
    lg.fillRect(14, 8, 4, 18);
    // Red cross on top
    lg.fillStyle(0xff2222, 1);
    lg.fillRect(12, 10, 8, 3);
    lg.fillRect(14, 8, 4, 7);
    // Glow
    lg.fillStyle(0xffcc44, 0.4);
    lg.fillCircle(16, 17, 14);
    lg.generateTexture('loot', TILE_SIZE, TILE_SIZE);
    lg.destroy();

    // Block (invisible wall physics body)
    const bg = this.make.graphics({ x: 0, y: 0 }, false);
    bg.fillStyle(0xffffff, 1);
    bg.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    bg.generateTexture('block', TILE_SIZE, TILE_SIZE);
    bg.destroy();
  }

  private createSounds(): void {
    const ctx = (this.sound as any).context as AudioContext | undefined;
    if (!ctx) return;

    // Helper: create a short buffer sound and add it to Phaser cache
    const bake = (key: string, fn: (ctx: AudioContext, buf: AudioBuffer) => void, duration: number, sr = 22050) => {
      try {
        const buf = ctx.createBuffer(1, Math.ceil(sr * duration), sr);
        fn(ctx, buf);
        // Store raw buffer — we'll use Web Audio directly via SoundManager
        (this.cache as any).custom = (this.cache as any).custom || {};
        (this.cache as any).custom[key] = buf;
      } catch { /* audio ctx not ready */ }
    };

    // Footstep — soft thud
    bake('sfx_step', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25) * 0.3;
      }
    }, 0.12);

    // Sword slash
    bake('sfx_slash', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18) * Math.sin(2 * Math.PI * 800 * t) * 0.5;
      }
    }, 0.15);

    // Hit / damage
    bake('sfx_hit', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.6;
      }
    }, 0.2);

    // Loot pickup — bright ding
    bake('sfx_loot', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 8) * 0.4
             + Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 10) * 0.2;
      }
    }, 0.3);

    // Day advance — low horn
    bake('sfx_day', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = Math.sin(2 * Math.PI * (220 + t * 80) * t) * Math.exp(-t * 3) * 0.5;
      }
    }, 0.6);

    // Death groan
    bake('sfx_death', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        d[i] = Math.sin(2 * Math.PI * (120 - t * 60) * t) * Math.exp(-t * 2) * 0.55
             + (Math.random() * 2 - 1) * Math.exp(-t * 3) * 0.15;
      }
    }, 0.8);

    // Zombie growl
    bake('sfx_growl', (_c, buf) => {
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / buf.sampleRate;
        const freq = 80 + Math.sin(t * 12) * 20;
        d[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4) * 0.45
             + (Math.random() * 2 - 1) * 0.08;
      }
    }, 0.5);

    // Store buffer keys for GameScene to access
    (this.registry as any).set('soundBuffers', (this.cache as any).custom || {});
  }
}
