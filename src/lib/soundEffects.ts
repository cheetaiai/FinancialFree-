// Professional Audio & Sound Effects Engine for FinancialFree
// Dual-layer audio pipeline:
// Layer 1: Studio WAV Audio Asset Playback (/sounds/paytm_payment_given.wav & /sounds/mixkit_money_taken.wav)
// Layer 2: Zero-latency Web Audio API synthesizer fallback (100% offline & zero network dependency)

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.85; // 0.0 to 1.0
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    try {
      const stored = localStorage.getItem('financialfree_sound_enabled');
      this.soundEnabled = stored !== 'false';
      const storedVol = localStorage.getItem('financialfree_sound_volume');
      if (storedVol) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch {
      this.soundEnabled = true;
      this.volume = 0.85;
    }

    if (typeof window !== 'undefined') {
      this.preloadAudio('/sounds/paytm_payment_given.wav');
      this.preloadAudio('/sounds/mixkit_money_taken.wav');
      this.preloadAudio('/sounds/tick_mark.wav');
      this.preloadAudio('/sounds/new_person_welcome.wav');
    }
  }

  private preloadAudio(url: string): void {
    try {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.audioCache.set(url, audio);
    } catch {}
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

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('financialfree_sound_volume', this.volume.toString());
      this.audioCache.forEach(audio => {
        audio.volume = this.volume;
      });
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

  private playSoundFile(url: string, fallbackFn: () => void): void {
    if (!this.soundEnabled) return;

    try {
      // First try HTML5 audio element
      let audio = this.audioCache.get(url);
      if (!audio) {
        audio = new Audio(url);
        this.audioCache.set(url, audio);
      }
      audio.volume = this.volume;
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If browser policy blocked HTML5 audio or file not found, invoke Web Audio fallback
          fallbackFn();
        });
      }
    } catch {
      fallbackFn();
    }
  }

  /**
   * 1. TICK MARK SOUND
   * Crisp, subtle tactile click for checkmarks, buttons, tabs & toggles
   */
  public playTickSound(): void {
    if (!this.soundEnabled) return;

    this.playSoundFile('/sounds/tick_mark.wav', () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      } catch {}
    });
  }

  /**
   * 2. GIVEN MONEY SOUND (PAYTM MP3 / WAV PAYMENT SOUND)
   * The iconic Paytm melodious payment confirmation:
   * Melodic chimes: G5 -> C6 -> E6 -> G6 -> C7 with vibrant marimba and chime harmonics.
   */
  public playGivenMoneySound(): void {
    if (!this.soundEnabled) return;

    this.playSoundFile('/sounds/paytm_payment_given.wav', () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const notes = [
          { time: 0.04, freq: 783.99, dur: 0.28, vol: 0.35 * this.volume },  // G5
          { time: 0.26, freq: 1046.50, dur: 0.28, vol: 0.40 * this.volume }, // C6
          { time: 0.50, freq: 1318.51, dur: 0.32, vol: 0.45 * this.volume }, // E6
          { time: 0.74, freq: 1567.98, dur: 0.40, vol: 0.50 * this.volume }, // G6
          { time: 1.05, freq: 2093.00, dur: 1.40, vol: 0.55 * this.volume }  // C7
        ];

        notes.forEach(({ time, freq, dur, vol }) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, now + time);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 2, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(vol, now + time + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now + time);
          osc2.start(now + time);
          osc1.stop(now + time + dur + 0.02);
          osc2.stop(now + time + dur + 0.02);
        });
      } catch {}
    });
  }

  /**
   * 3. MONEY TAKEN / RETURN MONEY SOUND (MIXKIT GOLD COIN)
   * High-resonance crystalline gold coin impact, secondary bounce, and rich metallic ringdown.
   */
  public playReturnMoneySound(): void {
    if (!this.soundEnabled) return;

    this.playSoundFile('/sounds/mixkit_money_taken.wav', () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;

        const createCoinClink = (startTime: number, volume: number, freq1: number, freq2: number) => {
          const oscA = ctx.createOscillator();
          const gainA = ctx.createGain();
          oscA.type = 'sine';
          oscA.frequency.setValueAtTime(freq1, startTime);

          gainA.gain.setValueAtTime(0.001, startTime);
          gainA.gain.linearRampToValueAtTime(volume * this.volume, startTime + 0.004);
          gainA.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.95);

          oscA.connect(gainA);
          gainA.connect(ctx.destination);
          oscA.start(startTime);
          oscA.stop(startTime + 1.0);

          const oscB = ctx.createOscillator();
          const gainB = ctx.createGain();
          oscB.type = 'sine';
          oscB.frequency.setValueAtTime(freq2, startTime);

          gainB.gain.setValueAtTime(0.001, startTime);
          gainB.gain.linearRampToValueAtTime(volume * 0.7 * this.volume, startTime + 0.004);
          gainB.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);

          oscB.connect(gainB);
          gainB.connect(ctx.destination);
          oscB.start(startTime);
          oscB.stop(startTime + 0.75);

          const oscC = ctx.createOscillator();
          const gainC = ctx.createGain();
          oscC.type = 'triangle';
          oscC.frequency.setValueAtTime(1975.53, startTime);

          gainC.gain.setValueAtTime(0.001, startTime);
          gainC.gain.linearRampToValueAtTime(volume * 0.35 * this.volume, startTime + 0.005);
          gainC.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

          oscC.connect(gainC);
          gainC.connect(ctx.destination);
          oscC.start(startTime);
          oscC.stop(startTime + 0.5);
        };

        createCoinClink(now, 0.45, 2637.02, 3135.96);
        createCoinClink(now + 0.12, 0.30, 2793.83, 3520.0);
      } catch {}
    });
  }

  /**
   * 4. NEW PERSON ADDED SOUND ("Thanks to Add" / Welcome Chime)
   * Friendly, warm 4-note ascending chord arpeggio celebrating a newly added contact.
   */
  public playNewPersonSound(): void {
    if (!this.soundEnabled) return;

    this.playSoundFile('/sounds/new_person_welcome.wav', () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const notes = [
          { freq: 523.25, time: 0.0, dur: 0.35, vol: 0.28 * this.volume },
          { freq: 659.25, time: 0.09, dur: 0.38, vol: 0.32 * this.volume },
          { freq: 783.99, time: 0.18, dur: 0.42, vol: 0.35 * this.volume },
          { freq: 1046.5, time: 0.28, dur: 0.75, vol: 0.42 * this.volume }
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
    });
  }
}

export const soundEffects = new SoundEffectsService();

// Quick convenience helpers for direct import
export const playTickSound = () => soundEffects.playTickSound();
export const playGivenMoneySound = () => soundEffects.playGivenMoneySound();
export const playReturnMoneySound = () => soundEffects.playReturnMoneySound();
export const playNewPersonSound = () => soundEffects.playNewPersonSound();
