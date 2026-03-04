const SALT = 'survival-salt-2024';

/** djb2 hash — fast, good avalanche for short strings */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Seed derived from today's date — same for everyone playing today */
export function getDailySeed(): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return djb2(`${y}-${m}-${d}${SALT}`);
}

/** Cryptographically random seed for a normal run */
export function getRandomSeed(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0) || Math.floor(Math.random() * 2_147_483_647);
}

let _isDailyMode = false;

export function isDailyMode(): boolean {
  return _isDailyMode;
}

export function setDailyMode(value: boolean): void {
  _isDailyMode = value;
}
