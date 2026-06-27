/** 2번째 낚시 게임 — 어종·타이밍 설정 */

export const FISHING2_PHASE = {
  IDLE: 'idle',
  CHARGING: 'charging',
  CASTING: 'casting',
  WAITING: 'waiting',
  BITE: 'bite',
  FIGHTING: 'fighting',
  CAUGHT: 'caught',
  ESCAPED: 'escaped',
};

/** weight: 출현 확률 가중치 (클수록 자주 등장) */
export const FISHING2_FISH = [
  { name: '붕어', texture: 'creature_normal_fish', color: 0xffa94d, useTint: true, flipX: true, aspect: 0.72, points: 10, weight: 24, speed: 1.0, progressGain: 22, progressLoss: 14 },
  { name: '고등어', texture: 'creature_normal_fish', color: 0x74c0fc, useTint: true, flipX: true, aspect: 0.72, points: 20, weight: 20, speed: 1.15, progressGain: 20, progressLoss: 16 },
  { name: '잉어', texture: 'creature_normal_fish', color: 0xff6b6b, useTint: true, flipX: true, aspect: 0.72, points: 30, weight: 16, speed: 1.25, progressGain: 18, progressLoss: 18 },
  { name: '새우', texture: 'creature_shrimp', useTint: false, flipX: true, aspect: 0.68, points: 15, weight: 12, speed: 1.3, progressGain: 19, progressLoss: 17 },
  { name: '오징어', texture: 'creature_squid', color: 0xbe4bdb, useTint: true, flipX: false, aspect: 0.7, points: 25, weight: 10, speed: 1.2, progressGain: 18, progressLoss: 17 },
  { name: '해마', texture: 'creature_seahorse', useTint: false, flipX: true, aspect: 1.05, points: 35, weight: 8, speed: 1.1, progressGain: 17, progressLoss: 16 },
  { name: '가오리', texture: 'creature_ray', useTint: false, flipX: true, aspect: 0.78, points: 40, weight: 6, speed: 1.15, progressGain: 16, progressLoss: 18 },
  { name: '복어', texture: 'creature_blowfish', useTint: false, flipX: true, aspect: 0.9, points: 32, weight: 5, speed: 0.95, progressGain: 20, progressLoss: 15 },
  { name: '해파리', texture: 'creature_jellyfish', useTint: false, flipX: false, aspect: 0.85, points: 22, weight: 5, speed: 0.9, progressGain: 21, progressLoss: 14 },
  { name: '불가사리', texture: 'creature_starfish', useTint: false, flipX: false, aspect: 0.82, points: 18, weight: 4, speed: 0.85, progressGain: 22, progressLoss: 13 },
  { name: '농어', texture: 'creature_normal_fish', color: 0x51cf66, useTint: true, flipX: true, aspect: 0.72, points: 45, weight: 6, speed: 1.35, progressGain: 17, progressLoss: 20 },
  { name: '연어', texture: 'creature_normal_fish', color: 0xf06595, useTint: true, flipX: true, aspect: 0.72, points: 60, weight: 3, speed: 1.5, progressGain: 15, progressLoss: 22 },
  { name: '바닷가재', texture: 'creature_crayfish', useTint: false, flipX: true, aspect: 0.75, points: 38, weight: 3, speed: 1.25, progressGain: 16, progressLoss: 19 },
  { name: '초롱아귀', texture: 'creature_lantern_anglerfish', useTint: false, flipX: true, aspect: 0.8, points: 55, weight: 2, speed: 1.1, progressGain: 14, progressLoss: 21 },
  { name: '청새치', texture: 'creature_marlin', useTint: false, flipX: true, aspect: 0.65, points: 70, weight: 1, speed: 1.55, progressGain: 13, progressLoss: 23 },
];

export const FISHING2_TIMINGS = {
  biteWaitMin: 1800,
  biteWaitMax: 5500,
  reelWindowMs: 4500,
  fightTimeLimitMs: 14000,
  catchProgressRequired: 100,
  castAnimMs: 700,
  caughtDisplayMs: 2200,
  escapedDisplayMs: 1600,
};

export const FISHING2_LAYOUT = {
  trackRightMargin: 16,
  trackWidth: 64,
  trackHeight: 220,
  progressBarWidth: 14,
  progressBarGap: 22,
  playerZoneHeight: 92,
  fishIconSize: 34,
  fishMoveIntervalMin: 550,
  fishMoveIntervalMax: 1100,
};

export function getFishing2TrackLayout(gameWidth) {
  const {
    trackRightMargin,
    trackWidth,
    progressBarWidth,
    progressBarGap,
  } = FISHING2_LAYOUT;

  const progressCenterX = gameWidth - trackRightMargin - progressBarWidth / 2;
  const trackCenterX = progressCenterX - progressBarWidth / 2 - progressBarGap - trackWidth / 2;
  const trackX = trackCenterX - trackWidth / 2;

  return { trackX, trackCenterX, progressCenterX };
}

export function pickRandomFish2() {
  const totalWeight = FISHING2_FISH.reduce((sum, fish) => sum + fish.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const fish of FISHING2_FISH) {
    roll -= fish.weight;
    if (roll <= 0) {
      return fish;
    }
  }

  return FISHING2_FISH[0];
}

export function getFish2DisplayHeight(fish, width) {
  return width * (fish.aspect ?? 0.72);
}
