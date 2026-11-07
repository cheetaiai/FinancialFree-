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

  // Write 16-bit PCM samples with smooth soft-clipping
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    // Gentle soft clipping limiter
    if (s > 1.0) s = 1.0;
    else if (s < -1.0) s = -1.0;
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), 44 + i * 2);
  }

  return buffer;
}

/**
 * 1. OPTIMIZED PAYTM PAYMENT GIVEN SOUND (~2.6s)
 * Iconic Paytm Soundbox payment confirmation jingle:
 * Melodious, crisp, balanced multi-note xylophone / marimba chime:
 * D5 (587Hz) -> G5 (784Hz) -> B5 (988Hz) -> D6 (1175Hz) -> G6 (1568Hz)
 * with authentic Soundbox acoustic resonance and clean stereo-like depth.
 */
function generateOptimizedPaytmPaymentSound() {
  const duration = 2.6;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { start: 0.04, freq: 587.33, dur: 0.28, amp: 0.55 }, // D5 (warm acoustic strike)
    { start: 0.24, freq: 783.99, dur: 0.28, amp: 0.60 }, // G5 (joyful bounce)
    { start: 0.46, freq: 987.77, dur: 0.30, amp: 0.65 }, // B5 (rising third)
    { start: 0.70, freq: 1174.66, dur: 0.38, amp: 0.70 }, // D6 (crystal bell)
    { start: 0.98, freq: 1567.98, dur: 1.55, amp: 0.75 }  // G6 (iconic triumphant sustained bell)
  ];

  notes.forEach(({ start, freq, dur, amp }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const noteSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      // Fast attack without click, smooth exponential decay
      const attack = Math.min(1, t / 0.008);
      const decay = Math.exp(-t * (3.8 / dur));
      const env = attack * decay * amp;

      // Authentic Soundbox timbre:
      // Fundamental + 2nd overtone + 3rd harmonic + high acoustic sparkle
      const osc1 = Math.sin(2 * Math.PI * freq * t);
      const osc2 = 0.38 * Math.sin(2 * Math.PI * (freq * 2.002) * t); // slight natural detune
      const osc3 = 0.16 * Math.sin(2 * Math.PI * (freq * 3.0) * t);
      const osc4 = 0.08 * Math.sin(2 * Math.PI * (freq * 4.0) * t);
      // Soft mallet tap transient in first 6ms
      const tap = t < 0.006 ? Math.sin(2 * Math.PI * 400 * t) * (1 - t / 0.006) * 0.25 : 0;

      samples[idx] += (osc1 + osc2 + osc3 + osc4 + tap) * env;
    }
  });

  // Normalize to -0.5 dB for maximum clarity and punch without clipping
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  if (maxAmp > 0) {
    const target = 0.92;
    const factor = target / maxAmp;
    for (let i = 0; i < samples.length; i++) samples[i] *= factor;
  }

  return createWavBuffer(samples);
}

/**
 * 2. OPTIMIZED MIXKIT GOLD COIN SOUND (Money Taken / Return Money) (~1.6s)
 * Authentic crystalline metallic gold coin clink & double-bounce ring.
 */
function generateOptimizedMixkitGoldCoinSound() {
  const duration = 1.65;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const strikes = [
    { start: 0.02, amp: 0.85, dur: 1.55, f1: 2637.02, f2: 3135.96, f3: 4186.01, fBody: 1975.5 },
    { start: 0.12, amp: 0.52, dur: 1.40, f1: 2793.83, f2: 3520.00, f3: 4434.92, fBody: 2093.0 }
  ];

  strikes.forEach(({ start, amp, dur, f1, f2, f3, fBody }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const strikeSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < strikeSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.002);
      const decay = Math.exp(-t * 3.4);
      const env = attack * decay * amp;

      const osc1 = Math.sin(2 * Math.PI * f1 * t);
      const osc2 = 0.68 * Math.sin(2 * Math.PI * f2 * t);
      const osc3 = 0.32 * Math.sin(2 * Math.PI * f3 * t);
      const oscBody = 0.22 * Math.sin(2 * Math.PI * fBody * t);
      const metallicImpact = t < 0.008 ? (Math.random() * 2 - 1) * (1 - t / 0.008) * 0.28 : 0;

      samples[idx] += (osc1 + osc2 + osc3 + oscBody + metallicImpact) * env;
    }
  });

  // Normalize
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > maxAmp) maxAmp = Math.abs(samples[i]);
  }
  if (maxAmp > 0) {
    const factor = 0.92 / maxAmp;
    for (let i = 0; i < samples.length; i++) samples[i] *= factor;
  }

  return createWavBuffer(samples);
}

/**
 * 3. OPTIMIZED TICK MARK SOUND (~0.04s)
 */
function generateOptimizedTickMarkSound() {
  const duration = 0.045;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 1500 * Math.exp(-t * 45);
    const env = Math.min(1, t / 0.0015) * Math.exp(-t * 90) * 0.7;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env;
  }

  return createWavBuffer(samples);
}

/**
 * 4. OPTIMIZED NEW PERSON WELCOME CHIME (~1.1s)
 */
function generateOptimizedNewPersonSound() {
  const duration = 1.15;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);

  const notes = [
    { start: 0.02, freq: 523.25, dur: 0.35, amp: 0.45 }, // C5
    { start: 0.11, freq: 659.25, dur: 0.40, amp: 0.50 }, // E5
    { start: 0.20, freq: 783.99, dur: 0.45, amp: 0.55 }, // G5
    { start: 0.29, freq: 1046.50, dur: 0.80, amp: 0.65 } // C6
  ];

  notes.forEach(({ start, freq, dur, amp }) => {
    const startSample = Math.floor(start * SAMPLE_RATE);
    const noteSamples = Math.floor(dur * SAMPLE_RATE);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.01);
      const decay = Math.exp(-t * (3.6 / dur));
      const env = attack * decay * amp;

      const osc = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
      samples[idx] += osc * env;
    }
  });

  return createWavBuffer(samples);
}

const targetDir = path.resolve('public', 'sounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'paytm_payment_given.wav'), generateOptimizedPaytmPaymentSound());
fs.writeFileSync(path.join(targetDir, 'mixkit_money_taken.wav'), generateOptimizedMixkitGoldCoinSound());
fs.writeFileSync(path.join(targetDir, 'tick_mark.wav'), generateOptimizedTickMarkSound());
fs.writeFileSync(path.join(targetDir, 'new_person_welcome.wav'), generateOptimizedNewPersonSound());

console.log('✅ Generated optimized studio sound assets in public/sounds/:');
console.log(' - paytm_payment_given.wav (Optimized Paytm Given Money Sound)');
console.log(' - mixkit_money_taken.wav (Optimized Mixkit Taken Money Sound)');
console.log(' - tick_mark.wav (Optimized Tick Mark Sound)');
console.log(' - new_person_welcome.wav (Optimized Contact Chime)');
