export enum TileType {
  EMPTY = 0,
  WALL = 1,
  FLOOR = 2,
  DOOR = 3,
  OBSTACLE = 4,
  SPAWN_PLAYER = 5,
  SPAWN_ENEMY = 6,
  LOOT = 7,
}

// Visual tileset index (1-based for Phaser tilemap data)
// 0 = empty, 1 = wall, 2 = obstacle, 3 = floor
export function toTilemapIndex(t: TileType): number {
  switch (t) {
    case TileType.WALL:
      return 1;
    case TileType.OBSTACLE:
      return 2;
    default:
      return 3; // FLOOR, DOOR, SPAWN_*, LOOT all render as floor
  }
}

export function isWalkable(t: TileType): boolean {
  return t !== TileType.WALL && t !== TileType.EMPTY;
}

export function isSolid(t: TileType): boolean {
  return t === TileType.WALL || t === TileType.OBSTACLE;
}

export interface Room {
  x: number; // tile x
  y: number; // tile y
  width: number; // in tiles
  height: number; // in tiles
}

export interface MapData {
  tiles: TileType[][];
  rooms: Room[];
  playerSpawn: { x: number; y: number }; // tile coordinates
  enemySpawns: Array<{ x: number; y: number }>;
  lootSpawns: Array<{ x: number; y: number }>;
}
