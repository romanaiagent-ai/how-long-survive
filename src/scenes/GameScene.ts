import Phaser from 'phaser';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  COLORS, DEPTH, DAY_DURATION, PLAYER_MAX_STAMINA,
} from '../config';
import { SeedRNG } from '../systems/SeedRNG';
import { DifficultySystem } from '../systems/DifficultySystem';
import { NarrativeEngine } from '../systems/NarrativeEngine';
import { RoomGenerator } from '../map/RoomGenerator';
import { TileType, isSolid } from '../map/TileTypes';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { FogOfWar } from '../systems/FogOfWar';
import { HUD } from '../ui/HUD';
import { SoundManager } from '../systems/SoundManager';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import type { Room } from '../map/TileTypes';

interface SceneData {
  seed: number;
  isDaily: boolean;
}

export class GameScene extends Phaser.Scene {
  private seed = 0;
  private isDaily = false;

  private rng!: SeedRNG;
  private difficulty!: DifficultySystem;
  private narrative!: NarrativeEngine;

  private tiles: TileType[][] = [];
  private rooms: Room[] = [];
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;

  private player!: Player;
  private enemies: Enemy[] = [];
  private enemyPhysicsGroup!: Phaser.Physics.Arcade.Group;
  private lootGroup!: Phaser.Physics.Arcade.StaticGroup;

  private fog!: FogOfWar;
  private hud!: HUD;
  private sfx!: SoundManager;
  private joystick!: VirtualJoystick;
  private isMobile = false;

  private tension = 0;
  private lastNarrativeTime = 0;
  private dayTimer!: Phaser.Time.TimerEvent;
  private spawnCheckTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: SceneData): void {
    this.seed = data.seed ?? Math.floor(Math.random() * 999999);
    this.isDaily = data.isDaily ?? false;
  }

  create(): void {
    this.rng = new SeedRNG(this.seed);
    this.difficulty = new DifficultySystem(this.isDaily);
    this.narrative = new NarrativeEngine(this.rng);

    // Enable lighting pipeline before any sprites use Light2D
    this.lights.enable().setAmbientColor(0x282828);

    // Sound manager
    const ctx = ((this.sound as any).context as AudioContext | null) ?? null;
    this.sfx = new SoundManager(ctx);
    const buffers = this.registry.get('soundBuffers') as Record<string, AudioBuffer> || {};
    this.sfx.loadBuffers(buffers);
    this.sfx.startAmbient();

    this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // Build map
    const gen = new RoomGenerator(this.rng, this.difficulty.getLootSpawnChance());
    const mapData = gen.generate();
    this.tiles = mapData.tiles;
    this.rooms = mapData.rooms;

    // Draw map visuals
    this.drawMap();

    // Build wall physics
    this.wallGroup = this.buildWallPhysics();

    // Enemies physics group
    this.enemyPhysicsGroup = this.physics.add.group();

    // Player
    const sp = mapData.playerSpawn;
    this.player = new Player(
      this,
      sp.x * TILE_SIZE + TILE_SIZE / 2,
      sp.y * TILE_SIZE + TILE_SIZE / 2,
    );

    // Loot
    this.lootGroup = this.physics.add.staticGroup();
    for (const ls of mapData.lootSpawns) {
      const loot = this.lootGroup.create(
        ls.x * TILE_SIZE + TILE_SIZE / 2,
        ls.y * TILE_SIZE + TILE_SIZE / 2,
        'loot',
      ) as Phaser.Physics.Arcade.Sprite;
      loot.setDepth(DEPTH.LOOT);
      loot.refreshBody();
    }

    // Enemies
    for (const es of mapData.enemySpawns) {
      this.spawnEnemyAt(es.x * TILE_SIZE + TILE_SIZE / 2, es.y * TILE_SIZE + TILE_SIZE / 2);
    }

    // Fog of war
    this.fog = new FogOfWar(this);
    // Force initial reveal so player starts visible
    this.fog.forceReveal(sp.x, sp.y);

    // HUD
    this.hud = new HUD(this);

    // Virtual joystick (mobile)
    this.isMobile = this.sys.game.device.input.touch || this.cameras.main.width < 600;
    this.joystick = new VirtualJoystick(this);

    // Camera
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
    this.cameras.main.setViewport(0, 0, camW, camH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Handle resize
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      this.joystick.resize(gameSize.width, gameSize.height);
    });

    // Colliders
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.enemyPhysicsGroup, this.wallGroup);
    this.physics.add.collider(this.enemyPhysicsGroup, this.enemyPhysicsGroup);

    // Loot overlap
    this.physics.add.overlap(this.player, this.lootGroup, (_p, loot) => {
      (loot as Phaser.Physics.Arcade.Sprite).destroy();
      this.player.collectItem();
      this.difficulty.itemsCollected++;
      this.sfx.playLoot();
    });

    // Events
    this.events.on('playerDied', this.onPlayerDied, this);
    this.events.on('enemyDied', (_enemy: Enemy) => {
      this.enemies = this.enemies.filter(e => e !== _enemy);
      this.difficulty.killCount++;
      this.player.recordKill(25);
      this.sfx.playSlash();
    });
    this.events.on('enemyAttack', (_enemy: Enemy, dmg: number) => {
      this.player.takeDamage(dmg);
      this.difficulty.damageDealt += dmg;
      this.tension = Math.min(100, this.tension + 15);
      this.sfx.playHit();
      this.sfx.playGrowl();
    });

    // Day timer
    this.dayTimer = this.time.addEvent({
      delay: DAY_DURATION,
      callback: this.advanceDay,
      callbackScope: this,
      loop: true,
    });

    // Spawn check every 5 seconds
    this.spawnCheckTimer = this.time.addEvent({
      delay: 5000,
      callback: this.checkAndSpawnEnemies,
      callbackScope: this,
      loop: true,
    });

    // Initial day banner
    this.hud.showDayBanner(1);
  }

  update(time: number, delta: number): void {
    if (!this.player.isAlive) return;

    this.difficulty.update(delta);
    this.difficulty.playerHPPercent = this.player.hpPercent;

    // Feed virtual joystick into player
    if (this.joystick.isActive) {
      this.player.joystickDir.set(this.joystick.dx, this.joystick.dy);
      this.player.joystickActive = true;
    } else {
      this.player.joystickActive = false;
    }

    this.player.update(time, delta);

    for (const enemy of this.enemies) {
      enemy.update(time, delta);
      // Hide enemies that are in unexplored / dark fog
      const eTileX = Math.floor(enemy.x / TILE_SIZE);
      const eTileY = Math.floor(enemy.y / TILE_SIZE);
      const visible = this.fog.isVisible(eTileX, eTileY);
      enemy.setAlpha(visible ? 1 : 0);
    }

    // Footsteps
    const body = (this.player as any).body as Phaser.Physics.Arcade.Body | null;
    if (body && (Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10)) {
      this.sfx.playStep(time);
    }

    // Fog of war
    this.fog.update(this.player.tileX, this.player.tileY);

    // HUD
    this.hud.update(
      this.player.hp,
      this.player.maxHp,
      this.player.stamina,
      PLAYER_MAX_STAMINA,
      this.difficulty.day,
      this.player.killCount,
      this.player.itemsCollected,
      this.difficulty.survivalTime,
    );

    // Tension decay
    this.tension = Math.max(0, this.tension - delta * 0.005);

    // Narrative evaluation
    const narrativeInterval = this.difficulty.getEventInterval();
    if (time - this.lastNarrativeTime >= narrativeInterval) {
      this.lastNarrativeTime = time;
      this.evaluateNarrative(time);
    }
  }

  private evaluateNarrative(now: number): void {
    const result = this.narrative.evaluate({
      day: this.difficulty.day,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      killCount: this.player.killCount,
      itemsCollected: this.player.itemsCollected,
      survivalTime: this.difficulty.survivalTime,
      damageTaken: this.player.damageTaken,
      intelligence: this.player.intelligence,
      traits: this.player.getTraits(),
      tension: this.tension,
    }, now);

    if (!result) return;

    this.hud.showNarrative(result.text);

    const fx = result.effect;
    if (fx.hpDelta !== undefined) this.player.applyHpDelta(fx.hpDelta);
    if (fx.traitDeltas) this.player.applyTraitDeltas(fx.traitDeltas);
    if (fx.speedBoost) this.player.applySpeedBoost(fx.speedBoost);
    if (fx.tensionDelta) this.tension = Math.max(0, Math.min(100, this.tension + fx.tensionDelta));
    if (fx.setFlag) this.narrative.setFlag(fx.setFlag);
    if (fx.grantItems) {
      this.player.itemsCollected += fx.grantItems;
      this.difficulty.itemsCollected += fx.grantItems;
    }
    if (fx.spawnEnemies) {
      for (let i = 0; i < fx.spawnEnemies; i++) {
        this.spawnEnemyNearPlayer(false);
      }
    }
  }

  private advanceDay(): void {
    this.difficulty.advanceDay();
    this.player.daysAlive = this.difficulty.day;
    this.hud.showDayBanner(this.difficulty.day);
    this.sfx.playDay();
    this.checkAndSpawnEnemies();
  }

  private checkAndSpawnEnemies(): void {
    const target = this.difficulty.getTargetEnemyCount();
    const active = this.enemies.filter(e => e.active).length;
    const toSpawn = target - active;
    for (let i = 0; i < toSpawn; i++) {
      this.spawnEnemyNearPlayer(true);
    }
  }

  private spawnEnemyAt(px: number, py: number): void {
    const room = this.findRoomForPos(px, py) ?? this.rooms[this.rooms.length - 1];
    const bounds = {
      x: room.x * TILE_SIZE,
      y: room.y * TILE_SIZE,
      w: room.width * TILE_SIZE,
      h: room.height * TILE_SIZE,
    };

    const enemy = new Enemy(
      this,
      px,
      py,
      this.difficulty.getEnemyDetectionRadius(),
      bounds,
      this.tiles,
    );
    enemy.setTarget(this.player);
    enemy.setSpeedMult(this.difficulty.getEnemySpeedMult());
    this.enemies.push(enemy);
    this.enemyPhysicsGroup.add(enemy);
  }

  private spawnEnemyNearPlayer(farAway: boolean): void {
    const minDist = farAway ? 300 : 150;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
      // Pick a random room that isn't the player's current room
      const room = this.rng.pick(this.rooms);
      const cx = (room.x + room.width / 2) * TILE_SIZE;
      const cy = (room.y + room.height / 2) * TILE_SIZE;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, cx, cy);

      if (dist >= minDist) {
        // Random position inside the room
        const tx = this.rng.nextInt(room.x + 1, room.x + room.width - 2);
        const ty = this.rng.nextInt(room.y + 1, room.y + room.height - 2);
        if (!isSolid(this.tiles[ty]?.[tx] ?? TileType.WALL)) {
          this.spawnEnemyAt(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
          return;
        }
      }
    }

    // Fallback: spawn somewhere off-screen
    const room = this.rooms[this.rng.nextInt(1, this.rooms.length - 1)];
    const tx = this.rng.nextInt(room.x + 1, room.x + room.width - 2);
    const ty = this.rng.nextInt(room.y + 1, room.y + room.height - 2);
    this.spawnEnemyAt(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
  }

  private findRoomForPos(px: number, py: number): Room | null {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    for (const room of this.rooms) {
      if (tx >= room.x && tx < room.x + room.width && ty >= room.y && ty < room.y + room.height) {
        return room;
      }
    }
    return null;
  }

  private drawMap(): void {
    if (this.mapGraphics) this.mapGraphics.destroy();
    this.mapGraphics = this.add.graphics();

    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        const tile = this.tiles[ty][tx];
        const x = tx * TILE_SIZE;
        const y = ty * TILE_SIZE;

        if (tile === TileType.WALL || tile === TileType.EMPTY) {
          this.mapGraphics.fillStyle(COLORS.WALL);
          this.mapGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.mapGraphics.fillStyle(COLORS.WALL_BORDER, 0.4);
          this.mapGraphics.fillRect(x, y, TILE_SIZE, 1);
          this.mapGraphics.fillRect(x, y, 1, TILE_SIZE);
        } else if (tile === TileType.OBSTACLE) {
          this.mapGraphics.fillStyle(COLORS.FLOOR);
          this.mapGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.mapGraphics.fillStyle(COLORS.OBSTACLE);
          this.mapGraphics.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          this.mapGraphics.fillStyle(COLORS.OBSTACLE_BORDER, 0.6);
          this.mapGraphics.fillRect(x + 4, y + 4, TILE_SIZE - 8, 1);
          this.mapGraphics.fillRect(x + 4, y + 4, 1, TILE_SIZE - 8);
        } else {
          // FLOOR, SPAWN_PLAYER, SPAWN_ENEMY, LOOT, DOOR
          this.mapGraphics.fillStyle(COLORS.FLOOR);
          this.mapGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.mapGraphics.fillStyle(COLORS.FLOOR_LINE, 0.25);
          this.mapGraphics.fillRect(x, y, TILE_SIZE, 1);
          this.mapGraphics.fillRect(x, y, 1, TILE_SIZE);
        }
      }
    }

    this.mapGraphics.setDepth(DEPTH.FLOOR);
  }

  private buildWallPhysics(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();

    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
      for (let tx = 0; tx < MAP_WIDTH; tx++) {
        if (isSolid(this.tiles[ty][tx])) {
          const wall = group.create(
            tx * TILE_SIZE + TILE_SIZE / 2,
            ty * TILE_SIZE + TILE_SIZE / 2,
            'block',
          ) as Phaser.Physics.Arcade.Sprite;
          wall.setAlpha(0);
          wall.refreshBody();
        }
      }
    }

    return group;
  }

  private onPlayerDied(): void {
    this.dayTimer.remove();
    this.spawnCheckTimer.remove();
    this.sfx.playDeath();
    this.sfx.stopAmbient();

    // Death flash
    this.cameras.main.flash(600, 80, 0, 0);

    this.time.delayedCall(800, () => {
      this.scene.start('ResultScene', {
        daysAlive: this.player.daysAlive,
        killCount: this.player.killCount,
        itemsCollected: this.player.itemsCollected,
        damageTaken: this.player.damageTaken,
        damageDealt: this.player.damageDealt,
        survivalTime: this.difficulty.survivalTime,
        traits: this.player.getTraits(),
        seed: this.seed,
        isDaily: this.isDaily,
      });
    });
  }
}
