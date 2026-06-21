export const ASSET_BASE = 'assets/creatures';

/** 일반 물고기 공통 텍스처 (색상은 tint로 구분) */
export const NORMAL_FISH_TEXTURE = {
  texture: 'creature_normal_fish',
  textureScale: 0.72,
  textureFacing: 'left',
  useTint: true,
};

/** 오징어 공통 텍스처 (색상·크기는 종별 설정) */
export const SQUID_TEXTURE = {
  texture: 'creature_squid',
  textureScale: 0.72,
  textureFacing: 'right',
  useTint: true,
};

/** 가오리 공통 텍스처 (만타가오리는 tint·크기로 구분) */
export const RAY_TEXTURE = {
  texture: 'creature_ray',
  textureScale: 0.78,
  textureFacing: 'left',
};

/** 물개·바다표범 공통 텍스처 (이미지에 점박이 포함) */
export const FUR_SEAL_TEXTURE = {
  texture: 'creature_fur_seal',
  textureScale: 0.88,
  textureFacing: 'left',
};

/** 거북이 텍스처 */
export const TURTLE_TEXTURE = {
  texture: 'creature_turtle',
  textureScale: 0.85,
  textureFacing: 'left',
};

/** 해마 텍스처 (스폰마다 tintColors 중 랜덤 색상) */
export const SEAHORSE_TINT_COLORS = [
  0xff922b, 0xff6b6b, 0xffd43b, 0x51cf66, 0x339af0,
  0x845ef7, 0xf06595, 0x22b8cf, 0xfd7e14, 0x94d82a,
];

export const SEAHORSE_TEXTURE = {
  texture: 'creature_seahorse',
  textureScale: 0.88,
  textureFacing: 'left',
  useRandomTint: true,
  tintColors: SEAHORSE_TINT_COLORS,
};

/** 새우·딱총새우 공통 텍스처 (딱총새우는 tint로 구분) */
export const SHRIMP_TEXTURE = {
  texture: 'creature_shrimp',
  textureScale: 0.85,
  textureFacing: 'left',
};

/** 해파리 텍스처 */
export const JELLYFISH_TEXTURE = {
  texture: 'creature_jellyfish',
  textureScale: 0.72,
  textureFacing: 'left',
};

/** 바닷가재 텍스처 */
export const CRAYFISH_TEXTURE = {
  texture: 'creature_crayfish',
  textureScale: 0.88,
  textureFacing: 'left',
};

/** 불가사리 텍스처 */
export const STARFISH_TEXTURE = {
  texture: 'creature_starfish',
  textureScale: 0.72,
  textureFacing: 'left',
};

/** 파일럿: 이미지로 전환 완료된 텍스처 */
export const PILOT_TEXTURES = [
  { key: 'creature_normal_fish', path: `${ASSET_BASE}/normal_fish.png` },
  { key: 'creature_ray', path: `${ASSET_BASE}/ray.png` },
  { key: 'creature_squid', path: `${ASSET_BASE}/squid.png` },
  { key: 'creature_shark', path: `${ASSET_BASE}/shark.png` },
  { key: 'creature_makoshark', path: `${ASSET_BASE}/makoshark.png` },
  { key: 'creature_golden_fish', path: `${ASSET_BASE}/rainbow_fish.png` },
  { key: 'creature_carp_king', path: `${ASSET_BASE}/fishking.png` },
  { key: 'creature_crab', path: `${ASSET_BASE}/crap.png` },
  { key: 'creature_crayfish', path: `${ASSET_BASE}/lobster.png` },
  { key: 'creature_crocodile', path: `${ASSET_BASE}/crocodile.png` },
  { key: 'creature_whale_shark', path: `${ASSET_BASE}/whale_shark.png` },
  { key: 'creature_megalodon', path: `${ASSET_BASE}/megalodon.png` },
  { key: 'creature_mosasaurus', path: `${ASSET_BASE}/mosa.png` },
  { key: 'creature_fur_seal', path: `${ASSET_BASE}/fur_seal.png` },
  { key: 'creature_turtle', path: `${ASSET_BASE}/turtle.png` },
  { key: 'creature_dunkleosteus', path: `${ASSET_BASE}/dunkleosteus.png` },
  { key: 'creature_killer_whale', path: `${ASSET_BASE}/killer_whale.png` },
  { key: 'creature_eel', path: `${ASSET_BASE}/eel.png` },
  { key: 'creature_electric_eel', path: `${ASSET_BASE}/electric_eel.png` },
  { key: 'creature_lantern_anglerfish', path: `${ASSET_BASE}/lantern_anglerfish.png` },
  { key: 'creature_beluga', path: `${ASSET_BASE}/beluga.png` },
  { key: 'creature_blowfish', path: `${ASSET_BASE}/blowfish.png` },
  { key: 'creature_seahorse', path: `${ASSET_BASE}/seahorse.png` },
  { key: 'creature_shrimp', path: `${ASSET_BASE}/shrimp.png` },
  { key: 'creature_starfish', path: `${ASSET_BASE}/starfish.png` },
  { key: 'creature_hammerhead', path: `${ASSET_BASE}/hammerhead.png` },
  { key: 'creature_sawfish', path: `${ASSET_BASE}/sawfish.png` },
  { key: 'creature_horseshoe', path: `${ASSET_BASE}/horseshoe.png` },
  { key: 'creature_jellyfish', path: `${ASSET_BASE}/jellyfish.png` },
  { key: 'creature_wobbegong', path: `${ASSET_BASE}/basking_shark.png` },
  { key: 'creature_marlin', path: `${ASSET_BASE}/marlin.png` },
  { key: 'creature_mantis_shrimp', path: `${ASSET_BASE}/mantis_shrimp.png` },
  { key: 'creature_dolphin', path: `${ASSET_BASE}/dolpin.png` },
  { key: 'creature_octopus', path: `${ASSET_BASE}/outopus.png` },
  { key: 'creature_flyingfish', path: `${ASSET_BASE}/flying_fish.png` },
  { key: 'fisherman_face', path: `${ASSET_BASE}/face.png` },
];

/**
 * 전체 생물 에셋 계획 (manifest.json과 동일한 key/file 규칙)
 * status: pilot | planned
 */
export const CREATURE_TEXTURE_MANIFEST = [
  { kind: 'golden_fish', key: 'creature_golden_fish', file: 'rainbow_fish.png', status: 'pilot' },
  { kind: 'fish', key: 'creature_normal_fish', file: 'normal_fish.png', status: 'pilot' },
  { kind: 'fish', name: '붕어', key: 'creature_normal_fish', file: 'normal_fish.png', status: 'pilot' },
  { kind: 'fish', name: '잉어', key: 'creature_normal_fish', file: 'normal_fish.png', status: 'pilot' },
  { kind: 'fish', name: '송어', key: 'creature_normal_fish', file: 'normal_fish.png', status: 'pilot' },
  { kind: 'fish', name: '참치', key: 'creature_normal_fish', file: 'normal_fish.png', status: 'pilot' },
  { kind: 'jellyfish', key: 'creature_jellyfish', file: 'jellyfish.png', status: 'pilot' },
  { kind: 'octopus', key: 'creature_octopus', file: 'outopus.png', status: 'pilot' },
  { kind: 'squid', key: 'creature_squid', file: 'squid.png', status: 'pilot' },
  { kind: 'seahorse', key: 'creature_seahorse', file: 'seahorse.png', status: 'pilot' },
  { kind: 'turtle', key: 'creature_turtle', file: 'turtle.png', status: 'pilot' },
  { kind: 'eel', key: 'creature_eel', file: 'eel.png', status: 'pilot' },
  { kind: 'crab', key: 'creature_crab', file: 'crap.png', status: 'pilot' },
  { kind: 'crayfish', key: 'creature_crayfish', file: 'lobster.png', status: 'pilot' },
  { kind: 'dolphin', key: 'creature_dolphin', file: 'dolpin.png', status: 'pilot' },
  { kind: 'flyingfish', key: 'creature_flyingfish', file: 'flying_fish.png', status: 'pilot' },
  { kind: 'starfish', key: 'creature_starfish', file: 'starfish.png', status: 'pilot' },
  { kind: 'shrimp', key: 'creature_shrimp', file: 'shrimp.png', status: 'pilot' },
  { kind: 'ray', key: 'creature_ray', file: 'ray.png', status: 'pilot' },
  { kind: 'shark', key: 'creature_shark', file: 'shark.png', status: 'pilot' },
  { kind: 'wobbegong', key: 'creature_wobbegong', file: 'basking_shark.png', status: 'pilot' },
  { kind: 'makoshark', key: 'creature_makoshark', file: 'makoshark.png', status: 'pilot' },
  { kind: 'hammerhead', key: 'creature_hammerhead', file: 'hammerhead.png', status: 'pilot' },
  { kind: 'sawshark', key: 'creature_sawfish', file: 'sawfish.png', status: 'pilot' },
  { kind: 'beluga', key: 'creature_beluga', file: 'beluga.png', status: 'pilot' },
  { kind: 'orca', key: 'creature_killer_whale', file: 'killer_whale.png', status: 'pilot' },
  { kind: 'manta', key: 'creature_ray', file: 'ray.png', status: 'pilot' },
  { kind: 'giantsquid', key: 'creature_squid', file: 'squid.png', status: 'pilot' },
  { kind: 'megalodon', key: 'creature_megalodon', file: 'megalodon.png', status: 'pilot' },
  { kind: 'mosasaurus', key: 'creature_mosasaurus', file: 'mosa.png', status: 'pilot' },
  { kind: 'electric_eel', key: 'creature_electric_eel', file: 'electric_eel.png', status: 'pilot' },
  { kind: 'mantis_shrimp', key: 'creature_mantis_shrimp', file: 'mantis_shrimp.png', status: 'pilot' },
  { kind: 'lantern_anglerfish', key: 'creature_lantern_anglerfish', file: 'lantern_anglerfish.png', status: 'pilot' },
  { kind: 'seal', key: 'creature_fur_seal', file: 'fur_seal.png', status: 'pilot' },
  { kind: 'leopard_seal', key: 'creature_fur_seal', file: 'fur_seal.png', status: 'pilot' },
  { kind: 'dunkleosteus', key: 'creature_dunkleosteus', file: 'dunkleosteus.png', status: 'pilot' },
  { kind: 'horseshoe_crab', key: 'creature_horseshoe', file: 'horseshoe.png', status: 'pilot' },
  { kind: 'pufferfish', key: 'creature_blowfish', file: 'blowfish.png', status: 'pilot' },
  { kind: 'carp_king', key: 'creature_carp_king', file: 'fishking.png', status: 'pilot' },
  { kind: 'marlin', key: 'creature_marlin', file: 'marlin.png', status: 'pilot' },
  { kind: 'crocodile', key: 'creature_crocodile', file: 'crocodile.png', status: 'pilot' },
  { kind: 'pistol_shrimp', key: 'creature_shrimp', file: 'shrimp.png', status: 'pilot' },
  { kind: 'whale_shark', key: 'creature_whale_shark', file: 'whale_shark.png', status: 'pilot' },
];

export function getTextureKeyForCreature(creature) {
  if (creature.texture) {
    return creature.texture;
  }

  const match = CREATURE_TEXTURE_MANIFEST.find((entry) => {
    if (entry.name) {
      return entry.kind === creature.kind && entry.name === creature.name;
    }
    return entry.kind === creature.kind;
  });

  return match?.status === 'pilot' ? match.key : null;
}
