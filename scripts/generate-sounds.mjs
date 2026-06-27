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

function generateQuizCorrect(sampleRate) {
  const duration = 0.45;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);
  const notes = [523.25, 659.25, 783.99, 1046.5];

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    notes.forEach((freq, index) => {
      const start = index * 0.07;
      if (t >= start) {
        const elapsed = t - start;
        sample += Math.sin(2 * Math.PI * freq * elapsed) * Math.exp(-elapsed * 4.5) * 0.24;
      }
    });

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

function generateQuizWrong(sampleRate) {
  const duration = 0.42;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    const wompStarts = [0, 0.16];
    wompStarts.forEach((start) => {
      if (t >= start) {
        const elapsed = t - start;
        const freq = 320 - elapsed * 420;
        sample += Math.sin(2 * Math.PI * Math.max(90, freq) * elapsed) * Math.exp(-elapsed * 7) * 0.28;
      }
    });

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

function generateApexSpawn(sampleRate) {
  const duration = 1.35;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 0.1) {
      sample += (Math.random() * 2 - 1) * Math.exp(-t * 28) * 0.55;
      sample += Math.sin(2 * Math.PI * 52 * t) * Math.exp(-t * 22) * 0.45;
    }

    const rumbleEnv = Math.exp(-t * 1.6) * (1 - Math.exp(-t * 10));
    sample += Math.sin(2 * Math.PI * 46 * t) * rumbleEnv * 0.34;
    sample += Math.sin(2 * Math.PI * 68 * t + 0.4) * rumbleEnv * 0.18;

    if (t >= 0.12 && t < 0.9) {
      const elapsed = t - 0.12;
      const freq = 85 + elapsed * 210;
      sample += Math.sin(2 * Math.PI * freq * elapsed) * Math.exp(-elapsed * 2.4) * 0.16;
    }

    if (t >= 0.58 && t < 0.82) {
      const elapsed = t - 0.58;
      sample += Math.sin(2 * Math.PI * 58 * elapsed) * Math.exp(-elapsed * 7) * 0.28;
    }

    samples[i] = Math.max(-1, Math.min(1, sample * 0.88));
  }

  return samples;
}

function generateBite(sampleRate) {
  const duration = 0.34;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 0.05) {
      sample += (Math.random() * 2 - 1) * Math.exp(-t * 70) * 0.62;
      sample += Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 45) * 0.28;
    }

    const bloopStart = 0.03;
    if (t >= bloopStart) {
      const elapsed = t - bloopStart;
      const freq = 340 - elapsed * 680;
      sample += Math.sin(2 * Math.PI * Math.max(110, freq) * elapsed) * Math.exp(-elapsed * 11) * 0.38;
    }

    if (t >= 0.06 && t < 0.2) {
      const elapsed = t - 0.06;
      sample += Math.sin(2 * Math.PI * 920 * elapsed) * Math.exp(-elapsed * 16) * 0.18;
      sample += Math.sin(2 * Math.PI * 1240 * elapsed) * Math.exp(-elapsed * 22) * 0.1;
    }

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

function generateFishEscape(sampleRate) {
  const duration = 0.5;
  const count = Math.floor(sampleRate * duration);
  const samples = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let sample = 0;

    if (t < 0.08) {
      sample += (Math.random() * 2 - 1) * Math.exp(-t * 35) * 0.45;
      sample += Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 28) * 0.22;
    }

    if (t >= 0.04) {
      const elapsed = t - 0.04;
      const freq = 420 - elapsed * 560;
      sample += Math.sin(2 * Math.PI * Math.max(100, freq) * elapsed) * Math.exp(-elapsed * 5.5) * 0.3;
    }

    if (t >= 0.1 && t < 0.34) {
      const elapsed = t - 0.1;
      sample += Math.sin(2 * Math.PI * (280 - elapsed * 220) * elapsed) * Math.exp(-elapsed * 7) * 0.18;
    }

    samples[i] = Math.max(-1, Math.min(1, sample));
  }

  return samples;
}

writeWav('cast.wav', generateCast(44100));
writeWav('catch.wav', generateCatch(44100));
writeWav('bite.wav', generateBite(44100));
writeWav('fish_escape.wav', generateFishEscape(44100));
writeWav('quiz_correct.wav', generateQuizCorrect(44100));
writeWav('quiz_wrong.wav', generateQuizWrong(44100));
writeWav('apex_spawn.wav', generateApexSpawn(44100));

console.log('Generated cast.wav, catch.wav, bite.wav, fish_escape.wav, quiz_correct.wav, quiz_wrong.wav, apex_spawn.wav in public/assets/sounds');
console.log('BGM uses CC0 track: public/assets/sounds/bgm.mp3');
