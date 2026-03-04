import type { ArchetypeResult } from '../systems/ArchetypeEngine';

export interface ShareData {
  daysAlive: number;
  killCount: number;
  itemsCollected: number;
  survivalTime: number; // ms
  archetype: ArchetypeResult;
  isDaily: boolean;
}

/** Generates a share text string for social media */
export function buildShareText(data: ShareData): string {
  const s = Math.floor(data.survivalTime / 1000);
  const m = Math.floor(s / 60);
  const timeStr = `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const mode = data.isDaily ? '📅 Daily Run' : '🎲 Random Run';

  return [
    `${data.archetype.emoji} I survived ${data.daysAlive} day${data.daysAlive === 1 ? '' : 's'} in How Long Can You Survive?`,
    ``,
    `${mode}`,
    `⚔️  Kills: ${data.killCount}`,
    `🎒  Loot: ${data.itemsCollected}`,
    `⏱️  Time: ${timeStr}`,
    ``,
    `Archetype: ${data.archetype.name}`,
    `"${data.archetype.tagline}"`,
    ``,
    `Play at: https://how-long-survive.vercel.app`,
  ].join('\n');
}

/** Renders a share card onto an HTML Canvas and returns a data URL */
export function renderShareCard(data: ShareData): string {
  const W = 600;
  const H = 320;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = '#ff3300';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Title
  ctx.fillStyle = '#eeeeff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('HOW LONG CAN YOU SURVIVE?', 24, 36);

  // Mode
  ctx.fillStyle = '#666688';
  ctx.font = '13px monospace';
  ctx.fillText(data.isDaily ? 'Daily Run' : 'Random Run', 24, 58);

  // Big day count
  ctx.fillStyle = '#ffcc44';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(`${data.daysAlive}`, 24, 140);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '16px monospace';
  ctx.fillText(`day${data.daysAlive === 1 ? '' : 's'} survived`, 24, 164);

  // Stats
  const s = Math.floor(data.survivalTime / 1000);
  const m = Math.floor(s / 60);
  const timeStr = `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const stats = [
    `Kills: ${data.killCount}`,
    `Loot:  ${data.itemsCollected}`,
    `Time:  ${timeStr}`,
  ];

  ctx.fillStyle = '#8888aa';
  ctx.font = '14px monospace';
  stats.forEach((line, i) => {
    ctx.fillText(line, 24, 200 + i * 22);
  });

  // Archetype (right side)
  ctx.fillStyle = '#eeeeff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(data.archetype.emoji, W - 24, 100);

  ctx.font = 'bold 22px monospace';
  ctx.fillText(data.archetype.name, W - 24, 140);

  ctx.fillStyle = '#6666aa';
  ctx.font = 'italic 13px monospace';
  // wrap tagline
  const words = data.archetype.tagline.split(' ');
  let line = '';
  let lineY = 168;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > 220) {
      ctx.fillText(line, W - 24, lineY);
      lineY += 18;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, W - 24, lineY);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333355';
  ctx.font = '11px monospace';
  ctx.fillText('how-long-survive.vercel.app', W / 2, H - 14);

  return canvas.toDataURL('image/png');
}
