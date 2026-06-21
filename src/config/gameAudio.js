/** CC0 1.0 — Cafe da Tarde (open-lofi, https://github.com/btahir/open-lofi) */
export const GAME_AUDIO = {
  bgm: { key: 'bgm', path: 'assets/sounds/bgm.mp3', volume: 0.38, loop: true },
  cast: { key: 'cast', path: 'assets/sounds/cast.wav', volume: 0.55 },
  catch: { key: 'catch', path: 'assets/sounds/catch.wav', volume: 0.62 },
  quizCorrect: { key: 'quiz_correct', path: 'assets/sounds/quiz_correct.wav', volume: 0.58 },
  quizWrong: { key: 'quiz_wrong', path: 'assets/sounds/quiz_wrong.wav', volume: 0.52 },
  apexSpawn: { key: 'apex_spawn', path: 'assets/sounds/apex_spawn.wav', volume: 0.64 },
};

export const GAME_AUDIO_FILES = Object.values(GAME_AUDIO);
