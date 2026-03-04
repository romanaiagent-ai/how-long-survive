import type { PlayerTraits } from './NarrativeEngine';

export interface ArchetypeInput {
  traits: PlayerTraits;
  daysAlive: number;
  survivalTime: number; // ms
  killCount: number;
  itemsCollected: number;
  damageTaken: number;
  damageDealt: number;
}

export interface ArchetypeResult {
  name: string;
  emoji: string;
  score: number;
  description: string;
  tagline: string;
}

interface Archetype {
  name: string;
  emoji: string;
  description: string;
  tagline: string;
  score: (i: ArchetypeInput) => number;
}

// Normalize helpers
const norm = (v: number, max = 100) => Math.min(1, v / max);
const daysNorm = (d: number) => Math.min(1, d / 14);

const ARCHETYPES: Archetype[] = [
  {
    name: 'Strategist',
    emoji: '🧠',
    description:
      'You thought three steps ahead. Every decision was calculated, every risk weighed. Not everyone survives on instinct alone.',
    tagline: 'The mind is the sharpest weapon.',
    score: (i) =>
      norm(i.traits.intelligence) * 0.4 +
      norm(i.traits.caution) * 0.3 +
      daysNorm(i.daysAlive) * 0.2 -
      norm(i.traits.aggression) * 0.1,
  },
  {
    name: 'Berserker',
    emoji: '⚔️',
    description:
      'You fought your way through everything. Fear wasn\'t in your vocabulary — and it showed. The enemies learned to fear you.',
    tagline: 'Attack is the best defense.',
    score: (i) =>
      norm(i.traits.aggression) * 0.5 +
      norm(i.killCount, 20) * 0.3 +
      norm(i.damageDealt, 500) * 0.2 -
      norm(i.traits.caution) * 0.1,
  },
  {
    name: 'Ghost',
    emoji: '👻',
    description:
      'They never knew you were there. You moved through the dark like smoke, leaving nothing behind — not even memories.',
    tagline: 'The best fight is the one you avoid.',
    score: (i) =>
      norm(i.traits.stealth) * 0.45 +
      norm(i.traits.caution) * 0.3 -
      norm(i.killCount, 20) * 0.25,
  },
  {
    name: 'Medic',
    emoji: '💉',
    description:
      'You hoarded every bandage, every pill. Keeping yourself alive was a science. You\'re still here — battered, but breathing.',
    tagline: 'Every wound is a lesson.',
    score: (i) =>
      norm(i.itemsCollected, 20) * 0.4 +
      norm(i.traits.caution) * 0.3 -
      norm(i.damageTaken, 300) * 0.3,
  },
  {
    name: 'Leader',
    emoji: '🚩',
    description:
      'Even alone, you acted like there were people counting on you. That kind of conviction has a gravity to it.',
    tagline: 'Lead from the front.',
    score: (i) =>
      norm(i.traits.trust) * 0.4 +
      norm(i.traits.intelligence) * 0.3 +
      norm(i.traits.caution) * 0.2 +
      daysNorm(i.daysAlive) * 0.1,
  },
  {
    name: 'Scavenger',
    emoji: '🎒',
    description:
      'Every corner, every crack — you found something useful. Survival is knowing where to look and being fast enough to get there.',
    tagline: 'One person\'s trash...',
    score: (i) =>
      norm(i.itemsCollected, 20) * 0.5 +
      norm(i.traits.riskTaking) * 0.3 +
      norm(i.traits.intelligence) * 0.2,
  },
  {
    name: 'Guardian',
    emoji: '🛡️',
    description:
      'You absorbed every hit and kept going. Your body is a record of every fight you\'ve won.',
    tagline: 'Unbreakable.',
    score: (i) =>
      norm(i.damageTaken, 300) * 0.4 +
      norm(i.traits.caution) * 0.25 +
      daysNorm(i.daysAlive) * 0.35,
  },
  {
    name: 'Wanderer',
    emoji: '🌿',
    description:
      'You kept moving. No plan, no destination — just forward. Sometimes the journey is the survival.',
    tagline: 'Always just passing through.',
    score: (i) =>
      daysNorm(i.daysAlive) * 0.4 +
      norm(i.traits.riskTaking) * 0.3 +
      (1 - norm(i.traits.caution)) * 0.3,
  },
  {
    name: 'Philosopher',
    emoji: '📖',
    description:
      'In the midst of chaos, you watched and understood. You may not have been the strongest, but you grasped the truth of this place.',
    tagline: 'To understand is to survive.',
    score: (i) =>
      norm(i.traits.intelligence) * 0.5 +
      daysNorm(i.daysAlive) * 0.3 +
      norm(i.traits.caution) * 0.2,
  },
  {
    name: 'Hunter',
    emoji: '🎯',
    description:
      'You turned predator. Methodical, patient, lethal. The difference between you and a berserker? You chose every fight.',
    tagline: 'Prey doesn\'t last long here.',
    score: (i) =>
      norm(i.killCount, 20) * 0.45 +
      norm(i.traits.intelligence) * 0.3 +
      norm(i.traits.aggression) * 0.25,
  },
  {
    name: 'Coward',
    emoji: '🐇',
    description:
      'Call it cowardice. Call it wisdom. You ran from everything and somehow outlasted people who didn\'t.',
    tagline: 'Live to run another day.',
    score: (i) =>
      (1 - norm(i.traits.aggression)) * 0.4 +
      norm(i.traits.stealth) * 0.35 +
      daysNorm(i.daysAlive) * 0.25,
  },
  {
    name: 'Hero',
    emoji: '⚡',
    description:
      'You could have run. You didn\'t. Every near-death moment only made you push harder. They\'ll tell stories about runs like yours.',
    tagline: 'Some people don\'t know how to give up.',
    score: (i) =>
      norm(i.killCount, 20) * 0.25 +
      norm(i.damageTaken, 300) * 0.25 +
      norm(i.traits.aggression) * 0.25 +
      daysNorm(i.daysAlive) * 0.25,
  },
  {
    name: 'Martyr',
    emoji: '🕯️',
    description:
      'You took every blow meant for someone else. In the end, that\'s what defined you — not what you took, but what you gave.',
    tagline: 'Some causes are worth the cost.',
    score: (i) =>
      norm(i.damageTaken, 300) * 0.45 +
      norm(i.traits.trust) * 0.3 -
      norm(i.traits.caution) * 0.25,
  },
  {
    name: 'Engineer',
    emoji: '🔧',
    description:
      'You saw systems where others saw chaos. Resources were puzzles. Obstacles were problems waiting to be solved.',
    tagline: 'There\'s a tool for every situation.',
    score: (i) =>
      norm(i.itemsCollected, 20) * 0.35 +
      norm(i.traits.intelligence) * 0.35 +
      norm(i.damageDealt, 500) * 0.3,
  },
  {
    name: 'Spy',
    emoji: '🕵️',
    description:
      'You gathered information and used it ruthlessly. The enemies never understood what hit them — or why.',
    tagline: 'Knowledge is power.',
    score: (i) =>
      norm(i.traits.stealth) * 0.35 +
      norm(i.traits.intelligence) * 0.35 +
      norm(i.traits.caution) * 0.3,
  },
  {
    name: 'Prophet',
    emoji: '🔮',
    description:
      'You sensed dangers before they arrived. That instinct — call it paranoia, call it intuition — is what kept you breathing.',
    tagline: 'The wise see what others ignore.',
    score: (i) =>
      norm(i.traits.caution) * 0.4 +
      norm(i.traits.intelligence) * 0.35 +
      daysNorm(i.daysAlive) * 0.25,
  },
  {
    name: 'Survivor',
    emoji: '🔥',
    description:
      'No archetype fits you perfectly. You adapted, endured, and outlasted. That\'s the definition of survival.',
    tagline: 'Still standing.',
    score: (i) =>
      daysNorm(i.daysAlive) * 0.5 +
      norm(i.itemsCollected, 20) * 0.2 +
      norm(i.killCount, 20) * 0.15 +
      norm(i.traits.caution) * 0.15,
  },
  {
    name: 'Outcast',
    emoji: '🌑',
    description:
      'You never fit the expected mold. Unpredictable, unclassifiable, dangerous in ways no one anticipated.',
    tagline: 'Rules are for people who plan to survive.',
    score: (i) =>
      norm(i.traits.riskTaking) * 0.4 +
      (1 - norm(i.traits.caution)) * 0.3 +
      norm(i.traits.aggression) * 0.3,
  },
  {
    name: 'Champion',
    emoji: '🏆',
    description:
      'You did everything right. Fought well, collected resources, stayed sharp. This is what peak survival looks like.',
    tagline: 'Excellence under pressure.',
    score: (i) =>
      norm(i.killCount, 20) * 0.2 +
      norm(i.itemsCollected, 20) * 0.2 +
      daysNorm(i.daysAlive) * 0.25 +
      norm(i.traits.intelligence) * 0.15 +
      norm(i.traits.caution) * 0.2,
  },
  {
    name: 'Shadow',
    emoji: '🌒',
    description:
      'Silent. Patient. Unseen until it was too late. You existed in the margins and that was your power.',
    tagline: 'Darkness has its own kind of safety.',
    score: (i) =>
      norm(i.traits.stealth) * 0.5 +
      (1 - norm(i.killCount, 20)) * 0.3 +
      norm(i.traits.intelligence) * 0.2,
  },
];

export class ArchetypeEngine {
  compute(input: ArchetypeInput): ArchetypeResult {
    let best: ArchetypeResult | null = null;

    for (const arch of ARCHETYPES) {
      const s = arch.score(input);
      if (!best || s > best.score) {
        best = { name: arch.name, emoji: arch.emoji, description: arch.description, tagline: arch.tagline, score: s };
      }
    }

    return best!;
  }

  /** Return top-3 archetypes sorted by score (for result screen breadth) */
  computeTop3(input: ArchetypeInput): ArchetypeResult[] {
    return ARCHETYPES.map((a) => ({ name: a.name, emoji: a.emoji, description: a.description, tagline: a.tagline, score: a.score(input) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }
}
