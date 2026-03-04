export interface DifficultySnapshot {
  day: number;
  survivalTime: number; // ms
  damageDealt: number;
  itemsCollected: number;
  deathCount: number;
  killCount: number;
  playerHPPercent: number;
  adaptiveMultiplier: number;
}

export class DifficultySystem {
  day = 1;
  survivalTime = 0; // ms
  damageDealt = 0;
  itemsCollected = 0;
  deathCount = 0;
  killCount = 0;
  playerHPPercent = 1.0;

  private adaptiveMultiplier = 1.0;
  private readonly isDaily: boolean;

  constructor(isDaily = false) {
    this.isDaily = isDaily;
  }

  update(delta: number): void {
    this.survivalTime += delta;
  }

  advanceDay(): void {
    this.day++;
    if (!this.isDaily) this.recalcMultiplier();
  }

  private recalcMultiplier(): void {
    // Dominant player → harder
    if (this.killCount > this.deathCount * 3 + 1) {
      this.adaptiveMultiplier = Math.min(2.0, this.adaptiveMultiplier * 1.2);
    }
    // Struggling player → slight relief
    else if (this.playerHPPercent < 0.3) {
      this.adaptiveMultiplier = Math.max(0.5, this.adaptiveMultiplier * 0.8);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  getEnemySpawnRate(): number {
    return (0.5 + this.day * 0.15) * this.adaptiveMultiplier;
  }

  getDetectionBonus(): number {
    return this.day * 8;
  }

  getEnemyDetectionRadius(): number {
    return 150 + this.getDetectionBonus();
  }

  getLootSpawnChance(): number {
    return Math.max(0.05, 0.6 - this.day * 0.04);
  }

  getEventInterval(): number {
    return Math.max(8_000, 30_000 - this.day * 2_000);
  }

  /** How many enemies should be active on this day */
  getTargetEnemyCount(): number {
    return Math.floor((2 + this.day * 1.5) * this.adaptiveMultiplier);
  }

  /** Enemy speed multiplier */
  getEnemySpeedMult(): number {
    return Math.min(1.8, 1.0 + this.day * 0.05);
  }

  snapshot(): DifficultySnapshot {
    return {
      day: this.day,
      survivalTime: this.survivalTime,
      damageDealt: this.damageDealt,
      itemsCollected: this.itemsCollected,
      deathCount: this.deathCount,
      killCount: this.killCount,
      playerHPPercent: this.playerHPPercent,
      adaptiveMultiplier: this.adaptiveMultiplier,
    };
  }

  getSurvivalFormatted(): string {
    const s = Math.floor(this.survivalTime / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
}
