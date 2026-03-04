/// <reference types="phaser" />
import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_MAX_STAMINA,
  TILE_SIZE,
  DEPTH,
} from '../config';
import type { PlayerTraits } from '../systems/NarrativeEngine';

export class Player extends Phaser.Physics.Arcade.Sprite {
  // ── Stats ──────────────────────────────────────────────────────────────
  hp = PLAYER_MAX_HP;
  readonly maxHp = PLAYER_MAX_HP;
  stamina = PLAYER_MAX_STAMINA;
  speed = PLAYER_SPEED;

  // ── Hidden traits (0–100) ──────────────────────────────────────────────
  aggression = 0;
  caution = 0;
  intelligence = 0;
  riskTaking = 0;
  stealth = 0;
  trust = 50;

  // ── Tracked stats ──────────────────────────────────────────────────────
  killCount = 0;
  itemsCollected = 0;
  damageDealt = 0;
  damageTaken = 0;
  daysAlive = 1;

  // ── Input ──────────────────────────────────────────────────────────────
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // ── Joystick (mobile) ──────────────────────────────────────────────────
  joystickDir: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  joystickActive = false;

  // ── Lighting ──────────────────────────────────────────────────────────
  private playerLight!: Phaser.GameObjects.Light;
  private pulseTimer = 0;

  // ── Tile tracking ─────────────────────────────────────────────────────
  private _lastTileX = -1;
  private _lastTileY = -1;

  // ── State ──────────────────────────────────────────────────────────────
  private _isDead = false;
  private _speedBoostTimer = 0;
  private _invincibleTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.PLAYER);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(6, 6);

    // Keyboard
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Lighting
    try {
      this.playerLight = scene.lights.addLight(x, y, 220, 0xffffff, 1.5);
      this.setPipeline('Light2D');
    } catch {
      // Lighting not available (canvas renderer)
    }
  }

  update(_time: number, delta: number): void {
    if (this._isDead) return;

    this._speedBoostTimer = Math.max(0, this._speedBoostTimer - delta);
    this._invincibleTimer = Math.max(0, this._invincibleTimer - delta);
    this.pulseTimer += delta;

    this.handleMovement();
    this.updateLight();
    this.regenStamina(delta);
  }

  private handleMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    if (this.joystickActive) {
      vx = this.joystickDir.x;
      vy = this.joystickDir.y;
    } else {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
      else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
      else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

      // Normalise diagonal
      if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
      }
    }

    const spd = this.speed * (this._speedBoostTimer > 0 ? 1.6 : 1);
    body.setVelocity(vx * spd, vy * spd);

    // Trait: stealth when idle
    if (vx === 0 && vy === 0) {
      this.stealth = Math.min(100, this.stealth + 0.05);
    } else {
      this.stealth = Math.max(0, this.stealth - 0.02);
    }
  }

  private updateLight(): void {
    if (!this.playerLight) return;
    this.playerLight.x = this.x;
    this.playerLight.y = this.y;

    const hpPct = this.hp / this.maxHp;
    if (hpPct < 0.3) {
      const pulse = 0.8 + Math.sin(this.pulseTimer / 200) * 0.35;
      this.playerLight.setColor(0xff3300);
      this.playerLight.setIntensity(pulse);
    } else {
      this.playerLight.setColor(0xffffff);
      this.playerLight.setIntensity(1.5);
    }
  }

  private regenStamina(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5;
    if (moving) {
      this.stamina = Math.max(0, this.stamina - delta * 0.02);
    } else {
      this.stamina = Math.min(PLAYER_MAX_STAMINA, this.stamina + delta * 0.04);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  takeDamage(amount: number): void {
    if (this._isDead || this._invincibleTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.damageTaken += amount;
    this._invincibleTimer = 400; // brief invincibility frames

    this.setTint(0xff2222);
    this.scene.time.delayedCall(250, () => {
      if (!this._isDead) this.clearTint();
    });

    if (this.hp / this.maxHp < 0.3) this.riskTaking = Math.min(100, this.riskTaking + 3);

    if (this.hp <= 0) this.die();
  }

  collectItem(): void {
    this.itemsCollected++;
    this.hp = Math.min(this.maxHp, this.hp + 15); // loot heals
    this.caution = Math.min(100, this.caution + 3);
    this.intelligence = Math.min(100, this.intelligence + 2);
  }

  recordKill(damageDealt = 0): void {
    this.killCount++;
    this.damageDealt += damageDealt;
    this.aggression = Math.min(100, this.aggression + 4);
    this.riskTaking = Math.min(100, this.riskTaking + 2);
  }

  applySpeedBoost(duration: number): void {
    this._speedBoostTimer = duration;
  }

  applyHpDelta(delta: number): void {
    if (delta < 0) {
      this.takeDamage(-delta);
    } else {
      this.hp = Math.min(this.maxHp, this.hp + delta);
    }
  }

  applyTraitDeltas(deltas: Partial<{ aggression: number; caution: number; intelligence: number; riskTaking: number; stealth: number; trust: number }>): void {
    if (deltas.aggression) this.aggression = Math.max(0, Math.min(100, this.aggression + deltas.aggression));
    if (deltas.caution) this.caution = Math.max(0, Math.min(100, this.caution + deltas.caution));
    if (deltas.intelligence) this.intelligence = Math.max(0, Math.min(100, this.intelligence + deltas.intelligence));
    if (deltas.riskTaking) this.riskTaking = Math.max(0, Math.min(100, this.riskTaking + deltas.riskTaking));
    if (deltas.stealth) this.stealth = Math.max(0, Math.min(100, this.stealth + deltas.stealth));
    if (deltas.trust) this.trust = Math.max(0, Math.min(100, this.trust + deltas.trust));
  }

  private die(): void {
    this._isDead = true;
    if (this.playerLight) this.playerLight.setIntensity(0);
    this.setTint(0x440000);
    this.scene.events.emit('playerDied');
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  get isAlive(): boolean {
    return !this._isDead;
  }

  get hpPercent(): number {
    return this.hp / this.maxHp;
  }

  get tileX(): number {
    return Math.floor(this.x / TILE_SIZE);
  }

  get tileY(): number {
    return Math.floor(this.y / TILE_SIZE);
  }

  hasMovedTile(): boolean {
    const tx = this.tileX;
    const ty = this.tileY;
    if (tx !== this._lastTileX || ty !== this._lastTileY) {
      this._lastTileX = tx;
      this._lastTileY = ty;
      return true;
    }
    return false;
  }

  getTraits(): PlayerTraits {
    return {
      aggression: this.aggression,
      caution: this.caution,
      intelligence: this.intelligence,
      riskTaking: this.riskTaking,
      stealth: this.stealth,
      trust: this.trust,
    };
  }
}
