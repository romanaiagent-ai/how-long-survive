/**
 * Lightweight Web Audio sound player.
 * Uses AudioBuffers baked in BootScene, plays them via AudioContext directly.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private masterGain!: GainNode;
  private lastStep = 0;
  private ambientNode: AudioBufferSourceNode | null = null;

  constructor(audioContext: AudioContext | null) {
    this.ctx = audioContext;
    if (!this.ctx) return;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
  }

  loadBuffers(buffers: Record<string, AudioBuffer>): void {
    this.buffers = buffers || {};
  }

  play(key: string, volume = 1.0, pitch = 1.0): void {
    if (!this.ctx || !this.buffers[key]) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[key];
      src.playbackRate.value = pitch;
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(this.masterGain);
      src.start(this.ctx.currentTime);
    } catch { /* ignore */ }
  }

  playStep(now: number): void {
    if (now - this.lastStep < 320) return;
    this.lastStep = now;
    this.play('sfx_step', 0.25, 0.9 + Math.random() * 0.2);
  }

  playSlash(): void { this.play('sfx_slash', 0.6, 0.85 + Math.random() * 0.3); }
  playHit(): void   { this.play('sfx_hit',   0.7, 0.9 + Math.random() * 0.2); }
  playLoot(): void  { this.play('sfx_loot',  0.5); }
  playDay(): void   { this.play('sfx_day',   0.6); }
  playDeath(): void { this.play('sfx_death', 0.8); }
  playGrowl(): void { this.play('sfx_growl', 0.35, 0.8 + Math.random() * 0.4); }

  startAmbient(): void {
    if (!this.ctx || this.ambientNode) return;
    try {
      const sr = this.ctx.sampleRate;
      const duration = 4;
      const buf = this.ctx.createBuffer(1, sr * duration, sr);
      const d = buf.getChannelData(0);
      // Low drone + occasional creak
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        d[i] = Math.sin(2 * Math.PI * 55 * t) * 0.08
             + Math.sin(2 * Math.PI * 110 * t + Math.sin(t * 0.5) * 0.3) * 0.05
             + (Math.random() * 2 - 1) * 0.015; // subtle noise floor
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.5;
      src.connect(gain);
      gain.connect(this.masterGain);
      src.start(this.ctx.currentTime);
      this.ambientNode = src;
    } catch { /* ignore */ }
  }

  stopAmbient(): void {
    try { this.ambientNode?.stop(); } catch { /* ignore */ }
    this.ambientNode = null;
  }
}
