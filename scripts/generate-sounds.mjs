import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/assets/sounds');

function writeWav(filename, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, filename), buffer);
}

function generateCast(sampleRate) {
  const duration = 0.38;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 7) * (1 - Math.exp(-t * 35));
    const sweep = 1200 - t * 2600;
    const tone = Math.sin(2 * Math.PI * Math.max(80, sweep) * t) * 0.18;
    const noise = (Math.random() * 2 - 1) * 0.42;
    samples[i] = (tone + noise) * env * 0.75;
  }

  return samples;
}

function generateCatch(sampleRate) {
  const duration = 0.55;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);
  const notes = [523.25, 659.25, 783.99, 1046.5];

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 0.12) {
      sample += (Math.random() * 2 - 1) * Math.exp(-t * 24) * 0.55;
    }

    notes.forEach((freq, index) => {
      const start = 0.06 + index * 0.045;
      if (t >= start) {
        const elapsed = t - start;
        sample += Math.sin(2 * Math.PI * freq * elapsed) * Math.exp(-elapsed * 5) * 0.22;
      }
    });

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

writeWav('cast.wav', generateCast(44100));
writeWav('catch.wav', generateCatch(44100));

console.log('Generated cast.wav and catch.wav in public/assets/sounds');
console.log('BGM uses CC0 track: public/assets/sounds/bgm.mp3');
