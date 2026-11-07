// Generates authentic Paytm & Google Pay payment confirmation audio chime
// 44100 Hz, 16-bit Mono PCM RIFF WAVE
import fs from 'fs';
import path from 'path';

const sampleRate = 44100;
const totalDuration = 1.8; // 1.8 seconds
const numSamples = Math.floor(sampleRate * totalDuration);
const buffer = new Int16Array(numSamples);

// Bell synthesis with fundamental + crystal harmonics + exponential decay
function addChimeNote(startSec, durationSec, fundamentalHz, amplitude, harmonics = [1, 2, 2.76, 4.07, 5.4]) {
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.min(numSamples, startSample + Math.floor(durationSec * sampleRate));

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / sampleRate;
    // Fast attack (4ms) and exponential decay
    const attack = Math.min(1.0, t / 0.004);
    const decay = Math.exp(-t * (4.2 / durationSec));
    const envelope = attack * decay;

    let sampleVal = 0;
    harmonics.forEach((harmonicRatio, idx) => {
      const harmAmp = 1.0 / (idx * 0.75 + 1.0);
      const freq = fundamentalHz * harmonicRatio;
      sampleVal += Math.sin(2 * Math.PI * freq * t) * harmAmp;
    });

    // Add subtle shimmering sparkle modulation (chorus / tremolo effect)
    const sparkle = 1.0 + 0.08 * Math.sin(2 * Math.PI * 18 * t);
    const finalSample = sampleVal * envelope * amplitude * sparkle;

    // Accumulate with soft limiting
    const existing = buffer[i] / 32767;
    const combined = existing + finalSample;
    const clamped = Math.max(-0.95, Math.min(0.95, combined));
    buffer[i] = Math.round(clamped * 32767);
  }
}

// 1. Paytm Opening Tone: G5 (783.99 Hz)
addChimeNote(0.02, 0.35, 783.99, 0.42);

// 2. Rising Tone: C6 (1046.50 Hz)
addChimeNote(0.14, 0.40, 1046.50, 0.50);

// 3. Google Pay Iconic High Bell Tone: E6 (1318.51 Hz) + A6 (1760.00 Hz)
addChimeNote(0.28, 0.55, 1318.51, 0.56);
addChimeNote(0.30, 0.55, 1760.00, 0.45);

// 4. Paytm & Google Pay Resonant Grand Resolution Chime: G6 (1567.98 Hz) + C7 (2093.00 Hz)
addChimeNote(0.44, 1.35, 1567.98, 0.65);
addChimeNote(0.46, 1.30, 2093.00, 0.55);
// Shimmering overtone sparkle (E7)
addChimeNote(0.50, 1.10, 2637.02, 0.28);

// Build WAV header
function createWavHeader(dataLength, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

const dataBuffer = Buffer.from(buffer.buffer);
const header = createWavHeader(dataBuffer.length, sampleRate, 1, 16);
const finalWav = Buffer.concat([header, dataBuffer]);

const targetPath1 = path.resolve('public/sounds/paytm_payment_given.wav');
const targetPath2 = path.resolve('public/sounds/google_pay_payment.wav');

fs.writeFileSync(targetPath1, finalWav);
fs.writeFileSync(targetPath2, finalWav);

console.log('Successfully generated authentic Google Pay & Paytm payment chime WAV audio!');
