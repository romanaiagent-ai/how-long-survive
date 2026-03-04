import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    // Player texture: blue circle 32x32
    const pg = this.make.graphics({ x: 0, y: 0 }, false);
    pg.fillStyle(COLORS.PLAYER, 1);
    pg.fillCircle(16, 16, 13);
    pg.fillStyle(COLORS.PLAYER_CORE, 0.8);
    pg.fillCircle(16, 16, 7);
    pg.generateTexture('player', TILE_SIZE, TILE_SIZE);
    pg.destroy();

    // Enemy texture: orange circle 32x32
    const eg = this.make.graphics({ x: 0, y: 0 }, false);
    eg.fillStyle(COLORS.ENEMY, 1);
    eg.fillCircle(16, 16, 13);
    eg.fillStyle(COLORS.ENEMY_CORE, 0.8);
    eg.fillCircle(16, 16, 7);
    eg.generateTexture('enemy', TILE_SIZE, TILE_SIZE);
    eg.destroy();

    // Loot texture: yellow circle 24x24
    const lg = this.make.graphics({ x: 0, y: 0 }, false);
    lg.fillStyle(COLORS.LOOT_GLOW, 0.6);
    lg.fillCircle(12, 12, 11);
    lg.fillStyle(COLORS.LOOT, 1);
    lg.fillCircle(12, 12, 7);
    lg.generateTexture('loot', 24, 24);
    lg.destroy();

    // Block texture: 32x32 solid white (used for invisible physics bodies)
    const bg = this.make.graphics({ x: 0, y: 0 }, false);
    bg.fillStyle(0xffffff, 1);
    bg.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    bg.generateTexture('block', TILE_SIZE, TILE_SIZE);
    bg.destroy();
  }
}
