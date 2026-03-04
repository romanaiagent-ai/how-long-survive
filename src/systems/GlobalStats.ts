import { SeedRNG } from './SeedRNG';

export interface GlobalStatsResult {
  percentileSurvival: number; // % of players who survived past this day
  totalPlayersToday: number;
  mostCommonDeaths: string[];
  avgDaysAlive: number;
}

const DEATH_FLAVORS = [
  'Ambushed while resting',
  'Ran out of time',
  'Trusted the wrong person',
  'Lost in the dark',
  'Overwhelmed by numbers',
  'Failed to escape in time',
  'Ignored the warning signs',
  'Underestimated the threat',
  'Ran out of options',
  'Caught off guard',
];

/**
 * Generates simulated global stats using a date-seeded RNG so numbers feel
 * consistent within the same day.  Supabase integration can replace this.
 */
export class GlobalStats {
  private rng: SeedRNG;

  constructor(dateSeed: number) {
    this.rng = new SeedRNG(dateSeed);
  }

  /** How many percent of players survived PAST the given day */
  getPercentileSurvival(day: number): number {
    // Roughly exponential decay: ~80% make it past day 1, ~3% past day 10
    const base = Math.max(1, 85 - day * day * 0.8);
    // Add small seeded noise for realism
    const noise = this.rng.clone().nextInt(-3, 3);
    return Math.max(1, Math.min(99, Math.round(base + noise)));
  }

  generate(day: number): GlobalStatsResult {
    const rng = this.rng.clone();
    const totalPlayersToday = rng.nextInt(1_200, 8_400);
    const avgDaysAlive = rng.nextFloat() * 3 + 2; // 2–5 days
    const shuffled = rng.shuffle(DEATH_FLAVORS);
    const mostCommonDeaths = shuffled.slice(0, 3);

    return {
      percentileSurvival: this.getPercentileSurvival(day),
      totalPlayersToday,
      mostCommonDeaths,
      avgDaysAlive: Math.round(avgDaysAlive * 10) / 10,
    };
  }

  /** Supabase-ready interface stub */
  async submitRun(_payload: {
    seed: number;
    daysAlive: number;
    killCount: number;
    causeOfDeath: string;
    archetype: string;
  }): Promise<void> {
    // TODO: POST to Supabase edge function
    // const { data, error } = await supabase.from('runs').insert([payload]);
    console.debug('[GlobalStats] Run submitted (stubbed)', _payload);
  }
}
