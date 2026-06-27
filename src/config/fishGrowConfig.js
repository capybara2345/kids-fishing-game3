/** 물고기 키우기 게임 — 어종·성장 설정 */

export const GROW_WORLD = {
  width: 844,
  height: 390,
};

export const GROW_PLAYER = {
  startSize: 34,
  maxSize: 110,
  growthPerBite: 2.2,
  tint: 0xffd43b,
  texture: 'creature_normal_fish',
  textureFacing: 'left',
  baseSpeed: 185,
};

export const GROW_TIMINGS = {
  spawnIntervalMs: 1300,
  maxFishOnScreen: 14,
};

/** 화면 가로의 약 1/3 — 고래상어·둔클레오 등 거대 어종 크기 */
export const GROW_GIANT_FISH_SIZE = Math.round(GROW_WORLD.width / 3);
export const GROW_GIANT_SIZE_VARIANCE = 0.1;

/** weight: 출현 가중치 */
export const GROW_SPECIES = [
  { name: '멸치', texture: 'creature_normal_fish', useTint: true, color: 0xced4da, aspect: 0.72, weight: 22, sizeScaleMin: 0.42, sizeScaleMax: 0.72, speed: 95 },
  { name: '정어리', texture: 'creature_normal_fish', useTint: true, color: 0x74c0fc, aspect: 0.72, weight: 18, sizeScaleMin: 0.5, sizeScaleMax: 0.82, speed: 110 },
  { name: '새우', texture: 'creature_shrimp', useTint: false, aspect: 0.68, weight: 14, sizeScaleMin: 0.38, sizeScaleMax: 0.62, speed: 100 },
  { name: '붕어', texture: 'creature_normal_fish', useTint: true, color: 0xffa94d, aspect: 0.72, weight: 12, sizeScaleMin: 0.55, sizeScaleMax: 0.9, speed: 85 },
  { name: '해마', texture: 'creature_seahorse', useTint: false, aspect: 1.05, weight: 8, sizeScaleMin: 0.45, sizeScaleMax: 0.75, speed: 70 },
  { name: '오징어', texture: 'creature_squid', useTint: true, color: 0xbe4bdb, aspect: 0.7, textureFacing: 'right', weight: 8, sizeScaleMin: 0.65, sizeScaleMax: 1.0, speed: 105 },
  { name: '가오리', texture: 'creature_ray', useTint: false, aspect: 0.78, weight: 6, sizeScaleMin: 0.85, sizeScaleMax: 1.25, speed: 80 },
  { name: '복어', texture: 'creature_blowfish', useTint: false, aspect: 0.9, weight: 6, sizeScaleMin: 0.7, sizeScaleMax: 1.05, speed: 75 },
  {
    name: '상어',
    texture: 'creature_shark',
    useTint: false,
    aspect: 0.72,
    weight: 5,
    sizeScaleMin: 1.65,
    sizeScaleMax: 2.5,
    minSize: 105,
    speed: 120,
    isLarge: true,
    warningMessage: '상어가 나타났다! 조심해!',
  },
  {
    name: '고래상어',
    texture: 'creature_whale_shark',
    useTint: false,
    aspect: 0.75,
    weight: 2,
    speed: 72,
    isLarge: true,
    isGiant: true,
    warningMessage: '고래상어다! 피해!',
  },
  {
    name: '메갈로돈',
    texture: 'creature_megalodon',
    useTint: false,
    aspect: 0.78,
    weight: 1,
    speed: 95,
    isLarge: true,
    isGiant: true,
    warningMessage: '메갈로돈이다! 도망쳐!',
  },
  {
    name: '둔클레오스테우스',
    texture: 'creature_dunkleosteus',
    useTint: false,
    aspect: 0.92,
    weight: 1,
    speed: 68,
    isLarge: true,
    isGiant: true,
    warningMessage: '둔클레오스테우스다! 숨어라!',
  },
];

export function pickGrowSpecies() {
  const total = GROW_SPECIES.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const species of GROW_SPECIES) {
    roll -= species.weight;
    if (roll <= 0) return species;
  }
  return GROW_SPECIES[0];
}

export function rollFishSize(species, playerSize) {
  if (species.isGiant) {
    const spread = GROW_GIANT_FISH_SIZE * GROW_GIANT_SIZE_VARIANCE;
    return Math.round(GROW_GIANT_FISH_SIZE + (Math.random() * 2 - 1) * spread);
  }

  const scale = species.sizeScaleMin + Math.random() * (species.sizeScaleMax - species.sizeScaleMin);
  let size = Math.round(playerSize * scale);
  if (species.minSize != null) {
    size = Math.max(species.minSize, size);
  }
  return size;
}

export function isGiantGrowSpecies(species) {
  return species.isGiant === true;
}

export function calcEatPoints(fishSize) {
  return Math.max(5, Math.round(fishSize * 1.4));
}

export function isLargeGrowSpecies(species) {
  return species.isLarge === true;
}

export function calcPlayerSpeed(playerSize) {
  return Math.max(105, GROW_PLAYER.baseSpeed - playerSize * 0.55);
}
