import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEPTH } from '../config';
import { ArchetypeEngine, type ArchetypeInput } from '../systems/ArchetypeEngine';
import { GlobalStats } from '../systems/GlobalStats';
import { getDailySeed } from '../systems/DailySeed';
import { buildShareText, renderShareCard } from '../ui/ShareCard';
import type { PlayerTraits } from '../systems/NarrativeEngine';

interface ResultData {
  daysAlive: number;
  killCount: number;
  itemsCollected: number;
  damageTaken: number;
  damageDealt: number;
  survivalTime: number;
  traits: PlayerTraits;
  seed: number;
  isDaily: boolean;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    const d: ResultData = {
      daysAlive: data.daysAlive ?? 1,
      killCount: data.killCount ?? 0,
      itemsCollected: data.itemsCollected ?? 0,
      damageTaken: data.damageTaken ?? 0,
      damageDealt: data.damageDealt ?? 0,
      survivalTime: data.survivalTime ?? 0,
      traits: data.traits ?? { aggression: 0, caution: 0, intelligence: 0, riskTaking: 0, stealth: 0, trust: 50 },
      seed: data.seed ?? 0,
      isDaily: data.isDaily ?? false,
    };

    // Compute archetype
    const archetypeInput: ArchetypeInput = {
      traits: d.traits,
      daysAlive: d.daysAlive,
      survivalTime: d.survivalTime,
      killCount: d.killCount,
      itemsCollected: d.itemsCollected,
      damageTaken: d.damageTaken,
      damageDealt: d.damageDealt,
    };
    const engine = new ArchetypeEngine();
    const archetype = engine.compute(archetypeInput);

    // Global stats
    const globalStats = new GlobalStats(getDailySeed());
    const gs = globalStats.generate(d.daysAlive);

    this.drawBackground();
    this.buildUI(d, archetype, gs);
  }

  private drawBackground(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(COLORS.BACKGROUND, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x1a1a2e, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 40) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 40) g.lineBetween(0, y, GAME_WIDTH, y);
  }

  private buildUI(
    d: ResultData,
    archetype: ReturnType<ArchetypeEngine['compute']>,
    gs: ReturnType<GlobalStats['generate']>,
  ): void {
    const cx = GAME_WIDTH / 2;
    const dp = DEPTH.HUD;

    // YOU DIED
    this.add.text(cx, 40, 'YOU DIED', {
      fontFamily: 'monospace', fontSize: '40px', color: '#cc2222',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(dp);

    // Days survived
    const s = Math.floor(d.survivalTime / 1000);
    const m = Math.floor(s / 60);
    const timeStr = `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    this.add.text(cx, 100, `Survived ${d.daysAlive} day${d.daysAlive === 1 ? '' : 's'}  •  ${timeStr}`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#eeeeff',
    }).setOrigin(0.5).setDepth(dp);

    // Archetype card
    const cardY = 195;
    const cardW = 480;
    const cardH = 110;
    this.add.rectangle(cx, cardY, cardW, cardH, 0x0f0f1e).setDepth(dp);
    this.add.rectangle(cx, cardY, cardW, cardH).setStrokeStyle(1, 0x3333aa).setFillStyle().setDepth(dp + 1);

    this.add.text(cx - cardW / 2 + 16, cardY - 44, archetype.emoji, {
      fontFamily: 'monospace', fontSize: '42px',
    }).setDepth(dp + 2);

    this.add.text(cx - cardW / 2 + 72, cardY - 40, archetype.name, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffcc44',
    }).setDepth(dp + 2);

    this.add.text(cx - cardW / 2 + 72, cardY - 14, `"${archetype.tagline}"`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#6666aa', fontStyle: 'italic',
    }).setDepth(dp + 2);

    this.add.text(cx - cardW / 2 + 16, cardY + 14, archetype.description, {
      fontFamily: 'monospace', fontSize: '12px', color: '#8888aa',
      wordWrap: { width: cardW - 32 },
    }).setDepth(dp + 2);

    // Stats row
    const statsY = 290;
    const statItems = [
      { label: 'Kills', value: String(d.killCount) },
      { label: 'Loot', value: String(d.itemsCollected) },
      { label: 'Damage taken', value: String(d.damageTaken) },
      { label: 'Damage dealt', value: String(d.damageDealt) },
    ];

    const colW = 160;
    const startX = cx - (colW * statItems.length) / 2 + colW / 2;
    statItems.forEach((item, i) => {
      const sx = startX + i * colW;
      this.add.text(sx, statsY, item.value, {
        fontFamily: 'monospace', fontSize: '24px', color: '#eeeeff',
      }).setOrigin(0.5).setDepth(dp);
      this.add.text(sx, statsY + 26, item.label, {
        fontFamily: 'monospace', fontSize: '11px', color: '#555577',
      }).setOrigin(0.5).setDepth(dp);
    });

    // Global stats
    this.add.text(cx, 355, `You survived longer than ${gs.percentileSurvival}% of players today  •  ${gs.totalPlayersToday.toLocaleString()} runs`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#444466',
    }).setOrigin(0.5).setDepth(dp);

    // Buttons
    this.createButton(cx - 110, 430, 'PLAY AGAIN', () => {
      this.scene.start('MenuScene');
    });

    this.createButton(cx + 110, 430, 'SHARE', () => {
      this.handleShare(d, archetype);
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const w = 180;
    const h = 44;
    const bg = this.add.rectangle(x, y, w, h, 0x1a1a2e).setInteractive({ useHandCursor: true }).setDepth(DEPTH.HUD);
    this.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x3333aa).setFillStyle().setDepth(DEPTH.HUD + 1);
    const t = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '16px', color: '#eeeeff',
    }).setOrigin(0.5).setDepth(DEPTH.HUD + 2);

    bg.on('pointerover', () => { bg.setFillStyle(0x2a2a4e); t.setColor('#ff6644'); });
    bg.on('pointerout', () => { bg.setFillStyle(0x1a1a2e); t.setColor('#eeeeff'); });
    bg.on('pointerdown', onClick);
  }

  private handleShare(d: ResultData, archetype: ReturnType<ArchetypeEngine['compute']>): void {
    const shareData = {
      daysAlive: d.daysAlive,
      killCount: d.killCount,
      itemsCollected: d.itemsCollected,
      survivalTime: d.survivalTime,
      archetype,
      isDaily: d.isDaily,
    };

    const text = buildShareText(shareData);

    if (navigator.share) {
      navigator.share({ title: 'How Long Can You Survive?', text }).catch(() => {
        this.copyToClipboard(text);
      });
    } else {
      // Try to open share card image
      try {
        const dataUrl = renderShareCard(shareData);
        const win = window.open();
        if (win) {
          win.document.write(`<img src="${dataUrl}" style="max-width:100%"/><pre style="font-family:monospace;background:#0d0d1a;color:#eeeeff;padding:16px">${text}</pre>`);
          win.document.close();
        }
      } catch {
        this.copyToClipboard(text);
      }
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard?.writeText(text).catch(() => {});
    // Show brief notification
    const notif = this.add.text(GAME_WIDTH / 2, 480, 'Copied to clipboard!', {
      fontFamily: 'monospace', fontSize: '14px', color: '#44ff88',
    }).setOrigin(0.5).setDepth(DEPTH.MODAL);

    this.tweens.add({
      targets: notif,
      alpha: 0,
      delay: 1800,
      duration: 400,
      onComplete: () => notif.destroy(),
    });
  }
}
