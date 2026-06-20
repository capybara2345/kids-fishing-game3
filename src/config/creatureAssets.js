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

/** 물개·바다표범 공통 텍스처 (바다표범은 leopardPattern으로 구분) */
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
  { key: 'creature_crocodile', path: `${ASSET_BASE}/crocodile.png` },
  { key: 'creature_whale_shark', path: `${ASSET_BASE}/whale_shark.png` },
  { key: 'creature_megalodon', path: `${ASSET_BASE}/megalodon.png` },
  { key: 'creature_fur_seal', path: `${ASSET_BASE}/fur_seal.png` },
  { key: 'creature_turtle', path: `${ASSET_BASE}/turtle.png` },
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
  { kind: 'jellyfish', key: 'creature_jellyfish', file: 'jellyfish.png', status: 'planned' },
  { kind: 'octopus', key: 'creature_octopus', file: 'octopus.png', status: 'planned' },
  { kind: 'squid', key: 'creature_squid', file: 'squid.png', status: 'pilot' },
  { kind: 'seahorse', key: 'creature_seahorse', file: 'seahorse.png', status: 'planned' },
  { kind: 'turtle', key: 'creature_turtle', file: 'turtle.png', status: 'pilot' },
  { kind: 'eel', key: 'creature_eel', file: 'eel.png', status: 'planned' },
  { kind: 'crab', key: 'creature_crab', file: 'crap.png', status: 'pilot' },
  { kind: 'crayfish', key: 'creature_crayfish', file: 'crayfish.png', status: 'planned' },
  { kind: 'dolphin', key: 'creature_dolphin', file: 'dolphin.png', status: 'planned' },
  { kind: 'flyingfish', key: 'creature_flyingfish', file: 'flyingfish.png', status: 'planned' },
  { kind: 'starfish', key: 'creature_starfish', file: 'starfish.png', status: 'planned' },
  { kind: 'shrimp', key: 'creature_shrimp', file: 'shrimp.png', status: 'planned' },
  { kind: 'ray', key: 'creature_ray', file: 'ray.png', status: 'pilot' },
  { kind: 'shark', key: 'creature_shark', file: 'shark.png', status: 'pilot' },
  { kind: 'wobbegong', key: 'creature_wobbegong', file: 'wobbegong.png', status: 'planned' },
  { kind: 'makoshark', key: 'creature_makoshark', file: 'makoshark.png', status: 'pilot' },
  { kind: 'hammerhead', key: 'creature_hammerhead', file: 'hammerhead.png', status: 'planned' },
  { kind: 'orca', key: 'creature_orca', file: 'orca.png', status: 'planned' },
  { kind: 'manta', key: 'creature_ray', file: 'ray.png', status: 'pilot' },
  { kind: 'giantsquid', key: 'creature_squid', file: 'squid.png', status: 'pilot' },
  { kind: 'megalodon', key: 'creature_megalodon', file: 'megalodon.png', status: 'pilot' },
  { kind: 'seal', key: 'creature_fur_seal', file: 'fur_seal.png', status: 'pilot' },
  { kind: 'leopard_seal', key: 'creature_fur_seal', file: 'fur_seal.png', status: 'pilot' },
  { kind: 'dunkleosteus', key: 'creature_dunkleosteus', file: 'dunkleosteus.png', status: 'planned' },
  { kind: 'horseshoe_crab', key: 'creature_horseshoe_crab', file: 'horseshoe_crab.png', status: 'planned' },
  { kind: 'pufferfish', key: 'creature_pufferfish', file: 'pufferfish.png', status: 'planned' },
  { kind: 'carp_king', key: 'creature_carp_king', file: 'fishking.png', status: 'pilot' },
  { kind: 'crocodile', key: 'creature_crocodile', file: 'crocodile.png', status: 'pilot' },
  { kind: 'pistol_shrimp', key: 'creature_pistol_shrimp', file: 'pistol_shrimp.png', status: 'planned' },
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
