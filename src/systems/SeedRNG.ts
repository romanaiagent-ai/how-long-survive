/**
 * Mulberry32 — fast deterministic PRNG.
 * All game randomness must derive from the run seed so runs are reproducible.
 */
export class SeedRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0; // coerce to unsigned 32-bit
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Float in [0, 1) — alias for next() */
  nextFloat(): number {
    return this.next();
  }

  /** Boolean with given probability (0–1) of being true */
  nextBool(prob = 0.5): boolean {
    return this.next() < prob;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  /** Fisher-Yates shuffle (returns new array) */
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Clone with the same current state */
  clone(): SeedRNG {
    return new SeedRNG(this.seed);
  }
}
