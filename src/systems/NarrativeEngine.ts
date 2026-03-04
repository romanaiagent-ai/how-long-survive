import { SeedRNG } from './SeedRNG';

export interface PlayerTraits {
  aggression: number;
  caution: number;
  intelligence: number;
  riskTaking: number;
  stealth: number;
  trust: number;
}

export interface GameStateSnapshot {
  day: number;
  hp: number;
  maxHp: number;
  killCount: number;
  itemsCollected: number;
  survivalTime: number;
  damageTaken: number;
  intelligence: number;
  traits: PlayerTraits;
  // narrative flags
  betrayalFlag: boolean;
  tension: number; // 0–100
  hadFellowSurvivor: boolean;
}

export interface NarrativeEffect {
  hpDelta?: number;
  traitDeltas?: Partial<PlayerTraits>;
  setFlag?: 'betrayalFlag' | 'hadFellowSurvivor';
  spawnEnemies?: number;
  grantItems?: number;
  speedBoost?: number; // ms duration
  causeOfDeath?: string;
  tensionDelta?: number;
}

export interface EventResult {
  text: string;
  effect: NarrativeEffect;
}

interface EventTemplate {
  id: string;
  weight: number;
  cooldown: number; // ms before same event can fire again
  triggerCondition: (s: GameStateSnapshot) => boolean;
  resolve: (s: GameStateSnapshot, rng: SeedRNG) => EventResult;
}

const EVENTS: EventTemplate[] = [
  // ─── 1. Locked Room ──────────────────────────────────────────────────────
  {
    id: 'locked_room',
    weight: 8,
    cooldown: 90_000,
    triggerCondition: (s) => s.day > 2 && s.intelligence > 20,
    resolve: (s, rng) => {
      const smart = s.traits.intelligence > 50;
      const text = smart
        ? rng.pick([
            'You find a locked door. A moment of thought — and it yields.',
            'The lock is old. You work it open with a bent wire.',
          ])
        : rng.pick([
            'A locked room. You can\'t figure out how to get in.',
            'The door won\'t budge. Whatever\'s inside stays inside.',
          ]);
      return {
        text,
        effect: smart
          ? { grantItems: 2, traitDeltas: { intelligence: 5 } }
          : { traitDeltas: { caution: 3 } },
      };
    },
  },

  // ─── 2. Stranger Appears ─────────────────────────────────────────────────
  {
    id: 'stranger',
    weight: 7,
    cooldown: 120_000,
    triggerCondition: (s) => s.day > 2 && !s.hadFellowSurvivor && !s.betrayalFlag,
    resolve: (_s, rng) => ({
      text: rng.pick([
        '"You\'re alive!" A stranger emerges from the shadows. Do you trust them?',
        'Someone watches from the doorway. They look as scared as you.',
        'A voice whispers: "Help me... please." You can\'t see them clearly.',
      ]),
      effect: {
        setFlag: 'hadFellowSurvivor',
        traitDeltas: { trust: 15 },
        tensionDelta: 20,
      },
    }),
  },

  // ─── 3. Betrayal Ambush ──────────────────────────────────────────────────
  {
    id: 'betrayal',
    weight: 15,
    cooldown: 999_999,
    triggerCondition: (s) => s.betrayalFlag && s.day > 3,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'The stranger — they\'ve brought others. You walked right into it.',
        '"Sorry," the stranger says, and the lights go out.',
        'A trap. Of course it was a trap.',
      ]),
      effect: { hpDelta: -30, spawnEnemies: 3, traitDeltas: { trust: -20, caution: 10 } },
    }),
  },

  // ─── 4. Supply Cache ─────────────────────────────────────────────────────
  {
    id: 'supply_cache',
    weight: 9,
    cooldown: 60_000,
    triggerCondition: (s) => s.itemsCollected < 3 && s.day > 3,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'Hidden behind a collapsed shelf — supplies. Not much, but enough.',
        'A cache someone left behind. You fill your pockets.',
        'Emergency rations. Dusty, expired — but yours.',
      ]),
      effect: { grantItems: 3, hpDelta: 15, traitDeltas: { caution: 5 } },
    }),
  },

  // ─── 5. Adrenaline Rush ──────────────────────────────────────────────────
  {
    id: 'adrenaline',
    weight: 12,
    cooldown: 45_000,
    triggerCondition: (s) => s.hp / s.maxHp < 0.25,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'Your heart hammers. Everything sharpens. Survive.',
        'Pain fades. There\'s only the next second. Then the next.',
        'Not yet. You refuse to die here.',
      ]),
      effect: { speedBoost: 8_000, traitDeltas: { aggression: 8, riskTaking: 5 } },
    }),
  },

  // ─── 6. The Silence ──────────────────────────────────────────────────────
  {
    id: 'silence',
    weight: 6,
    cooldown: 90_000,
    triggerCondition: (s) => s.killCount === 0 && s.day > 4,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'You\'ve avoided every fight. The silence is unsettling.',
        'Days pass. Not a drop of blood on your hands. You wonder if that\'s wise.',
        'The quieter you are, the louder the fear gets.',
      ]),
      effect: { traitDeltas: { caution: 10, stealth: 10, aggression: -5 }, tensionDelta: 15 },
    }),
  },

  // ─── 7. Footsteps ────────────────────────────────────────────────────────
  {
    id: 'footsteps',
    weight: 10,
    cooldown: 20_000,
    triggerCondition: (s) => s.tension > 25,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'Footsteps. Close. You hold your breath.',
        'Something moved behind you. Or did it?',
        'A sound in the dark. Then silence.',
        'You could swear someone\'s following you.',
      ]),
      effect: { tensionDelta: 20, traitDeltas: { stealth: 3, caution: 2 } },
    }),
  },

  // ─── 8. Emergency Broadcast ──────────────────────────────────────────────
  {
    id: 'emergency_broadcast',
    weight: 20,
    cooldown: 999_999,
    triggerCondition: (s) => s.day === 5,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'A radio crackles: "All survivors report to sector seven." You don\'t know where that is.',
        'Emergency alert: "Do not go outside after dark." Too late for that.',
        '"This is not a drill." The broadcast cuts out. Static.',
      ]),
      effect: { tensionDelta: 30, traitDeltas: { caution: 8, intelligence: 5 } },
    }),
  },

  // ─── 9. Fellow Survivor ──────────────────────────────────────────────────
  {
    id: 'fellow_survivor',
    weight: 7,
    cooldown: 120_000,
    triggerCondition: (s) => s.day > 2 && s.hadFellowSurvivor,
    resolve: (s, rng) => {
      const trusting = s.traits.caution < 50;
      return {
        text: trusting
          ? rng.pick([
              'The survivor shares food with you. Unexpected kindness.',
              '"We\'ll be safer together," they say. You want to believe it.',
            ])
          : rng.pick([
              'You keep your distance. The survivor doesn\'t argue.',
              'You watch them carefully. They don\'t seem dangerous... yet.',
            ]),
        effect: trusting
          ? { hpDelta: 20, grantItems: 1, traitDeltas: { trust: 10 } }
          : { traitDeltas: { caution: 8, stealth: 5 } },
      };
    },
  },

  // ─── 10. Trapped Corridor ────────────────────────────────────────────────
  {
    id: 'trapped_corridor',
    weight: 8,
    cooldown: 80_000,
    triggerCondition: (s) => s.traits.riskTaking > 60,
    resolve: (s, rng) => {
      const aggressive = s.traits.aggression > 50;
      return {
        text: aggressive
          ? rng.pick([
              'You charge through the corridor. Something grazes you — but you\'re through.',
              'Fight your way past. Brutal, but effective.',
            ])
          : rng.pick([
              'The corridor narrows. You see the trigger too late.',
              'A trap springs. Pain flares. You scramble back.',
            ]),
        effect: aggressive
          ? { hpDelta: -15, traitDeltas: { aggression: 5 } }
          : { hpDelta: -25, traitDeltas: { riskTaking: -10, caution: 10 } },
      };
    },
  },

  // ─── 11. Abandoned Supply ────────────────────────────────────────────────
  {
    id: 'abandoned_supply',
    weight: 10,
    cooldown: 50_000,
    triggerCondition: (s) => s.day > 1,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'A backpack, half-full. Someone left in a hurry.',
        'Supplies left behind. You try not to think about who left them.',
        'A first aid kit, mostly intact. Fortune favors you today.',
      ]),
      effect: { grantItems: 1, hpDelta: 10 },
    }),
  },

  // ─── 12. The Shadows Move ────────────────────────────────────────────────
  {
    id: 'shadows_move',
    weight: 6,
    cooldown: 60_000,
    triggerCondition: (s) => s.day > 3 && s.tension > 50,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'The shadows breathe. You haven\'t slept in days.',
        'Something at the edge of vision. Always just out of sight.',
        'Your mind is playing tricks. At least, you hope it is.',
      ]),
      effect: { hpDelta: -5, tensionDelta: 15, traitDeltas: { intelligence: 3 } },
    }),
  },

  // ─── 13. Old Wound ───────────────────────────────────────────────────────
  {
    id: 'old_wound',
    weight: 7,
    cooldown: 70_000,
    triggerCondition: (s) => s.damageTaken > 50,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'The wound reopens. You bind it tight and keep moving.',
        'Your arm aches where they caught you. Ignore it.',
        'The pain is a reminder you\'re still alive. Barely.',
      ]),
      effect: { hpDelta: -10, traitDeltas: { caution: 5 } },
    }),
  },

  // ─── 14. Lucky Find ──────────────────────────────────────────────────────
  {
    id: 'lucky_find',
    weight: 8,
    cooldown: 40_000,
    triggerCondition: (s) => s.day <= 3,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'You trip over something in the dark. A full water bottle. Lucky.',
        'A vending machine. Still working. Still stocked.',
        'Wedged in a crack in the wall — a sealed energy bar.',
      ]),
      effect: { grantItems: 2, hpDelta: 15, traitDeltas: { riskTaking: 3 } },
    }),
  },

  // ─── 15. Last Stand ──────────────────────────────────────────────────────
  {
    id: 'last_stand',
    weight: 10,
    cooldown: 999_999,
    triggerCondition: (s) => s.day > 6 && s.killCount > 5,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'They keep coming. You plant your feet. This is where it ends — for them.',
        'You\'ve lost count of how many you\'ve put down. One more. Always one more.',
        'Hero or fool? Doesn\'t matter now. You hold the line.',
      ]),
      effect: { speedBoost: 10_000, traitDeltas: { aggression: 15, riskTaking: 10 } },
    }),
  },

  // ─── 16. Moonlight ───────────────────────────────────────────────────────
  {
    id: 'moonlight',
    weight: 6,
    cooldown: 60_000,
    triggerCondition: (s) => s.day % 3 === 0,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'A sliver of moonlight cuts through the ruin. For a moment, peace.',
        'The moon reminds you there\'s still a world out there.',
        'You breathe. Just breathe. The night isn\'t over, but neither are you.',
      ]),
      effect: { hpDelta: 12, tensionDelta: -20, traitDeltas: { caution: 3 } },
    }),
  },

  // ─── 17. Paranoia ────────────────────────────────────────────────────────
  {
    id: 'paranoia',
    weight: 8,
    cooldown: 80_000,
    triggerCondition: (s) => s.day > 7,
    resolve: (_s, rng) => ({
      text: rng.pick([
        'Every shadow is a threat. Every sound a signal. You can\'t turn it off.',
        'Paranoia keeps you alive. It also keeps you from sleeping.',
        'How many days has it been? Your head swims.',
      ]),
      effect: { hpDelta: -8, tensionDelta: 25, traitDeltas: { intelligence: 5, caution: 8 } },
    }),
  },

  // ─── 18. The Bargain ─────────────────────────────────────────────────────
  {
    id: 'bargain',
    weight: 9,
    cooldown: 999_999,
    triggerCondition: (s) => s.hp / s.maxHp < 0.2,
    resolve: (s, rng) => {
      const taker = s.traits.riskTaking > 60;
      return {
        text: taker
          ? rng.pick([
              'You find something dangerous. You use it anyway.',
              'It could kill you. Or save you. You take the risk.',
            ])
          : rng.pick([
              'A choice: risk it all for a chance at more. You hesitate.',
              'The temptation is real. You hold back.',
            ]),
        effect: taker
          ? { hpDelta: rng.nextBool(0.6) ? 30 : -30, traitDeltas: { riskTaking: 10 } }
          : { traitDeltas: { caution: 10 } },
      };
    },
  },
];

export class NarrativeEngine {
  private rng: SeedRNG;
  private lastFiredAt: Map<string, number> = new Map();
  private eventQueue: EventResult[] = [];
  private flags = { betrayalFlag: false, hadFellowSurvivor: false };

  constructor(rng: SeedRNG) {
    this.rng = rng;
  }

  setFlag(flag: 'betrayalFlag' | 'hadFellowSurvivor', value = true): void {
    this.flags[flag] = value;
  }

  getFlag(flag: 'betrayalFlag' | 'hadFellowSurvivor'): boolean {
    return this.flags[flag];
  }

  /**
   * Evaluate triggers and optionally fire the highest-weight qualifying event.
   * Returns the fired event or null.
   */
  evaluate(state: Omit<GameStateSnapshot, 'betrayalFlag' | 'hadFellowSurvivor'>, now: number): EventResult | null {
    const fullState: GameStateSnapshot = { ...state, ...this.flags };

    const candidates = EVENTS.filter((e) => {
      const last = this.lastFiredAt.get(e.id) ?? -Infinity;
      return now - last >= e.cooldown && e.triggerCondition(fullState);
    });

    if (candidates.length === 0) return null;

    // Weighted random selection
    const totalWeight = candidates.reduce((s, e) => s + e.weight, 0);
    let roll = this.rng.nextFloat() * totalWeight;
    let chosen: EventTemplate | null = null;
    for (const e of candidates) {
      roll -= e.weight;
      if (roll <= 0) { chosen = e; break; }
    }
    chosen = chosen ?? candidates[candidates.length - 1];

    this.lastFiredAt.set(chosen.id, now);
    const result = chosen.resolve(fullState, this.rng);

    // Apply flag side effects
    if (result.effect.setFlag) {
      this.flags[result.effect.setFlag] = true;
      // 40% chance stranger becomes betrayer
      if (result.effect.setFlag === 'hadFellowSurvivor' && this.rng.nextBool(0.4)) {
        this.flags.betrayalFlag = true;
      }
    }

    return result;
  }
}
