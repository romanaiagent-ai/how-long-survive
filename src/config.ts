export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const TILE_SIZE = 32;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;

export const PLAYER_SPEED = 200;
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_STAMINA = 100;

export const ENEMY_BASE_DETECTION = 150;
export const ENEMY_SPEED_PATROL = 60;
export const ENEMY_SPEED_CHASE = 100;
export const ENEMY_ATTACK_DAMAGE_MIN = 10;
export const ENEMY_ATTACK_DAMAGE_MAX = 20;
export const ENEMY_ATTACK_RANGE = 40;
export const ENEMY_ATTACK_COOLDOWN = 1000;

export const DAY_DURATION = 60000; // ms per in-game day
export const TILE_REVEAL_RADIUS = 5; // tiles

export const COLORS = {
  BACKGROUND: 0x0d0d1a,
  WALL: 0x1e1e2e,
  WALL_BORDER: 0x2a2a3e,
  FLOOR: 0x12121e,
  FLOOR_LINE: 0x1a1a2e,
  OBSTACLE: 0x2a1e14,
  OBSTACLE_BORDER: 0x3a2e1e,
  PLAYER: 0x88ccff,
  PLAYER_CORE: 0xaaddff,
  ENEMY: 0xff6622,
  ENEMY_CORE: 0xff8844,
  LOOT: 0xffcc00,
  LOOT_GLOW: 0xffee66,
  UI_BG: 0x0a0a14,
  UI_HP: 0xcc2222,
  UI_STAMINA: 0x2266cc,
  UI_TEXT: 0xeeeeff,
  UI_ACCENT: 0xff3300,
  PARTICLE: 0x445566,
};

export const DEPTH = {
  FLOOR: 0,
  OBSTACLES: 1,
  LOOT: 2,
  ENEMIES: 9,
  PLAYER: 10,
  FOG: 50,
  HUD: 100,
  NARRATIVE: 110,
  MODAL: 200,
};
