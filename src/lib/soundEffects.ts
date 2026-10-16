// Audio & Sound Effects Engine for FinancialFree
// High-fidelity Web Audio synthesis for zero-latency, 100% offline-ready sound effects:
// 1. Tick Mark: Crisp tactile click/pop for checkmarks & toggles
// 2. Given Money (Payment): Upward digital wallet cash register chime
// 3. Return Money (Mixkit Gold Coin): Crystalline metallic gold coin double-bounce ring
// 4. New Person Added: Warm, celebratory 4-note welcoming chime

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    try {
      const stored = localStorage.getItem('financialfree_sound_enabled');
      this.soundEnabled = stored !== 'false';
    } catch {
      this.soundEnabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('financialfree_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  public toggleSound(): boolean {
    this.setEnabled(!this.soundEnabled);
    if (this.soundEnabled) {
      this.playTickSound();
    }
    return this.soundEnabled;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * 1. TICK MARK SOUND
   * Crisp, subtle tactile click for checkboxes, checkmark animations & toggles.
   */
  public playTickSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.038);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * 2. GIVEN MONEY SOUND (Payment Add)
   * Modern digital payment swoosh + cash register chime when money is given/paid.
   */
  public playGivenMoneySound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tone 1: Upward swoosh
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Tone 2: Bright cash register chime (D6 high bell)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
      osc2.frequency.setValueAtTime(1760.0, now + 0.14); // A6

      gain2.gain.setValueAtTime(0.001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.095);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.58);

      // Subtle metallic sparkle overtone
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2349.32, now + 0.1); // D7 sparkle

      gain3.gain.setValueAtTime(0.001, now + 0.1);
      gain3.gain.linearRampToValueAtTime(0.12, now + 0.115);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.1);
      osc3.stop(now + 0.45);
    } catch {}
  }

  /**
   * 3. RETURN MONEY SOUND (Mixkit Gold Coin)
   * High-resonance crystalline gold coin impact, secondary bounce, and rich metallic ringdown.
   */
  public playReturnMoneySound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Helper function to create an authentic metallic coin strike
      const createCoinClink = (startTime: number, volume: number, freq1: number, freq2: number) => {
        // High fundamental ring
        const oscA = ctx.createOscillator();
        const gainA = ctx.createGain();
        oscA.type = 'sine';
        oscA.frequency.setValueAtTime(freq1, startTime);

        gainA.gain.setValueAtTime(0.001, startTime);
        gainA.gain.linearRampToValueAtTime(volume, startTime + 0.004);
        gainA.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.95);

        oscA.connect(gainA);
        gainA.connect(ctx.destination);
        oscA.start(startTime);
        oscA.stop(startTime + 1.0);

        // Metallic harmonic overtone (gives gold coin its distinctive bright ping)
        const oscB = ctx.createOscillator();
        const gainB = ctx.createGain();
        oscB.type = 'sine';
        oscB.frequency.setValueAtTime(freq2, startTime);

        gainB.gain.setValueAtTime(0.001, startTime);
        gainB.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.004);
        gainB.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);

        oscB.connect(gainB);
        gainB.connect(ctx.destination);
        oscB.start(startTime);
        oscB.stop(startTime + 0.75);

        // Subtly pitched metallic body resonance (B6 ~ 1975Hz)
        const oscC = ctx.createOscillator();
        const gainC = ctx.createGain();
        oscC.type = 'triangle';
        oscC.frequency.setValueAtTime(1975.53, startTime);

        gainC.gain.setValueAtTime(0.001, startTime);
        gainC.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.005);
        gainC.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

        oscC.connect(gainC);
        gainC.connect(ctx.destination);
        oscC.start(startTime);
        oscC.stop(startTime + 0.5);
      };

      // Primary coin drop impact (E7: 2637Hz & G7: 3136Hz)
      createCoinClink(now, 0.38, 2637.02, 3135.96);

      // Mixkit secondary coin bounce ~120ms later (slightly higher pitch & softer)
      createCoinClink(now + 0.12, 0.24, 2793.83, 3520.0);
    } catch {}
  }

  /**
   * 4. NEW PERSON ADDED SOUND ("Thanks to Add" / Welcome Chime)
   * Friendly, warm 4-note ascending chord arpeggio celebrating a newly added contact.
   */
  public playNewPersonSound(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // C Major 7th ascending arpeggio: C5 (523Hz), E5 (659Hz), G5 (783Hz), C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.35, vol: 0.22 },
        { freq: 659.25, time: 0.08, dur: 0.38, vol: 0.25 },
        { freq: 783.99, time: 0.16, dur: 0.42, vol: 0.28 },
        { freq: 1046.5, time: 0.24, dur: 0.75, vol: 0.35 }
      ];

      notes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(vol, now + time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.02);
      });
    } catch {}
  }
}

export const soundEffects = new SoundEffectsService();

// Quick convenience helpers for direct import
export const playTickSound = () => soundEffects.playTickSound();
export const playGivenMoneySound = () => soundEffects.playGivenMoneySound();
export const playReturnMoneySound = () => soundEffects.playReturnMoneySound();
export const playNewPersonSound = () => soundEffects.playNewPersonSound();
