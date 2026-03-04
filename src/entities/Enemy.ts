/// <reference types="phaser" />
import { TILE_SIZE, DEPTH } from '../config';
import { TileType, isSolid } from '../map/TileTypes';

const enum AIState {
  PATROL = 0,
  CHASE = 1,
  ATTACK = 2,
  STUNNED = 3,
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private aiState = AIState.PATROL;
  private target: Phaser.Physics.Arcade.Sprite | null = null;
  private detectionRadius: number;
  private attackCooldown = 0;
  private patrolTarget: Phaser.Math.Vector2 | null = null;
  private patrolWait = 0;
  private tiles: TileType[][];
  private roomBounds: { x: number; y: number; w: number; h: number }; // pixels
  private enemyLight: Phaser.GameObjects.Light | null = null;
  private speedMult = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    detectionRadius: number,
    roomBounds: { x: number; y: number; w: number; h: number },
    tiles: TileType[][]
  ) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.detectionRadius = detectionRadius;
    this.roomBounds = roomBounds;
    this.tiles = tiles;

    this.setDepth(DEPTH.ENEMIES);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(6, 6);

    try {
      this.enemyLight = scene.lights.addLight(x, y, 80, 0xff6600, 0.35);
      this.setPipeline('Light2D');
    } catch { /* canvas fallback */ }

    this.choosePatrolTarget();
  }

  setTarget(player: Phaser.Physics.Arcade.Sprite): void {
    this.target = player;
  }

  setSpeedMult(mult: number): void {
    this.speedMult = mult;
  }

  updateDetectionRadius(radius: number): void {
    this.detectionRadius = radius;
  }

  // ── Frame update ──────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.active) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    if (this.enemyLight) {
      this.enemyLight.x = this.x;
      this.enemyLight.y = this.y;
    }

    switch (this.aiState) {
      case AIState.PATROL: this.doPatrol(delta); break;
      case AIState.CHASE: this.doChase(); break;
      case AIState.ATTACK: this.doAttack(); break;
      case AIState.STUNNED: this.doStunned(delta); break;
    }
  }

  // ── States ─────────────────────────────────────────────────────────────

  private doPatrol(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.patrolWait > 0) {
      this.patrolWait -= delta;
      body.setVelocity(0, 0);
      this.checkDetection();
      return;
    }

    if (!this.patrolTarget) {
      this.choosePatrolTarget();
      return;
    }

    const dx = this.patrolTarget.x - this.x;
    const dy = this.patrolTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 12) {
      body.setVelocity(0, 0);
      this.patrolWait = 600 + Math.random() * 1200;
      this.choosePatrolTarget();
    } else {
      const spd = 60 * this.speedMult;
      body.setVelocity((dx / dist) * spd, (dy / dist) * spd);
    }

    this.checkDetection();
  }

  private doChase(): void {
    if (!this.target) { this.aiState = AIState.PATROL; return; }
    const body = this.body as Phaser.Physics.Arcade.Body;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 40) {
      body.setVelocity(0, 0);
      this.aiState = AIState.ATTACK;
    } else if (dist > this.detectionRadius * 2 || !this.hasLoS()) {
      this.aiState = AIState.PATROL;
      this.choosePatrolTarget();
    } else {
      const spd = 100 * this.speedMult;
      body.setVelocity((dx / dist) * spd, (dy / dist) * spd);
    }
  }

  private doAttack(): void {
    if (!this.target) { this.aiState = AIState.PATROL; return; }
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    if (dist > 55) {
      this.aiState = AIState.CHASE;
      return;
    }

    if (this.attackCooldown <= 0) {
      const dmg = Phaser.Math.Between(10, 20);
      this.scene.events.emit('enemyAttack', this, dmg);
      this.attackCooldown = 1000;
      this.setTint(0xff4400);
      this.scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    }
  }

  private doStunned(delta: number): void {
    this.attackCooldown -= delta; // reuse as stun timer
    if (this.attackCooldown <= 0) {
      this.aiState = AIState.PATROL;
      this.clearTint();
    }
  }

  // ── Detection ─────────────────────────────────────────────────────────

  private checkDetection(): void {
    if (!this.target) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist < this.detectionRadius && this.hasLoS()) {
      this.aiState = AIState.CHASE;
    }
  }

  /**
   * Bresenham line-of-sight check through the tile grid.
   * Returns true if no solid tile blocks the path.
   */
  private hasLoS(): boolean {
    if (!this.target) return false;

    let x1 = Math.floor(this.x / TILE_SIZE);
    let y1 = Math.floor(this.y / TILE_SIZE);
    const x2 = Math.floor(this.target.x / TILE_SIZE);
    const y2 = Math.floor(this.target.y / TILE_SIZE);

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (x1 !== x2 || y1 !== y2) {
      // Check current cell (skip start cell)
      if (!(x1 === Math.floor(this.x / TILE_SIZE) && y1 === Math.floor(this.y / TILE_SIZE))) {
        if (
          y1 >= 0 && y1 < this.tiles.length &&
          x1 >= 0 && x1 < this.tiles[0].length &&
          isSolid(this.tiles[y1][x1])
        ) {
          return false;
        }
      }
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
    return true;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private choosePatrolTarget(): void {
    const { x, y, w, h } = this.roomBounds;
    const margin = TILE_SIZE;
    const px = x + margin + Math.random() * (w - margin * 2);
    const py = y + margin + Math.random() * (h - margin * 2);
    this.patrolTarget = new Phaser.Math.Vector2(px, py);
  }

  die(): void {
    if (!this.active) return;
    this.scene.events.emit('enemyDied', this);
    if (this.enemyLight) {
      try { this.scene.lights.removeLight(this.enemyLight); } catch { /* ignore */ }
      this.enemyLight = null;
    }
    this.destroy();
  }

  get isChasing(): boolean {
    return this.aiState === AIState.CHASE || this.aiState === AIState.ATTACK;
  }
}
