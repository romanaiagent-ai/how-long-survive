/// <reference types="phaser" />
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILE_REVEAL_RADIUS, DEPTH } from '../config';

export class FogOfWar {
  private scene: Phaser.Scene;
  private fog: Phaser.GameObjects.Graphics;
  private visited: boolean[][];
  private lastTileX = -1;
  private lastTileY = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.visited = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false));
    this.fog = scene.add.graphics();
    this.fog.setDepth(DEPTH.FOG);

    // Initial full-black cover
    this.fog.fillStyle(0x000000, 1);
    this.fog.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
  }

  update(playerTileX: number, playerTileY: number): void {
    if (playerTileX === this.lastTileX && playerTileY === this.lastTileY) return;
    this.lastTileX = playerTileX;
    this.lastTileY = playerTileY;

    this.reveal(playerTileX, playerTileY);
    this.redraw(playerTileX, playerTileY);
  }

  private reveal(cx: number, cy: number): void {
    const r = TILE_REVEAL_RADIUS;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
            this.visited[ty][tx] = true;
          }
        }
      }
    }
  }

  private redraw(px: number, py: number): void {
    this.fog.clear();

    const r = TILE_REVEAL_RADIUS;
    const rSq = r * r;

    // Pass 1 — unexplored tiles (fully black)
    this.fog.fillStyle(0x000000, 1);
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        if (!this.visited[ty][tx]) {
          this.fog.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Pass 2 — explored but not currently visible (dim veil)
    this.fog.fillStyle(0x000000, 0.55);
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const distSq = (tx - px) * (tx - px) + (ty - py) * (ty - py);
        if (this.visited[ty][tx] && distSq > rSq) {
          this.fog.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Pass 3 — soft gradient at reveal edge
    this.fog.fillStyle(0x000000, 0.25);
    const edgeSq = (r + 1) * (r + 1);
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const distSq = (tx - px) * (tx - px) + (ty - py) * (ty - py);
        if (this.visited[ty][tx] && distSq > rSq && distSq <= edgeSq) {
          this.fog.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  isVisible(tileX: number, tileY: number): boolean {
    const distSq = (tileX - this.lastTileX) ** 2 + (tileY - this.lastTileY) ** 2;
    return distSq <= TILE_REVEAL_RADIUS * TILE_REVEAL_RADIUS;
  }

  isVisited(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
    return this.visited[tileY][tileX];
  }

  destroy(): void {
    this.fog.destroy();
  }
}
