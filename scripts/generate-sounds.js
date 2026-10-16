import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(samples) {
  const byteLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + byteLength);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + byteLength, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32);  // BlockAlign (NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(byteLength, 40);

  // Write 16-bit PCM samples
  for (let i = 0; i < samples.length; i++) {
    // Clamp sample between -1.0 and 1.0
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), 44 + i * 2);
  }

  return buffer;
}

/**
 * 1. PAYTM PAYMENT GIVEN SOUND (~2.8s)
 * Iconic Paytm soundbox melodious payment confirmation:
 * Bright, joyful xylophone/marimba multi-note tune:
 * Arpeggiated sequence: G5 -> C6 -> E6 -> G6 -> C7 with sparkling high harmonics and warm sustain.
 */
function generatePaytmPaymentSound() {
  const duration = 2.8;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  // Sequence of notes in Paytm tune (time in seconds, freq, duration, amp)
  const notes = [
    { start: 0.05, freq: 783.99, dur: 0.28, amp: 0.45 },  // G5
    { start: 0.28, freq: 1046.50, dur: 0.28, amp: 0.50 }, // C6
    { start: 0.52, freq: 1318.51, dur: 0.32, amp: 0.55 }, // E6
    { start: 0.78, freq: 1567.98, dur: 0.40, amp: 0.60 }, // G6
    { start: 1.10, freq: 2093.00, dur: 1.50, amp: 0.65 }  // C7 (triumphant sustain)
  ];

  notes.forEach(({ start, freq, dur, amp }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const noteSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      // Attack, sustain, exponential decay envelope
      const attack = Math.min(1, t / 0.015);
      const decay = Math.exp(-t * (4.2 / dur));
      const env = attack * decay * amp;

      // Primary tone + rich marimba/chime harmonics
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = 0.4 * Math.sin(2 * Math.PI * (freq * 2.0) * t); // 2nd harmonic
      const osc3 = 0.15 * Math.sin(2 * Math.PI * (freq * 3.0) * t); // 3rd harmonic
      const osc4 = 0.08 * Math.sin(2 * Math.PI * (freq * 4.0) * t); // Sparkle

      samples[idx] += (osc1 + osc2 + osc3 + osc4) * env;
    }
  });

  // Soft master limiter / normalization
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  if (maxAmp > 0.95) {
    const factor = 0.95 / maxAmp;
    for (let i = 0; i < samples.length; i++) samples[i] *= factor;
  }

  return createWavBuffer(samples);
}

/**
 * 2. MIXKIT GOLD COIN SOUND (Money Taken / Return Money) (~1.5s)
 * Real metallic gold coin bounce & crystalline chime:
 * Strike 1 at 0.0s, high resonant ping (E7: 2637 Hz, G7: 3136 Hz),
 * Strike 2 bounce at 0.11s with sweet harmonic ringing decay.
 */
function generateMixkitGoldCoinSound() {
  const duration = 1.6;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const strikes = [
    { start: 0.02, amp: 0.75, dur: 1.45, f1: 2637.02, f2: 3135.96, f3: 4186.01, fBody: 1975.5 },
    { start: 0.13, amp: 0.45, dur: 1.30, f1: 2793.83, f2: 3520.00, f3: 4434.92, fBody: 2093.0 }
  ];

  strikes.forEach(({ start, amp, dur, f1, f2, f3, fBody }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const strikeSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < strikeSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      // Fast strike attack + long crystalline decay
      const attack = Math.min(1, t / 0.003);
      const decay = Math.exp(-t * 3.8);
      const env = attack * decay * amp;

      // Metallic high Q overtone series characteristic of genuine gold/silver coins
      const osc1 = Math.sin(2 * Math.PI * f1 * t);
      const osc2 = 0.7 * Math.sin(2 * Math.PI * f2 * t);
      const osc3 = 0.35 * Math.sin(2 * Math.PI * f3 * t);
      const oscBody = 0.25 * Math.sin(2 * Math.PI * fBody * t);
      // Subtle metallic impact burst during the first 12ms
      const noise = (t < 0.012 ? (Math.random() * 2 - 1) * Math.exp(-t * 250) * 0.3 : 0);

      samples[idx] += (osc1 + osc2 + osc3 + oscBody + noise) * env;
    }
  });

  // Soft normalization
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  if (maxAmp > 0.95) {
    const factor = 0.95 / maxAmp;
    for (let i = 0; i < samples.length; i++) samples[i] *= factor;
  }

  return createWavBuffer(samples);
}

/**
 * 3. TICK MARK SOUND (~0.05s)
 * Crisp, modern tactile click/tick for checkmarks, buttons, and toggles
 */
function generateTickMarkSound() {
  const duration = 0.05;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Rapid pitch drop from 1450Hz to 400Hz
    const freq = 1450 * Math.exp(-t * 40);
    const env = Math.min(1, t / 0.002) * Math.exp(-t * 95) * 0.65;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env;
  }

  return createWavBuffer(samples);
}

/**
 * 4. NEW PERSON WELCOME CHIME (~1.0s)
 * Cheerful, warm arpeggio celebrating adding a new person/contact
 */
function generateNewPersonSound() {
  const duration = 1.2;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { start: 0.02, freq: 523.25, dur: 0.4, amp: 0.4 }, // C5
    { start: 0.12, freq: 659.25, dur: 0.45, amp: 0.45 }, // E5
    { start: 0.22, freq: 783.99, dur: 0.5, amp: 0.5 }, // G5
    { start: 0.32, freq: 1046.50, dur: 0.8, amp: 0.6 } // C6
  ];

  notes.forEach(({ start, freq, dur, amp }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const noteSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.015);
      const decay = Math.exp(-t * (3.5 / dur));
      const env = attack * decay * amp;

      const osc = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
      samples[idx] += osc * env;
    }
  });

  return createWavBuffer(samples);
}

// Ensure public/sounds directory exists
const targetDir = path.resolve('public', 'sounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'paytm_payment_given.wav'), generatePaytmPaymentSound());
fs.writeFileSync(path.join(targetDir, 'mixkit_money_taken.wav'), generateMixkitGoldCoinSound());
fs.writeFileSync(path.join(targetDir, 'tick_mark.wav'), generateTickMarkSound());
fs.writeFileSync(path.join(targetDir, 'new_person_welcome.wav'), generateNewPersonSound());

console.log('✅ Generated studio sound assets in public/sounds/:');
console.log(' - paytm_payment_given.wav (Given Money Paytm Sound)');
console.log(' - mixkit_money_taken.wav (Money Taken Mixkit Gold Coin Sound)');
console.log(' - tick_mark.wav (Crisp Tick Mark Sound)');
console.log(' - new_person_welcome.wav (New Person Welcome Chime)');
