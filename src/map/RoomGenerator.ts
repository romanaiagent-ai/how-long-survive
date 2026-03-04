import { SeedRNG } from '../systems/SeedRNG';
import { TileType, MapData, Room, toTilemapIndex } from './TileTypes';
import { MAP_WIDTH, MAP_HEIGHT } from '../config';

export class RoomGenerator {
  private rng: SeedRNG;
  private tiles: TileType[][];
  private rooms: Room[] = [];
  private readonly lootChance: number;

  constructor(rng: SeedRNG, lootSpawnChance = 0.3) {
    this.rng = rng;
    this.lootChance = lootSpawnChance;
    // Fill with walls
    this.tiles = Array.from({ length: MAP_HEIGHT }, () =>
      Array(MAP_WIDTH).fill(TileType.WALL)
    );
  }

  generate(): MapData {
    const numRooms = this.rng.nextInt(4, 8);

    // Place rooms
    for (let attempts = 0; attempts < numRooms * 12 && this.rooms.length < numRooms; attempts++) {
      this.tryPlaceRoom();
    }

    // Guarantee at least 2 rooms
    if (this.rooms.length < 2) {
      this.forceRoom(1, 1, 8, 6);
      this.forceRoom(MAP_WIDTH - 10, MAP_HEIGHT - 8, 8, 6);
    }

    // Connect all rooms via L-shaped corridors
    for (let i = 1; i < this.rooms.length; i++) {
      this.connectRooms(this.rooms[i - 1], this.rooms[i]);
    }

    // Connect last to first for a loop feel
    if (this.rooms.length > 3) {
      this.connectRooms(this.rooms[this.rooms.length - 1], this.rooms[0]);
    }

    // Obstacles inside rooms
    for (const room of this.rooms) this.placeObstacles(room);

    // Player spawn: centre of first room
    const fr = this.rooms[0];
    const playerSpawn = {
      x: Math.floor(fr.x + fr.width / 2),
      y: Math.floor(fr.y + fr.height / 2),
    };
    this.tiles[playerSpawn.y][playerSpawn.x] = TileType.SPAWN_PLAYER;

    // Enemy spawns: rooms beyond the first
    const enemySpawns: Array<{ x: number; y: number }> = [];
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = this.rng.nextInt(1, Math.min(3, Math.floor(room.width * room.height / 12)));
      for (let j = 0; j < count; j++) {
        const ex = this.rng.nextInt(room.x + 1, room.x + room.width - 2);
        const ey = this.rng.nextInt(room.y + 1, room.y + room.height - 2);
        if (this.tiles[ey][ex] === TileType.FLOOR) {
          this.tiles[ey][ex] = TileType.SPAWN_ENEMY;
          enemySpawns.push({ x: ex, y: ey });
        }
      }
    }

    // Loot spawns
    const lootSpawns: Array<{ x: number; y: number }> = [];
    for (const room of this.rooms) {
      for (let ty = room.y + 1; ty < room.y + room.height - 1; ty++) {
        for (let tx = room.x + 1; tx < room.x + room.width - 1; tx++) {
          if (this.tiles[ty][tx] === TileType.FLOOR && this.rng.nextBool(this.lootChance * 0.4)) {
            this.tiles[ty][tx] = TileType.LOOT;
            lootSpawns.push({ x: tx, y: ty });
          }
        }
      }
    }

    return { tiles: this.tiles, rooms: this.rooms, playerSpawn, enemySpawns, lootSpawns };
  }

  /**
   * Convert TileType[][] to Phaser tilemap data (1-based indices).
   * 0 = empty (not used), 1 = WALL, 2 = OBSTACLE, 3 = FLOOR
   */
  static toTilemapData(tiles: TileType[][]): number[][] {
    return tiles.map((row) => row.map(toTilemapIndex));
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private tryPlaceRoom(): void {
    const w = this.rng.nextInt(5, 12);
    const h = this.rng.nextInt(4, 9);
    const x = this.rng.nextInt(1, MAP_WIDTH - w - 1);
    const y = this.rng.nextInt(1, MAP_HEIGHT - h - 1);

    const candidate: Room = { x, y, width: w, height: h };
    for (const r of this.rooms) {
      if (this.overlaps(candidate, r)) return;
    }
    this.carveRoom(candidate);
    this.rooms.push(candidate);
  }

  private forceRoom(x: number, y: number, w: number, h: number): void {
    const room: Room = { x, y, width: w, height: h };
    this.carveRoom(room);
    this.rooms.push(room);
  }

  private carveRoom(room: Room): void {
    for (let ry = room.y; ry < room.y + room.height; ry++) {
      for (let rx = room.x; rx < room.x + room.width; rx++) {
        if (ry >= 0 && ry < MAP_HEIGHT && rx >= 0 && rx < MAP_WIDTH) {
          this.tiles[ry][rx] = TileType.FLOOR;
        }
      }
    }
  }

  private overlaps(a: Room, b: Room): boolean {
    return !(
      a.x + a.width + 1 < b.x ||
      b.x + b.width + 1 < a.x ||
      a.y + a.height + 1 < b.y ||
      b.y + b.height + 1 < a.y
    );
  }

  private connectRooms(a: Room, b: Room): void {
    const ax = Math.floor(a.x + a.width / 2);
    const ay = Math.floor(a.y + a.height / 2);
    const bx = Math.floor(b.x + b.width / 2);
    const by = Math.floor(b.y + b.height / 2);

    if (this.rng.nextBool()) {
      this.carveH(ax, bx, ay);
      this.carveV(ay, by, bx);
    } else {
      this.carveV(ay, by, ax);
      this.carveH(ax, bx, by);
    }
  }

  private carveH(x1: number, x2: number, y: number): void {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        if (this.tiles[y][x] === TileType.WALL) this.tiles[y][x] = TileType.FLOOR;
      }
    }
  }

  private carveV(y1: number, y2: number, x: number): void {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        if (this.tiles[y][x] === TileType.WALL) this.tiles[y][x] = TileType.FLOOR;
      }
    }
  }

  private placeObstacles(room: Room): void {
    for (let ty = room.y + 1; ty < room.y + room.height - 1; ty++) {
      for (let tx = room.x + 1; tx < room.x + room.width - 1; tx++) {
        if (this.tiles[ty][tx] === TileType.FLOOR && this.rng.nextBool(0.08)) {
          this.tiles[ty][tx] = TileType.OBSTACLE;
        }
      }
    }
  }
}
