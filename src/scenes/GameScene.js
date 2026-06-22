import Phaser from 'phaser';
import { getTextureKeyForCreature, CRAYFISH_TEXTURE, FUR_SEAL_TEXTURE, JELLYFISH_TEXTURE, NORMAL_FISH_TEXTURE, RAY_TEXTURE, SEAHORSE_TEXTURE, SHRIMP_TEXTURE, SQUID_TEXTURE, STARFISH_TEXTURE, TURTLE_TEXTURE } from '../config/creatureAssets.js';
import { GAME_AUDIO } from '../config/gameAudio.js';
import { getQuizQuestionType, pickRandomQuizQuestion, QUIZ_CATEGORY_LABELS } from '../config/quizQuestions.js';

const GAME_WIDTH = 844;
const WHALE_SHARK_SIZE = Math.round(GAME_WIDTH / 3);
const MEGALODON_SIZE = Math.round(WHALE_SHARK_SIZE * 0.86);
const MOSASAURUS_SIZE = MEGALODON_SIZE;
const DUNKLEOSTEUS_SIZE = Math.round(WHALE_SHARK_SIZE * 0.9);
const GAME_HEIGHT = 390;
const GAME_DURATION = 60;
const WATER_TOP = 72;
const CONTROL_ZONE_HEIGHT = 112;
const WATER_BOTTOM = GAME_HEIGHT;
const SAND_HEIGHT = 52;
const SAND_TOP = WATER_BOTTOM - SAND_HEIGHT;
const SAND_DEPTH = 2;
const CREATURE_DEPTH = 5;
const SAND_CRAWLER_DEPTH = 7;
const HOOK_LINE_DEPTH = 12;
const WATER_FLOOR_MARGIN = 10;
const WATER_GRADIENT_TOP = 0x1864ab;
const WATER_GRADIENT_BOTTOM = 0x0b7285;
const MEGALODON_WATER_GRADIENT_TOP = 0x9b1c1c;
const MEGALODON_WATER_GRADIENT_BOTTOM = 0x5c1010;
const APEX_PREDATOR_KINDS = new Set(['megalodon', 'mosasaurus', 'electric_eel', 'mantis_shrimp']);
const APEX_PREDATOR_SPAWN_MESSAGES = {
  megalodon: '🦈 메갈로돈이 나타났다! 🦈',
  mosasaurus: '🦕 모사사우루스가 나타났다! 🦕',
  electric_eel: '⚡ 전기뱀장어가 나타났다! ⚡',
  mantis_shrimp: '🦐 맨티스쉬림프가 나타났다! 🦐',
};

function isApexPredator(kind) {
  return APEX_PREDATOR_KINDS.has(kind);
}

function maybeCreateGoldVariant(type) {
  if (Math.random() >= GOLD_VARIANT_CHANCE) return type;

  return {
    ...type,
    isGoldVariant: true,
    points: type.points + GOLD_VARIANT_BONUS_POINTS,
    name: `황금 ${type.name}`,
  };
}

function lerpWaterColor(fromColor, toColor, t) {
  const from = Phaser.Display.Color.IntegerToColor(fromColor);
  const to = Phaser.Display.Color.IntegerToColor(toColor);
  const blended = Phaser.Display.Color.Interpolate.ColorWithColor(
    from,
    to,
    100,
    Math.round(Phaser.Math.Clamp(t, 0, 1) * 100),
  );
  return Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b);
}

function isSandCrawler(type) {
  return type.moveStyle === 'sand';
}

function getWaterFloorY(type = { size: 24 }) {
  return SAND_TOP - Math.max(WATER_FLOOR_MARGIN, type.size * 0.15);
}

function getSandCrawlerY(type, bobTime = 0, bobOffset = 0) {
  const bob = bobTime ? Math.sin(bobTime * 10 + bobOffset) * 1.5 : 0;
  return SAND_TOP + type.size * 0.16 + (type.sandYOffset ?? 0) + bob;
}

function getCreatureCollisionRadius(fish) {
  return fish.creatureType.size * 0.42;
}

function creaturesOverlap(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y)
    < getCreatureCollisionRadius(a) + getCreatureCollisionRadius(b);
}

function getFlyingfishAngle(vx, vy, wobble = 0) {
  // flying_fish.png 기본 방향이 왼쪽이라 이동 벡터와 맞추려면 180° 보정
  return Phaser.Math.RadToDeg(Math.atan2(vy, vx)) - 180 + wobble;
}
const ROD_BASE_OFFSET_X = 30;
const ROD_TIP_OFFSET_X = 76;
const ROD_OFFSET_Y = 20;
const FISHERMAN_Y = WATER_TOP - 42;
const ROD_BASE_Y_OFFSET = 6 + ROD_OFFSET_Y;
const ROD_TIP_Y_OFFSET = -14 + ROD_OFFSET_Y;
const HOOK_SPEED = 280;
const REEL_SPEED = 320;
const GOLD_VARIANT_CHANCE = 0.06;
const GOLD_VARIANT_BONUS_POINTS = 100;
const GIANT_LINE_BREAK_CHANCE = 0.38;
const SHARK_LINE_BREAK_CHANCE = 0.15;
const SHARK_KINDS = new Set(['shark', 'wobbegong', 'makoshark', 'sawshark', 'hammerhead']);
const INK_SPLASH_KINDS = new Set(['octopus', 'squid', 'giantsquid']);
const INK_SPLASH_DEPTH = 40;
const QUIZ_COOLDOWN_SECONDS = 20;
const QUIZ_DRAW_CANVAS_WIDTH = 420;
const QUIZ_DRAW_CANVAS_HEIGHT = 128;
const QUIZ_DRAW_PANEL_Y = GAME_HEIGHT / 2 + 8;
const QUIZ_DRAW_CANVAS_OFFSET_Y = 34;
const QUIZ_DRAW_CANVAS_CENTER_X = GAME_WIDTH / 2;
const QUIZ_DRAW_CANVAS_CENTER_Y = QUIZ_DRAW_PANEL_Y + QUIZ_DRAW_CANVAS_OFFSET_Y;
const QUIZ_CATEGORY_TEXT_Y = -74;
const QUIZ_TEXT_Y = -38;
const QUIZ_DRAW_TEXT_RAISE = 15;
const LIGHTNING_FREEZE_SECONDS = 2;
const LIGHTNING_COOLDOWN_SECONDS = 20;
const LIGHTNING_EFFECT_DEPTH = 3;
const APEX_TSUNAMI_EFFECT_DEPTH = 4;
const MIN_CATCH_SUCCESS_RATE = 0.9;
/** 테스트용: 게임 시작 시 강제 등장 종 ('megalodon' | 'mosasaurus' | 'electric_eel' | 'mantis_shrimp' | 'whale_shark' | null) */
const TEST_FIRST_CREATURE = null;

function getLineBreakChance(type) {
  if (type.lineBreakChance != null) return type.lineBreakChance;
  if (type.giantTier) return GIANT_LINE_BREAK_CHANCE;
  if (SHARK_KINDS.has(type.kind)) return SHARK_LINE_BREAK_CHANCE;
  return 0;
}

function resolveCatchSuccessRate(type) {
  const catchRate = type.catchChance == null
    ? 1
    : Math.max(type.catchChance, MIN_CATCH_SUCCESS_RATE);
  const successAfterHook = catchRate * (1 - getLineBreakChance(type));
  return Math.max(successAfterHook, MIN_CATCH_SUCCESS_RATE);
}
const CREATURES = [
  { kind: 'fish', name: '붕어', color: 0xffa94d, points: 10, speed: 80, size: 28, weight: 18, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '잉어', color: 0xff6b6b, points: 20, speed: 100, size: 34, weight: 16, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '송어', color: 0x69db7c, points: 35, speed: 130, size: 30, weight: 14, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '참치', color: 0x4dabf7, points: 50, speed: 160, size: 42, weight: 10, ...NORMAL_FISH_TEXTURE },
  { kind: 'jellyfish', name: '해파리', color: 0xda77f2, points: 25, speed: 55, size: 34, weight: 9, ...JELLYFISH_TEXTURE },
  { kind: 'octopus', name: '문어', color: 0x845ef7, points: 45, speed: 70, size: 64, weight: 6, moveStyle: 'diagonal', texture: 'creature_octopus', textureScale: 0.86, textureFacing: 'left' },
  { kind: 'squid', name: '오징어', color: 0xffffff, points: 38, speed: 110, size: 40, weight: 8, moveStyle: 'zigzag', zigzagInterval: 0.48, zigzagVerticalRatio: 0.68, ...SQUID_TEXTURE },
  { kind: 'seahorse', name: '해마', color: 0xff922b, points: 30, speed: 65, size: 34, weight: 8, ...SEAHORSE_TEXTURE },
  { kind: 'turtle', name: '거북이', color: 0x40c057, points: 60, speed: 38, size: 44, weight: 8, ...TURTLE_TEXTURE, fleeFromHook: true, fleeRadius: 130, fleeSpeedMultiplier: 1.8 },
  { kind: 'eel', name: '바다장어', color: 0x343a40, points: 40, speed: 95, size: 104, weight: 7, texture: 'creature_eel', textureScale: 0.85, textureFacing: 'left' },
  { kind: 'crab', name: '게', color: 0xfa5252, points: 22, speed: 75, size: 50, weight: 11, spawnZone: 'bottom', moveStyle: 'sand', texture: 'creature_crab', textureScale: 0.92, textureFacing: 'left' },
  { kind: 'crayfish', name: '가재', color: 0xb01e1e, points: 28, speed: 65, size: 34, weight: 9, spawnZone: 'bottom', moveStyle: 'sand', sandYOffset: -15, ...CRAYFISH_TEXTURE },
  { kind: 'dolphin', name: '돌고래', color: 0x339af0, points: 42, speed: 120, size: 72, weight: 7, moveStyle: 'diagonal', texture: 'creature_dolphin', textureScale: 0.88, textureFacing: 'left' },
  { kind: 'flyingfish', name: '날치', color: 0x91a7ff, points: 32, speed: 140, size: 64, weight: 8, moveStyle: 'diagonal', texture: 'creature_flyingfish', textureScale: 0.9, textureFacing: 'left' },
  { kind: 'starfish', name: '불가사리', color: 0xff6b6b, points: 18, speed: 35, size: 28, weight: 10, ...STARFISH_TEXTURE },
  { kind: 'shrimp', name: '새우', color: 0xff8787, points: 15, speed: 145, size: 22, weight: 12, ...SHRIMP_TEXTURE },
  { kind: 'ray', name: '가오리', color: 0x748ffc, points: 55, speed: 75, size: 48, weight: 5, ...RAY_TEXTURE },
  { kind: 'shark', name: '상어', color: 0x5c6773, points: 80, speed: 125, size: 136, weight: 2, texture: 'creature_shark', textureFacing: 'left' },
  { kind: 'wobbegong', name: '돌묵상어', color: 0x8d6e63, points: 70, speed: 65, size: 116, weight: 3, spawnZone: 'bottom', texture: 'creature_wobbegong', textureScale: 0.82, textureFacing: 'left' },
  { kind: 'sawshark', name: '톱상어', color: 0x78909c, points: 75, speed: 70, size: 200, weight: 3, spawnZone: 'mid', texture: 'creature_sawfish', textureScale: 0.82, textureFacing: 'left' },
  { kind: 'beluga', name: '벨루가', color: 0xe9ecef, points: 80, speed: 75, size: 200, weight: 3, spawnZone: 'large', texture: 'creature_beluga', textureScale: 0.82, textureFacing: 'left' },
  { kind: 'makoshark', name: '청상아리', color: 0x78909c, points: 75, speed: 70, size: 124, weight: 3, spawnZone: 'mid', texture: 'creature_makoshark', textureScale: 0.78, textureFacing: 'left' },
  { kind: 'hammerhead', name: '귀상어', color: 0x607d8b, points: 85, speed: 115, size: 128, weight: 2, spawnZone: 'mid', texture: 'creature_hammerhead', textureScale: 0.82, textureFacing: 'left' },
  { kind: 'orca', name: '범고래', color: 0x212529, points: 90, speed: 130, size: 144, weight: 2, spawnZone: 'large', texture: 'creature_killer_whale', textureScale: 0.88, textureFacing: 'left' },
  { kind: 'manta', name: '만타가오리', color: 0x546e7a, points: 88, speed: 60, size: 144, weight: 2, spawnZone: 'large', ...RAY_TEXTURE, useTint: true },
  { kind: 'giantsquid', name: '대왕오징어', color: 0x4a148c, points: 95, speed: 85, size: 114, weight: 2, spawnZone: 'deep', moveStyle: 'zigzag', zigzagInterval: 0.65, zigzagVerticalRatio: 0.58, giantTier: true, lineBreakChance: 0.35, ...SQUID_TEXTURE, textureScale: 0.82 },
  { kind: 'lantern_anglerfish', name: '초롱아귀', color: 0x8d5524, points: 78, speed: 48, size: 76, weight: 4, spawnZone: 'deep', texture: 'creature_lantern_anglerfish', textureScale: 0.88, textureFacing: 'left' },
  { kind: 'megalodon', name: '메갈로돈', color: 0x37474f, points: 300, speed: 165, size: MEGALODON_SIZE, weight: 1, spawnZone: 'large', giantTier: true, lineBreakChance: 0.5, catchChance: 0.1, texture: 'creature_megalodon', textureScale: 1, textureFacing: 'left' },
  { kind: 'mosasaurus', name: '모사사우루스', color: 0x455a64, points: 300, speed: 165, size: MOSASAURUS_SIZE, weight: 1, spawnZone: 'large', giantTier: true, lineBreakChance: 0.5, catchChance: 0.1, texture: 'creature_mosasaurus', textureScale: 1, textureFacing: 'right' },
  { kind: 'electric_eel', name: '전기뱀장어', color: 0xffd43b, points: 300, speed: 165, size: MEGALODON_SIZE, weight: 1, spawnZone: 'large', giantTier: true, lineBreakChance: 0.5, catchChance: 0.1, texture: 'creature_electric_eel', textureScale: 1, textureFacing: 'left', electricEffect: true },
  { kind: 'mantis_shrimp', name: '맨티스쉬림프', color: 0x51cf66, points: 300, speed: 210, size: 130, weight: 1, spawnZone: 'bottom', moveStyle: 'bottomJump', jumpPower: 0.92, jumpInterval: 0.5, gravity: 520, giantTier: true, lineBreakChance: 0.5, catchChance: 0.1, texture: 'creature_mantis_shrimp', textureScale: 0.88, textureFacing: 'right' },
  { kind: 'seal', name: '물개', color: 0xadb5bd, points: 48, speed: 85, size: 40, weight: 6, spawnZone: 'surface', ...FUR_SEAL_TEXTURE },
  { kind: 'leopard_seal', name: '바다표범', color: 0xf1f3f5, points: 65, speed: 100, size: 44, weight: 4, spawnZone: 'mid', ...FUR_SEAL_TEXTURE, textureScale: 0.9 },
  { kind: 'dunkleosteus', name: '둔클레오사우루스', color: 0x5d4e37, points: 200, speed: 55, size: DUNKLEOSTEUS_SIZE, weight: 2, spawnZone: 'large', texture: 'creature_dunkleosteus', textureScale: 0.92, textureFacing: 'left' },
  { kind: 'horseshoe_crab', name: '투구게', color: 0x6d4c41, points: 35, speed: 50, size: 44, weight: 7, spawnZone: 'bottom', texture: 'creature_horseshoe', textureScale: 0.88, textureFacing: 'left' },
  { kind: 'pufferfish', name: '복어', color: 0xffe066, points: 35, speed: 70, size: 60, weight: 8, spawnZone: 'mid', texture: 'creature_blowfish', textureScale: 0.88, textureFacing: 'left' },
  { kind: 'carp_king', name: '잉어킹', color: 0xff922b, points: 75, speed: 90, size: 50, weight: 4, spawnZone: 'mid', texture: 'creature_carp_king', textureScale: 0.72, textureFacing: 'left' },
  { kind: 'marlin', name: '청새치', color: 0x4dabf7, points: 120, speed: 175, size: 140, weight: 2, spawnZone: 'large', moveStyle: 'diagonal', texture: 'creature_marlin', textureScale: 0.92, textureFacing: 'left' },
  { kind: 'crocodile', name: '악어', color: 0x2b8a3e, points: 70, speed: 45, size: 84, weight: 4, spawnZone: 'surface', catchChance: 0.3, texture: 'creature_crocodile', textureScale: 0.78, textureFacing: 'left' },
  { kind: 'pistol_shrimp', name: '딱총새우', color: 0x339af0, points: 28, speed: 120, size: 24, weight: 9, spawnZone: 'bottom', ...SHRIMP_TEXTURE, useTint: true },
  { kind: 'whale_shark', name: '고래상어', color: 0x339af0, points: 110, speed: 28, size: WHALE_SHARK_SIZE, weight: 1, spawnZone: 'large', giantTier: true, lineBreakChance: 0.42, catchChance: 0.05, texture: 'creature_whale_shark', textureScale: 1, textureFacing: 'left' },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.isCasting = false;
    this.isReeling = false;
    this.isGameOver = false;
    this.isQuizActive = false;
    this.isQuizLocked = false;
    this.quizCooldownLeft = 0;
    this.quizCooldownTimer = null;
    this.hookDepth = 0;
    this.apexPredatorThreatCount = 0;
    this.apexPredatorWaterTween = null;
    this.apexPredatorWaterBlend = 0;
    this.pendingApexSpawnSound = false;
    this.lightningCooldownLeft = 0;
    this.lightningCooldownTimer = null;
    this.creatureFreezeRemaining = 0;
    this.lightningEffectContainer = null;
    this.lightningEffectFlicker = null;
    this.lightningEffectEndTimer = null;
    this.apexTsunamiContainer = null;
    this.apexTsunamiEndTimer = null;
    this.apexTsunamiAmbientEvent = null;
    this.apexTsunamiAmbientContainer = null;

    this.createBackground();
    this.createDock();
    this.createFisherman();
    this.createLineAndHook();
    this.maxHookDepth = Math.max(40, SAND_TOP - this.rodTipY - 10);
    this.setupAudio();
    this.createUI();
    this.createTouchControls();
    this.createFishGroup();
    this.setupInput();
    this.createStartOverlay();

    if (TEST_FIRST_CREATURE === 'megalodon' || TEST_FIRST_CREATURE === 'mosasaurus' || TEST_FIRST_CREATURE === 'electric_eel' || TEST_FIRST_CREATURE === 'mantis_shrimp') {
      this.pendingStartMessage = {
        text: '던지기 버튼으로 낚싯줄을 던지세요!',
        duration: 2200,
        delay: 3200,
      };
    } else {
      this.pendingStartMessage = {
        text: '던지기 버튼으로 낚싯줄을 던지세요!',
        duration: 2200,
        delay: 0,
      };
    }
  }

  createStartOverlay() {
    this.isGameStarted = false;
    this.touchUI?.setVisible(false);

    this.startOverlay = this.add.container(0, 0).setDepth(220);

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x0b1d33,
      0.78,
    );

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, '낚시 게임', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16, '시작하기를 누르면 배경음악과 함께 게임이 시작됩니다', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#d0ebff',
      align: 'center',
    }).setOrigin(0.5);

    const startButton = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 42);
    const buttonBg = this.add.rectangle(0, 0, 220, 58, 0x339af0, 0.96).setStrokeStyle(2, 0xffffff);
    const buttonText = this.add.text(0, 0, '시작하기', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);
    startButton.add([buttonBg, buttonText]);
    startButton.setSize(220, 58);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => {
      buttonBg.setFillStyle(0x228be6, 1);
      this.beginGame();
    });
    startButton.on('pointerup', () => {
      buttonBg.setFillStyle(0x339af0, 0.96);
    });
    startButton.on('pointerout', () => {
      buttonBg.setFillStyle(0x339af0, 0.96);
    });

    this.startOverlay.add([backdrop, title, subtitle, startButton]);
  }

  beginGame() {
    if (this.isGameStarted) return;
    this.isGameStarted = true;

    if (this.startOverlay) {
      this.startOverlay.destroy();
      this.startOverlay = null;
    }

    if (this.sound.locked) {
      this.sound.unlock();
    }
    this.startBgm();

    this.setupTimers();
    this.touchUI?.setVisible(true);
    this.updateTouchControlsVisibility();

    const { text, duration, delay = 0 } = this.pendingStartMessage ?? {
      text: '던지기 버튼으로 낚싯줄을 던지세요!',
      duration: 2200,
      delay: 0,
    };

    if (delay > 0) {
      this.time.delayedCall(delay, () => {
        if (!this.isGameOver) {
          this.showMessage(text, duration);
        }
      });
    } else {
      this.showMessage(text, duration);
    }

    if (this.pendingApexSpawnSound) {
      this.pendingApexSpawnSound = false;
      this.playApexPredatorSpawnSound();
    }
  }

  createTouchButton(x, y, width, height, label, onDown, onUp) {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, 0x1c314a, 0.88);
    bg.setStrokeStyle(2, 0xffffff);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(width, height);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      bg.setFillStyle(0x339af0, 0.95);
      onDown();
    });

    const release = () => {
      bg.setFillStyle(0x1c314a, 0.88);
      onUp();
    };

    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    return button;
  }

  createActionButton(x, y, label, onPress) {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 108, 52, 0x339af0, 0.92);
    bg.setStrokeStyle(2, 0xffffff);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(108, 52);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      bg.setFillStyle(0x228be6, 1);
      onPress();
    });

    button.on('pointerup', () => {
      bg.setFillStyle(0x339af0, 0.92);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(0x339af0, 0.92);
    });

    return button;
  }

  createEmojiActionButton(x, y, emoji, onPress) {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 52, 52, 0xf59f00, 0.92);
    bg.setStrokeStyle(2, 0xffffff);
    const text = this.add.text(0, 0, emoji, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(52, 52);
    button.setInteractive({ useHandCursor: true });
    button.bg = bg;
    button.label = text;

    button.on('pointerdown', () => {
      if (button.input?.enabled) {
        bg.setFillStyle(0xe67700, 1);
        onPress();
      }
    });

    button.on('pointerup', () => {
      this.updateLightningButtonState();
    });

    button.on('pointerout', () => {
      this.updateLightningButtonState();
    });

    return button;
  }

  createTouchControls() {
    this.touchInput = {
      left: false,
      right: false,
      up: false,
      down: false,
    };

    this.touchUI = this.add.container(0, 0).setDepth(50);

    const controlCenterY = GAME_HEIGHT - CONTROL_ZONE_HEIGHT / 2;

    this.dpad = this.add.container(GAME_WIDTH - 96, controlCenterY);
    this.dpad.add(this.createTouchButton(0, -36, 50, 50, '↑', () => {
      this.touchInput.up = true;
    }, () => {
      this.touchInput.up = false;
    }));
    this.dpad.add(this.createTouchButton(-52, 14, 50, 50, '←', () => {
      this.touchInput.left = true;
    }, () => {
      this.touchInput.left = false;
    }));
    this.dpad.add(this.createTouchButton(0, 14, 50, 50, '↓', () => {
      this.touchInput.down = true;
    }, () => {
      this.touchInput.down = false;
    }));
    this.dpad.add(this.createTouchButton(52, 14, 50, 50, '→', () => {
      this.touchInput.right = true;
    }, () => {
      this.touchInput.right = false;
    }));
    this.dpad.setVisible(false);

    this.castButton = this.createActionButton(68, controlCenterY, '던지기', () => {
      if (!this.isGameStarted || this.isGameOver || this.isQuizActive || this.isCasting || this.isReeling) return;
      this.cast();
    });

    this.reelButton = this.createActionButton(68, controlCenterY, '감기', () => {
      if (!this.isGameStarted || this.isGameOver || this.isQuizActive) return;
      this.startReel();
    });
    this.reelButton.setVisible(false);

    this.lightningButton = this.createEmojiActionButton(158, controlCenterY, '⚡', () => {
      this.activateLightningFreeze();
    });
    this.lightningButtonBg = this.lightningButton.bg;

    this.touchUI.add([this.dpad, this.castButton, this.reelButton, this.lightningButton]);
  }

  clearLightningCooldownTimer() {
    if (this.lightningCooldownTimer) {
      this.lightningCooldownTimer.remove(false);
      this.lightningCooldownTimer = null;
    }
  }

  startLightningCooldownTimer() {
    this.clearLightningCooldownTimer();
    this.lightningCooldownTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.lightningCooldownLeft -= 1;
        this.updateLightningButtonState();

        if (this.lightningCooldownLeft <= 0) {
          this.lightningCooldownLeft = 0;
          this.clearLightningCooldownTimer();
        }
      },
    });
  }

  updateLightningButtonState() {
    if (!this.lightningButton || !this.lightningButtonBg) return;

    const canUse = this.isGameStarted
      && !this.isGameOver
      && !this.isQuizActive
      && this.lightningCooldownLeft <= 0;

    if (canUse) {
      this.lightningButton.setInteractive({ useHandCursor: true });
    } else {
      this.lightningButton.disableInteractive();
    }

    this.lightningButtonBg.setFillStyle(canUse ? 0xf59f00 : 0x495057, canUse ? 0.92 : 0.72);
    this.lightningButton.setAlpha(canUse ? 1 : 0.55);

    if (this.lightningCooldownLeft > 0) {
      this.lightningButton.label.setText(String(this.lightningCooldownLeft));
      this.lightningButton.label.setFontSize('18px');
    } else {
      this.lightningButton.label.setText('⚡');
      this.lightningButton.label.setFontSize('26px');
    }
  }

  activateLightningFreeze() {
    if (!this.isGameStarted || this.isGameOver || this.isQuizActive) return;
    if (this.lightningCooldownLeft > 0) return;

    this.creatureFreezeRemaining = LIGHTNING_FREEZE_SECONDS;
    this.lightningCooldownLeft = LIGHTNING_COOLDOWN_SECONDS;
    this.startLightningCooldownTimer();
    this.updateLightningButtonState();
    this.showMessage('⚡ 바다 생물이 2초간 멈췄어!', 1200);
    this.showLightningWaterEffect(LIGHTNING_FREEZE_SECONDS);
  }

  clearLightningWaterEffect() {
    if (this.lightningEffectFlicker) {
      this.lightningEffectFlicker.remove(false);
      this.lightningEffectFlicker = null;
    }

    if (this.lightningEffectEndTimer) {
      this.lightningEffectEndTimer.remove(false);
      this.lightningEffectEndTimer = null;
    }

    if (this.lightningEffectContainer) {
      this.lightningEffectContainer.destroy(true);
      this.lightningEffectContainer = null;
    }
  }

  drawLightningBolt(graphics, startX, startY) {
    const segments = Phaser.Math.Between(4, 6);
    const verticalSpan = Phaser.Math.Between(56, 110);
    const horizontalSpread = Phaser.Math.Between(18, 34);
    let x = startX;
    let y = startY;

    graphics.clear();
    graphics.lineStyle(2.5, 0x66d9ef, 0.75);
    graphics.beginPath();
    graphics.moveTo(x, y);

    for (let i = 0; i < segments; i += 1) {
      x += Phaser.Math.Between(-horizontalSpread, horizontalSpread);
      y += verticalSpan / segments;
      graphics.lineTo(x, y);
    }
    graphics.strokePath();

    graphics.lineStyle(1, 0xffffff, 0.55);
    graphics.beginPath();
    graphics.moveTo(startX, startY);
    x = startX;
    y = startY;
    for (let i = 0; i < segments; i += 1) {
      x += Phaser.Math.Between(-horizontalSpread * 0.6, horizontalSpread * 0.6);
      y += verticalSpan / segments;
      graphics.lineTo(x, y);
    }
    graphics.strokePath();
  }

  showLightningWaterEffect(durationSeconds = LIGHTNING_FREEZE_SECONDS) {
    this.clearLightningWaterEffect();

    const waterHeight = SAND_TOP - WATER_TOP;
    const container = this.add.container(0, 0).setDepth(LIGHTNING_EFFECT_DEPTH);

    const veil = this.add.rectangle(
      GAME_WIDTH / 2,
      WATER_TOP + waterHeight / 2,
      GAME_WIDTH,
      waterHeight,
      0x22b8cf,
      0.14,
    );
    veil.setBlendMode(Phaser.BlendModes.ADD);
    container.add(veil);

    this.tweens.add({
      targets: veil,
      alpha: { from: 0.08, to: 0.24 },
      duration: 110,
      yoyo: true,
      repeat: -1,
    });

    const flash = this.add.rectangle(
      GAME_WIDTH / 2,
      WATER_TOP + waterHeight / 2,
      GAME_WIDTH,
      waterHeight,
      0xffffff,
      0.28,
    );
    flash.setBlendMode(Phaser.BlendModes.ADD);
    container.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
    });

    const bolts = [];
    for (let i = 0; i < 7; i += 1) {
      const bolt = this.add.graphics();
      this.drawLightningBolt(
        bolt,
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        Phaser.Math.Between(WATER_TOP + 16, SAND_TOP - 90),
      );
      bolt.setAlpha(Phaser.Math.FloatBetween(0.35, 0.85));
      container.add(bolt);
      bolts.push(bolt);
    }

    for (let i = 0; i < 5; i += 1) {
      const streamY = WATER_TOP + 28 + i * ((waterHeight - 56) / 4);
      const stream = this.add.rectangle(-80, streamY, Phaser.Math.Between(90, 150), 2, 0x99e9f2, 0.45);
      stream.setBlendMode(Phaser.BlendModes.ADD);
      container.add(stream);
      this.tweens.add({
        targets: stream,
        x: GAME_WIDTH + 80,
        alpha: { from: 0.12, to: 0.65 },
        duration: Phaser.Math.Between(260, 420),
        repeat: -1,
        onRepeat: () => {
          stream.x = -80;
          stream.y = streamY + Phaser.Math.Between(-8, 8);
        },
      });
    }

    this.lightningEffectFlicker = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        bolts.forEach((bolt) => {
          bolt.setAlpha(Phaser.Math.FloatBetween(0.15, 0.95));
          if (Math.random() < 0.4) {
            this.drawLightningBolt(
              bolt,
              Phaser.Math.Between(20, GAME_WIDTH - 20),
              Phaser.Math.Between(WATER_TOP + 12, SAND_TOP - 80),
            );
          }
        });
      },
    });

    this.lightningEffectContainer = container;
    this.lightningEffectEndTimer = this.time.delayedCall(durationSeconds * 1000, () => {
      this.clearLightningWaterEffect();
    });
  }

  clearApexTsunamiEffects() {
    if (this.apexTsunamiEndTimer) {
      this.apexTsunamiEndTimer.remove(false);
      this.apexTsunamiEndTimer = null;
    }

    if (this.apexTsunamiAmbientEvent) {
      this.apexTsunamiAmbientEvent.remove(false);
      this.apexTsunamiAmbientEvent = null;
    }

    if (this.apexTsunamiContainer) {
      this.apexTsunamiContainer.destroy(true);
      this.apexTsunamiContainer = null;
    }

    if (this.apexTsunamiAmbientContainer) {
      this.apexTsunamiAmbientContainer.destroy(true);
      this.apexTsunamiAmbientContainer = null;
    }
  }

  drawTsunamiCrest(graphics, width, amplitude) {
    graphics.clear();
    graphics.fillStyle(0xffffff, 0.38);
    graphics.beginPath();
    graphics.moveTo(-40, amplitude * 1.6);
    for (let x = -40; x <= width + 40; x += 22) {
      graphics.lineTo(x, Math.sin(x * 0.05) * amplitude);
    }
    graphics.lineTo(width + 40, amplitude * 3.2);
    graphics.lineTo(-40, amplitude * 3.2);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0xffb3b3, 0.28);
    graphics.beginPath();
    graphics.moveTo(-40, amplitude * 0.4);
    for (let x = -40; x <= width + 40; x += 18) {
      graphics.lineTo(x, Math.sin(x * 0.06 + 1.2) * amplitude * 0.55);
    }
    graphics.lineTo(width + 40, amplitude * 2.2);
    graphics.lineTo(-40, amplitude * 2.2);
    graphics.closePath();
    graphics.fillPath();
  }

  startApexTsunamiAmbient() {
    if (this.apexTsunamiAmbientContainer) return;

    const container = this.add.container(0, 0).setDepth(APEX_TSUNAMI_EFFECT_DEPTH);
    const waveLayers = [];

    for (let i = 0; i < 3; i += 1) {
      const wave = this.add.graphics();
      container.add(wave);
      waveLayers.push(wave);
    }

    let phase = 0;
    this.apexTsunamiAmbientEvent = this.time.addEvent({
      delay: 55,
      loop: true,
      callback: () => {
        phase += 0.1;
        waveLayers.forEach((wave, i) => {
          wave.clear();
          const baseY = WATER_TOP + 6 + i * 12;
          const amp = 5 + i * 2;
          wave.lineStyle(2.5 - i * 0.5, 0xffffff, 0.14 - i * 0.035);
          wave.beginPath();
          wave.moveTo(0, baseY);
          for (let x = 0; x <= GAME_WIDTH; x += 14) {
            wave.lineTo(x, baseY + Math.sin(x * 0.028 + phase + i * 1.4) * amp);
          }
          wave.strokePath();
        });
      },
    });

    this.apexTsunamiAmbientContainer = container;
  }

  showApexTsunamiEffect() {
    this.clearApexTsunamiEffects();

    const waterHeight = SAND_TOP - WATER_TOP;
    const container = this.add.container(0, 0).setDepth(APEX_TSUNAMI_EFFECT_DEPTH);

    const surge = this.add.rectangle(
      GAME_WIDTH / 2,
      WATER_TOP + 24,
      GAME_WIDTH + 40,
      72,
      0x8b1a1a,
      0.45,
    );
    container.add(surge);
    this.tweens.add({
      targets: surge,
      y: WATER_TOP + waterHeight * 0.42,
      alpha: 0,
      scaleY: 5.5,
      duration: 1500,
      ease: 'Quad.easeOut',
    });

    for (let i = 0; i < 4; i += 1) {
      const crest = this.add.graphics();
      this.drawTsunamiCrest(crest, GAME_WIDTH + 80, 28 + i * 6);
      crest.setPosition(-GAME_WIDTH * 0.55 - i * 90, WATER_TOP + 4 + i * 22);
      crest.setAlpha(0.42 - i * 0.06);
      container.add(crest);
      this.tweens.add({
        targets: crest,
        x: GAME_WIDTH * 1.15,
        duration: 850 + i * 130,
        ease: 'Sine.easeIn',
      });
    }

    for (let i = 0; i < 3; i += 1) {
      const crest = this.add.graphics();
      this.drawTsunamiCrest(crest, GAME_WIDTH + 80, 22 + i * 5);
      crest.setScale(-1, 1);
      crest.setPosition(GAME_WIDTH * 1.55 + i * 70, WATER_TOP + 18 + i * 26);
      crest.setAlpha(0.36 - i * 0.05);
      container.add(crest);
      this.tweens.add({
        targets: crest,
        x: -GAME_WIDTH * 0.2,
        duration: 920 + i * 110,
        ease: 'Sine.easeIn',
      });
    }

    for (let i = 0; i < 16; i += 1) {
      const foam = this.add.circle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        WATER_TOP + Phaser.Math.Between(0, 28),
        Phaser.Math.Between(3, 9),
        0xffffff,
        Phaser.Math.FloatBetween(0.35, 0.75),
      );
      foam.setBlendMode(Phaser.BlendModes.ADD);
      container.add(foam);
      this.tweens.add({
        targets: foam,
        y: foam.y + Phaser.Math.Between(40, waterHeight * 0.55),
        x: foam.x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: Phaser.Math.FloatBetween(1.4, 2.2),
        duration: Phaser.Math.Between(700, 1200),
        ease: 'Quad.easeOut',
      });
    }

    this.cameras.main.shake(900, 0.011);

    if (this.fisherman) {
      this.tweens.add({
        targets: this.fisherman,
        x: { from: 0, to: 5 },
        duration: 70,
        yoyo: true,
        repeat: 8,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.fisherman.x = 0;
        },
      });
    }

    this.apexTsunamiContainer = container;
    this.apexTsunamiEndTimer = this.time.delayedCall(1700, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          if (this.apexTsunamiContainer === container) {
            container.destroy(true);
            this.apexTsunamiContainer = null;
          }
          if (this.apexPredatorThreatCount > 0) {
            this.startApexTsunamiAmbient();
          }
        },
      });
      this.apexTsunamiEndTimer = null;
    });
  }

  updateTouchControlsVisibility() {
    if (!this.dpad || !this.castButton || !this.reelButton) return;

    const canPlay = !this.isGameOver && !this.isQuizActive;
    const aiming = this.isCasting && !this.isReeling;

    this.dpad.setVisible(canPlay && aiming);
    this.castButton.setVisible(canPlay && !this.isCasting && !this.isReeling);
    this.reelButton.setVisible(canPlay && aiming);
    this.lightningButton?.setVisible(canPlay && this.isGameStarted);
    this.updateLightningButtonState();
  }

  clearTouchInput() {
    this.touchInput.left = false;
    this.touchInput.right = false;
    this.touchInput.up = false;
    this.touchInput.down = false;
  }

  createBackground() {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x74c0fc, 0x74c0fc, 0xa5d8ff, 0xa5d8ff, 1);
    sky.fillRect(0, 0, GAME_WIDTH, WATER_TOP);

    const water = this.add.graphics();
    this.waterGraphics = water;
    this.waterGraphics.setDepth(0);
    this.paintWaterGradient(WATER_GRADIENT_TOP, WATER_GRADIENT_BOTTOM);

    const sand = this.add.graphics();
    sand.fillGradientStyle(0xfae8b8, 0xfae8b8, 0xe8c878, 0xd4a853, 1);
    sand.fillRect(0, SAND_TOP, GAME_WIDTH, SAND_HEIGHT);
    sand.lineStyle(2, 0xc9952f, 0.55);
    sand.lineBetween(0, SAND_TOP + 1, GAME_WIDTH, SAND_TOP + 1);
    for (let i = 0; i < 48; i += 1) {
      sand.fillStyle(0xc9952f, Phaser.Math.FloatBetween(0.12, 0.35));
      sand.fillCircle(
        Phaser.Math.Between(8, GAME_WIDTH - 8),
        Phaser.Math.Between(SAND_TOP + 6, WATER_BOTTOM - 6),
        Phaser.Math.FloatBetween(1, 3),
      );
    }
    sand.setDepth(SAND_DEPTH);

    for (let i = 0; i < 18; i += 1) {
      const bubble = this.add.circle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(WATER_TOP + 40, SAND_TOP - 24),
        Phaser.Math.Between(2, 6),
        0xffffff,
        0.15,
      );
      bubble.setDepth(1);
      this.tweens.add({
        targets: bubble,
        y: bubble.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          bubble.y = Phaser.Math.Between(WATER_TOP + 40, SAND_TOP - 24);
          bubble.alpha = 0.15;
        },
      });
    }
  }

  createDock() {
    const dock = this.add.graphics();
    dock.fillStyle(0x8b5a2b, 1);
    dock.fillRect(0, WATER_TOP - 18, GAME_WIDTH, 18);
    dock.fillStyle(0x6f4e37, 1);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      dock.fillRect(x, WATER_TOP - 18, 20, 18);
    }
  }

  createFisherman() {
    const x = GAME_WIDTH / 2;
    const y = FISHERMAN_Y;
    const faceDisplayHeight = 26;

    const body = this.add.rectangle(x, y + 16, 20, 28, 0x364fc7);

    let head;
    if (this.textures.exists('fisherman_face')) {
      head = this.add.image(x, y - 2, 'fisherman_face');
      head.setScale(faceDisplayHeight / head.height);
    } else {
      head = this.add.circle(x, y - 2, 11, 0xffd8a8);
    }

    const hat = this.add.triangle(x, y - 12, 0, 10, -14, -6, 14, -6, 0x495057);
    const rod = this.add.line(
      0, 0,
      x + ROD_BASE_OFFSET_X, y + ROD_BASE_Y_OFFSET,
      x + ROD_TIP_OFFSET_X + 40, y + ROD_TIP_Y_OFFSET + 5,
      0x5c4033,
    );
    rod.setLineWidth(3);

    this.fisherman = this.add.container(0, 0, [body, head, hat, rod]);
  }

  createLineAndHook() {
    this.rodTipX = GAME_WIDTH / 2 + ROD_TIP_OFFSET_X;
    this.rodTipY = FISHERMAN_Y + ROD_TIP_Y_OFFSET;

    this.fishingLine = this.add.line(0, 0, this.rodTipX, this.rodTipY, this.rodTipX, this.rodTipY, 0xe9ecef);
    this.fishingLine.setLineWidth(2);
    this.fishingLine.setDepth(HOOK_LINE_DEPTH);

    this.hook = this.add.container(this.rodTipX, this.rodTipY);
    this.hook.setDepth(HOOK_LINE_DEPTH + 1);
    const hookShape = this.add.graphics();
    hookShape.lineStyle(3, 0xc0c0c0);
    hookShape.beginPath();
    hookShape.arc(0, 8, 8, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
    hookShape.strokePath();
    hookShape.fillStyle(0xffd43b, 1);
    hookShape.fillCircle(0, 0, 4);
    this.hook.add(hookShape);

    this.physics.add.existing(this.hook);
    this.hook.body.setSize(16, 20);
    this.hook.body.setAllowGravity(false);
  }

  createUI() {
    this.scoreText = this.add.text(12, 10, '점수: 0', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });

    this.timerText = this.add.text(0, 10, `시간: ${GAME_DURATION}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });

    this.layoutHudTexts();

    this.messageText = this.add.text(GAME_WIDTH / 2, 52, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#fff3bf',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);

    this.helpText = this.add.text(GAME_WIDTH / 2, WATER_BOTTOM - 8, '왼쪽: 던지기·감기  |  오른쪽: 방향', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1);
  }

  layoutHudTexts() {
    this.timerText.setX(this.scoreText.x + this.scoreText.width + 20);
    this.timerText.setY(this.scoreText.y);
  }

  createFishGroup() {
    this.fishes = this.add.group();

    if (TEST_FIRST_CREATURE) {
      this.spawnCreatureOfKind(TEST_FIRST_CREATURE);
    }

    const initialCount = TEST_FIRST_CREATURE ? 3 : 4;
    for (let i = 0; i < initialCount; i += 1) {
      this.spawnCreature();
    }

    this.time.addEvent({
      delay: 1200,
      callback: this.spawnCreature,
      callbackScope: this,
      loop: true,
    });
  }

  spawnCreatureOfKind(kind) {
    const type = CREATURES.find((creature) => creature.kind === kind);
    if (!type) return;
    this.spawnCreature(type);
  }

  pickCreature() {
    const totalWeight = CREATURES.reduce((sum, creature) => sum + creature.weight, 0);
    let roll = Phaser.Math.Between(1, totalWeight);

    for (const creature of CREATURES) {
      roll -= creature.weight;
      if (roll <= 0) {
        return maybeCreateGoldVariant(creature);
      }
    }

    return maybeCreateGoldVariant(CREATURES[0]);
  }

  getSpawnY(type) {
    if (isSandCrawler(type)) {
      return getSandCrawlerY(type);
    }

    const floor = getWaterFloorY(type);

    if (type.spawnZone === 'bottom') {
      return Phaser.Math.Between(floor - 36, floor - 6);
    }
    if (type.spawnZone === 'surface') {
      return Phaser.Math.Between(WATER_TOP + 55, WATER_TOP + 130);
    }
    if (type.spawnZone === 'deep') {
      return Phaser.Math.Between(floor - 72, floor - 8);
    }
    if (type.spawnZone === 'large') {
      return Phaser.Math.Between(WATER_TOP + 90, floor - 24);
    }
    if (type.spawnZone === 'mid') {
      return Phaser.Math.Between(WATER_TOP + 70, floor - 16);
    }

    if (type.kind === 'starfish') {
      return Phaser.Math.Between(floor - 28, floor - 6);
    }
    if (type.kind === 'jellyfish') {
      return Phaser.Math.Between(WATER_TOP + 60, floor - 20);
    }
    if (type.kind === 'squid') {
      return Phaser.Math.Between(WATER_TOP + 70, floor - 16);
    }
    if (type.kind === 'shark') {
      return Phaser.Math.Between(WATER_TOP + 80, floor - 20);
    }
    if (type.kind === 'turtle') {
      return Phaser.Math.Between(WATER_TOP + 90, floor - 10);
    }
    if (type.kind === 'eel') {
      return Phaser.Math.Between(floor - 48, floor - 6);
    }

    return Phaser.Math.Between(WATER_TOP + 50, floor);
  }

  clampWaterCreatureY(fish) {
    if (isSandCrawler(fish.creatureType)) return;
    if (fish.creatureType.moveStyle === 'bottomJump') return;
    if (fish.creatureType.kind === 'flyingfish') return;

    const floor = getWaterFloorY(fish.creatureType);
    if (fish.y > floor) {
      fish.y = floor;
      if (fish.vy > 0) fish.vy = 0;
    }
  }

  applyBottomJumpMotion(fish, dt, bobTime) {
    const type = fish.creatureType;
    const groundY = getWaterFloorY(type);
    const ceilingY = WATER_TOP + 48;

    fish.jumpCooldown = (fish.jumpCooldown ?? 0) - dt;

    if (fish.y >= groundY) {
      fish.y = groundY;
      if (fish.vy > 0) fish.vy = 0;

      if (fish.jumpCooldown <= 0) {
        fish.vy = -type.speed * (type.jumpPower ?? 0.9);
        fish.jumpCooldown = type.jumpInterval ?? 0.55;
      }

      fish.angle = Phaser.Math.Linear(fish.angle ?? 0, 0, dt * 12);
    } else {
      fish.vy += (type.gravity ?? 480) * dt;
      const jumpTilt = -24 * Math.sign(fish.vx || 1);
      fish.angle = Phaser.Math.Linear(fish.angle ?? 0, jumpTilt, dt * 14);
    }

    if (fish.y < ceilingY) {
      fish.y = ceilingY;
      if (fish.vy < 0) fish.vy = 0;
    }

    if (fish.usesTexture) {
      const sprite = this.getCreatureSprite(fish);
      const facesLeft = type.textureFacing === 'left';
      sprite.setFlipX(facesLeft ? fish.vx > 0 : fish.vx < 0);
    }
  }

  createCreatureEntity(x, y, type, direction) {
    const textureKey = getTextureKeyForCreature(type);

    if (textureKey && this.textures.exists(textureKey)) {
      const sprite = this.add.image(0, 0, textureKey);
      const textureScale = type.textureScale ?? 1;
      const scale = (type.size / Math.max(sprite.width, sprite.height)) * textureScale;
      sprite.setScale(scale);
      const facesLeft = type.textureFacing === 'left';
      const flipX = facesLeft ? direction > 0 : direction < 0;

      if (type.isGoldVariant) {
        sprite.setTint(0xffd43b);
      } else if (type.useRandomTint && type.tintColors?.length) {
        const tintColor = type.tintColors[Phaser.Math.Between(0, type.tintColors.length - 1)];
        sprite.setTint(tintColor);
      } else if (type.useTint && type.color) {
        sprite.setTint(type.color);
      }

      if (type.electricEffect) {
        const container = this.add.container(x, y);
        const aura = this.add.graphics();
        aura.setBlendMode(Phaser.BlendModes.ADD);
        this.drawElectricCreatureAura(aura, sprite.displayWidth, sprite.displayHeight, 0);
        sprite.setFlipX(flipX);
        if (flipX) {
          aura.setScale(-1, 1);
        }
        container.add([aura, sprite]);
        container.creatureSprite = sprite;
        container.electricAura = aura;
        container.electricPhase = Math.random() * Math.PI * 2;
        container.baseScale = scale;
        container.usesTexture = true;
        if (type.isGoldVariant) {
          this.attachGoldSparkles(container, sprite.displayWidth, sprite.displayHeight);
        }
        return container;
      }

      sprite.setPosition(x, y);
      sprite.setFlipX(type.kind === 'flyingfish' ? false : flipX);
      sprite.baseScale = scale;
      sprite.usesTexture = true;
      if (type.isGoldVariant) {
        return this.wrapGoldVariant(sprite, x, y, scale, true);
      }
      return sprite;
    }

    const graphics = this.add.graphics({ x, y });
    this.drawCreature(graphics, type, direction);
    graphics.baseScale = 1;
    graphics.usesTexture = false;
    if (type.isGoldVariant) {
      return this.wrapGoldVariant(graphics, x, y, 1, false);
    }
    return graphics;
  }

  attachGoldSparkles(entity, bodyWidth, bodyHeight) {
    const sparkles = this.add.graphics();
    sparkles.setBlendMode(Phaser.BlendModes.ADD);
    entity.add(sparkles);
    entity.goldSparkles = sparkles;
    this.drawGoldSparkles(sparkles, bodyWidth, bodyHeight, 0);
  }

  wrapGoldVariant(entity, x, y, baseScale, usesTexture) {
    const wrapper = this.add.container(x, y);
    entity.setPosition(0, 0);
    wrapper.add(entity);

    const sprite = entity.creatureSprite ?? (usesTexture ? entity : null);
    const bodyWidth = sprite?.displayWidth ?? entity.displayWidth ?? 48;
    const bodyHeight = sprite?.displayHeight ?? entity.displayHeight ?? 32;
    this.attachGoldSparkles(wrapper, bodyWidth, bodyHeight);

    wrapper.creatureSprite = sprite ?? entity;
    wrapper.baseScale = entity.baseScale ?? baseScale;
    wrapper.usesTexture = entity.usesTexture ?? usesTexture;
    wrapper.electricAura = entity.electricAura;
    wrapper.electricPhase = entity.electricPhase;
    return wrapper;
  }

  drawGoldSparkles(graphics, bodyWidth, bodyHeight, phase) {
    graphics.clear();
    const pulse = 0.35 + Math.sin(phase * 5) * 0.25;

    graphics.lineStyle(3, 0xffd43b, pulse);
    graphics.strokeEllipse(0, 0, bodyWidth * 1.1, bodyHeight * 0.95);
    graphics.lineStyle(2, 0xfff3bf, pulse * 0.85);
    graphics.strokeEllipse(0, 0, bodyWidth * 1.04, bodyHeight * 0.88);

    for (let i = 0; i < 6; i += 1) {
      const angle = phase * 2.2 + (Math.PI * 2 * i) / 6;
      const sx = Math.cos(angle) * bodyWidth * 0.54;
      const sy = Math.sin(angle) * bodyHeight * 0.4;
      graphics.fillStyle(0xffffff, pulse * 0.75);
      graphics.fillCircle(sx, sy, 2 + Math.sin(phase * 3 + i) * 1.2);
    }
  }

  updateGoldVariantVisuals(fish, bobTime) {
    const type = fish.creatureType;
    if (!type?.isGoldVariant) return;

    const phase = bobTime + fish.bobOffset;
    const pulse = 0.5 + Math.sin(phase * 8) * 0.5;
    const sprite = fish.usesTexture ? this.getCreatureSprite(fish) : fish;
    const bodyWidth = sprite.displayWidth ?? type.size;
    const bodyHeight = sprite.displayHeight ?? type.size * 0.5;

    if (fish.usesTexture && sprite.setTint) {
      sprite.setTint(Phaser.Display.Color.GetColor(255, Math.round(210 + 45 * pulse), Math.round(80 + 110 * pulse)));
    }

    fish.alpha = 0.9 + Math.sin(phase * 12) * 0.1;

    if (fish.goldSparkles) {
      this.drawGoldSparkles(fish.goldSparkles, bodyWidth, bodyHeight, phase);
      if (fish.vx !== undefined && fish.usesTexture) {
        const facesLeft = type.textureFacing === 'left';
        const flipX = facesLeft ? fish.vx > 0 : fish.vx < 0;
        fish.goldSparkles.setScale(flipX ? -1 : 1, 1);
      }
    }
  }

  drawMiniElectricBolt(graphics, startX, startY, height) {
    const segments = 4;
    let x = startX;
    let y = startY;
    graphics.beginPath();
    graphics.moveTo(x, y);
    for (let i = 0; i < segments; i += 1) {
      x += Phaser.Math.Between(-5, 5);
      y += height / segments;
      graphics.lineTo(x, y);
    }
    graphics.strokePath();
  }

  drawElectricCreatureAura(graphics, bodyWidth, bodyHeight, phase) {
    graphics.clear();
    const pulse = 0.45 + Math.sin(phase * 4) * 0.25;

    graphics.lineStyle(3, 0x74c0fc, pulse * 0.35);
    graphics.strokeEllipse(0, 0, bodyWidth * 1.04, bodyHeight * 0.66);

    const arcCount = 6;
    for (let i = 0; i < arcCount; i += 1) {
      const t = i / (arcCount - 1);
      const cx = (t - 0.5) * bodyWidth * 0.88;
      const cy = Math.sin(phase * 3 + i * 1.4) * bodyHeight * 0.24;
      const boltHeight = bodyHeight * (0.35 + Math.sin(phase * 5 + i) * 0.08);

      graphics.lineStyle(2, 0x66d9ef, pulse * 0.85);
      this.drawMiniElectricBolt(graphics, cx, cy - boltHeight * 0.45, boltHeight);

      if (i % 2 === 0) {
        graphics.lineStyle(1.2, 0xffffff, pulse * 0.55);
        graphics.beginPath();
        graphics.moveTo(cx - bodyWidth * 0.1, cy);
        let x = cx - bodyWidth * 0.1;
        for (let s = 0; s < 5; s += 1) {
          x += bodyWidth * 0.045;
          graphics.lineTo(x, cy + Math.sin(phase * 6 + s + i) * bodyHeight * 0.16);
        }
        graphics.strokePath();
      }
    }

    graphics.lineStyle(1.5, 0xffd43b, pulse * 0.6);
    for (let i = 0; i < 4; i += 1) {
      const sparkX = Math.sin(phase * 2.2 + i * 1.8) * bodyWidth * 0.34;
      const sparkY = Math.cos(phase * 2.8 + i * 1.3) * bodyHeight * 0.2;
      graphics.strokeCircle(sparkX, sparkY, bodyHeight * 0.07 + Math.sin(phase + i) * 2);
    }
  }

  getCreatureSprite(creature) {
    return creature.creatureSprite ?? creature;
  }

  updateCreatureFacing(creature, direction) {
    if (!creature.usesTexture) return;

    const type = creature.creatureType;
    const sprite = this.getCreatureSprite(creature);
    const facesLeft = type.textureFacing === 'left';
    const flipX = facesLeft ? direction > 0 : direction < 0;

    if (type.electricEffect && creature.electricAura) {
      sprite.setFlipX(flipX);
      creature.electricAura.setScale(flipX ? -1 : 1, 1);
      return;
    }

    sprite.setFlipX(facesLeft ? direction > 0 : direction < 0);

    if (type.isGoldVariant && creature.goldSparkles) {
      creature.goldSparkles.setScale(flipX ? -1 : 1, 1);
    }
  }

  applyHookFleeBehavior(fish) {
    const type = fish.creatureType;
    if (!type.fleeFromHook) return;

    if (!this.isCasting || this.isReeling) {
      if (fish.fleeingFromHook && fish.baseVx != null) {
        fish.vx = fish.baseVx;
        fish.fleeingFromHook = false;
        this.updateCreatureFacing(fish, Math.sign(fish.baseVx) || 1);
      }
      return;
    }

    const fleeRadius = type.fleeRadius ?? type.size * 2.5;
    const dist = Phaser.Math.Distance.Between(this.hook.x, this.hook.y, fish.x, fish.y);

    if (dist < fleeRadius) {
      const fleeDirection = fish.x >= this.hook.x ? 1 : -1;
      const fleeSpeed = type.speed * (type.fleeSpeedMultiplier ?? 1.6);
      fish.vx = fleeDirection * fleeSpeed;
      fish.fleeingFromHook = true;
      this.updateCreatureFacing(fish, fleeDirection);
      return;
    }

    if (fish.fleeingFromHook && fish.baseVx != null) {
      fish.vx = fish.baseVx;
      fish.fleeingFromHook = false;
      this.updateCreatureFacing(fish, Math.sign(fish.baseVx) || 1);
    }
  }

  applyCreatureSpawnMotion(creature, type, vx, vy) {
    if (type.kind === 'flyingfish') {
      creature.setAngle(getFlyingfishAngle(vx, vy));
      return;
    }

    if (type.moveStyle === 'diagonal' || type.moveStyle === 'zigzag') {
      const angleMultiplier = type.kind === 'dolphin' ? 0.75 : type.moveStyle === 'zigzag' ? 0.4 : 1;
      const angle = Phaser.Math.RadToDeg(Math.atan2(vy, vx)) * angleMultiplier;
      creature.setAngle(angle);
    }
  }

  drawCreature(graphics, type, direction) {
    const s = type.size;
    const creatureColor = type.isGoldVariant ? 0xffd43b : type.color;

    switch (type.kind) {
      case 'fish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillTriangle(
          -direction * s * 0.55, 0,
          -direction * s * 0.95, -8,
          -direction * s * 0.95, 8
        );
        graphics.fillEllipse(0, 0, s, s * 0.55);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.25, -4, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.25 + direction * 2, -4, 1.5);
        break;

      case 'jellyfish':
        graphics.fillStyle(creatureColor, 0.55);
        graphics.fillEllipse(0, -6, s * 0.9, s * 0.45);
        graphics.lineStyle(2, creatureColor, 0.7);
        for (let i = -2; i <= 2; i += 1) {
          graphics.lineBetween(i * 5, 2, i * 4, s * 0.55);
        }
        graphics.fillStyle(0xffffff, 0.35);
        graphics.fillCircle(-6, -10, 4);
        break;

      case 'lantern_anglerfish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 4, s * 0.72, s * 0.46);
        graphics.fillStyle(0xff8787, 1);
        graphics.fillEllipse(direction * s * 0.18, 8, s * 0.22, s * 0.14);
        graphics.fillStyle(0xffffff, 1);
        for (let i = -2; i <= 2; i += 1) {
          graphics.fillTriangle(
            direction * s * 0.08 + i * 4, 2,
            direction * s * 0.04 + i * 4, 10,
            direction * s * 0.12 + i * 4, 10,
          );
        }
        graphics.lineStyle(2, 0x343a40, 1);
        graphics.lineBetween(-direction * s * 0.12, -s * 0.12, -direction * s * 0.24, -s * 0.24);
        graphics.fillStyle(0xffd43b, 1);
        graphics.fillCircle(-direction * s * 0.26, -s * 0.26, s * 0.09);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.28, -2, 4);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.29, -2, 2);
        break;

      case 'octopus':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillCircle(0, -4, s * 0.38);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 8, -8, 4);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 9, -8, 2);
        for (let i = -3; i <= 3; i += 1) {
          graphics.lineStyle(3, creatureColor, 1);
          graphics.lineBetween(i * 5, 6, i * 7, s * 0.45);
        }
        break;

      case 'seahorse':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 4, 0, s * 0.35, s * 0.7);
        graphics.fillEllipse(-direction * 6, -s * 0.35, s * 0.22, s * 0.22);
        graphics.lineStyle(3, creatureColor, 1);
        graphics.lineBetween(-direction * 2, s * 0.25, -direction * 10, s * 0.45);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(-direction * 7, -s * 0.35, 2.5);
        break;

      case 'turtle':
        graphics.fillStyle(0x2b8a3e, 1);
        graphics.fillEllipse(-direction * s * 0.42, 2, 10, 6);
        graphics.fillEllipse(direction * s * 0.42, 2, 10, 6);
        graphics.fillStyle(0x2f9e44, 1);
        graphics.fillEllipse(0, 0, s * 0.95, s * 0.72);
        graphics.lineStyle(2, 0x087f5b, 0.8);
        graphics.strokeEllipse(0, 0, s * 0.55, s * 0.4);
        graphics.lineBetween(-s * 0.15, -s * 0.15, s * 0.15, s * 0.15);
        graphics.lineBetween(-s * 0.15, s * 0.15, s * 0.15, -s * 0.15);
        graphics.fillStyle(creatureColor, 1);
        graphics.fillCircle(direction * s * 0.38, -2, s * 0.24);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.44, -4, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.45, -4, 1.5);
        break;

      case 'crab':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 2, s * 0.75, s * 0.45);
        graphics.fillCircle(-s * 0.42, -2, 7);
        graphics.fillCircle(s * 0.42, -2, 7);
        graphics.lineStyle(3, creatureColor, 1);
        for (let i = -1; i <= 1; i += 2) {
          graphics.lineBetween(i * s * 0.35, 6, i * s * 0.55, 14);
          graphics.lineBetween(i * s * 0.35, 6, i * s * 0.15, 14);
        }
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 6, -2, 2);
        break;

      case 'crayfish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(-direction * s * 0.28, 0, s * 0.24, s * 0.2);
        graphics.fillEllipse(0, 4, s * 0.58, s * 0.3);
        graphics.fillEllipse(-direction * s * 0.44, -10, s * 0.3, s * 0.11);
        graphics.fillEllipse(-direction * s * 0.44, 10, s * 0.3, s * 0.11);
        graphics.fillEllipse(direction * s * 0.34, 6, s * 0.18, s * 0.13);
        graphics.fillEllipse(direction * s * 0.48, 8, s * 0.14, s * 0.11);
        graphics.lineStyle(2, 0x7c0000, 1);
        for (let i = -2; i <= 2; i += 1) {
          graphics.lineBetween(i * 5, 8, i * 7, 16);
        }
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(-direction * s * 0.34, -2, 2);
        break;

      case 'dolphin':
      case 'beluga':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.88, s * 0.34);
        if (type.kind === 'dolphin') {
          graphics.fillTriangle(
            direction * s * 0.08, -s * 0.12,
            direction * s * 0.22, -s * 0.34,
            direction * s * 0.28, -s * 0.04
          );
        } else {
          graphics.fillEllipse(-direction * s * 0.05, -s * 0.12, s * 0.42, s * 0.28);
        }
        graphics.fillEllipse(direction * s * 0.44, 2, s * 0.24, s * 0.13);
        graphics.fillStyle(0xe7f5ff, 0.85);
        graphics.fillEllipse(-direction * s * 0.05, 5, s * 0.52, s * 0.12);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.16, -4, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.17, -4, 1.5);
        break;

      case 'flyingfish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.58, s * 0.2);
        graphics.fillTriangle(
          -direction * s * 0.18, -1,
          -direction * s * 0.58, -s * 0.38,
          -direction * s * 0.12, -3
        );
        graphics.fillTriangle(
          -direction * s * 0.18, 1,
          -direction * s * 0.58, s * 0.38,
          -direction * s * 0.12, 3
        );
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.2, -2, 2);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.21, -2, 1);
        break;

      case 'starfish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillPoints([
          { x: 0, y: -s * 0.45 },
          { x: s * 0.14, y: -s * 0.14 },
          { x: s * 0.45, y: -s * 0.08 },
          { x: s * 0.22, y: s * 0.12 },
          { x: s * 0.28, y: s * 0.45 },
          { x: 0, y: s * 0.24 },
          { x: -s * 0.28, y: s * 0.45 },
          { x: -s * 0.22, y: s * 0.12 },
          { x: -s * 0.45, y: -s * 0.08 },
          { x: -s * 0.14, y: -s * 0.14 },
        ], true);
        break;

      case 'shrimp':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 6, 0, s * 0.55, s * 0.28);
        graphics.fillEllipse(-direction * 4, -2, s * 0.35, s * 0.22);
        graphics.lineStyle(2, creatureColor, 1);
        graphics.lineBetween(-direction * 10, -4, -direction * 14, -10);
        graphics.lineBetween(-direction * 10, 4, -direction * 14, 10);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 10, -2, 1.5);
        break;

      case 'ray':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 4, s, s * 0.55);
        graphics.fillTriangle(
          -direction * s * 0.45, 4,
          -direction * s * 0.75, s * 0.35,
          -direction * s * 0.15, s * 0.35
        );
        graphics.lineStyle(3, creatureColor, 1);
        graphics.lineBetween(0, s * 0.2, direction * s * 0.35, s * 0.55);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 12, -2, 3);
        break;

      case 'shark':
        graphics.fillStyle(0xdde2e8, 1);
        graphics.fillEllipse(-direction * 2, 4, s * 0.55, s * 0.32);
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 4, 0, s * 0.95, s * 0.42);
        graphics.fillTriangle(
          -direction * s * 0.55, 0,
          -direction * s * 0.95, -14,
          -direction * s * 0.95, 14
        );
        graphics.fillStyle(0x343a40, 1);
        graphics.fillTriangle(direction * 8, -s * 0.28, direction * 18, -s * 0.55, direction * 22, -s * 0.18);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.32, -6, 4);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.34, -6, 2);
        graphics.lineStyle(2, 0xffffff, 0.8);
        for (let i = -2; i <= 1; i += 1) {
          graphics.lineBetween(direction * (8 + i * 4), 6, direction * (10 + i * 4), 12);
        }
        break;

      case 'electric_eel':
      case 'eel':
        graphics.lineStyle(s * 0.16, creatureColor, 1);
        graphics.beginPath();
        graphics.moveTo(-direction * s * 0.48, 0);
        for (let i = 1; i <= 8; i += 1) {
          const t = i / 8;
          graphics.lineTo(
            direction * s * (0.48 - t * 0.96),
            Math.sin(t * Math.PI * 1.6) * s * 0.14
          );
        }
        graphics.strokePath();
        graphics.fillStyle(0x495057, 1);
        graphics.fillCircle(direction * s * 0.46, 0, s * 0.13);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.5, -2, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.51, -2, 1.5);
        graphics.fillStyle(0x868e96, 0.8);
        graphics.fillCircle(-direction * s * 0.42, Math.sin(0.5 * Math.PI * 1.6) * s * 0.14, s * 0.06);
        if (type.kind === 'electric_eel') {
          graphics.lineStyle(2, 0x66d9ef, 0.85);
          for (let i = 0; i < 5; i += 1) {
            const cx = (i / 4 - 0.5) * s * 0.85;
            this.drawMiniElectricBolt(graphics, cx, -s * 0.08, s * 0.18);
          }
          graphics.lineStyle(1.5, 0xffd43b, 0.65);
          graphics.strokeCircle(0, 0, s * 0.22);
        }
        break;

      case 'squid':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * s * 0.05, -2, s * 0.62, s * 0.38);
        graphics.fillStyle(0xffdeeb, 1);
        graphics.fillEllipse(direction * s * 0.12, -4, s * 0.35, s * 0.22);
        graphics.fillTriangle(
          -direction * s * 0.18, -s * 0.08,
          -direction * s * 0.48, -s * 0.28,
          -direction * s * 0.12, s * 0.08
        );
        graphics.fillTriangle(
          direction * s * 0.18, -s * 0.08,
          direction * s * 0.48, -s * 0.28,
          direction * s * 0.12, s * 0.08
        );
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.24, -6, 5);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.26, -6, 2.5);
        graphics.lineStyle(2, 0xffdeeb, 1);
        for (let i = -3; i <= 3; i += 1) {
          graphics.lineBetween(i * 4, s * 0.16, i * 6, s * 0.58);
        }
        break;

      case 'wobbegong':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.9, s * 0.38);
        for (let i = -2; i <= 2; i += 1) {
          graphics.fillStyle(0x5d4037, 0.7);
          graphics.fillCircle(i * 10 - 8, (i % 2) * 4, 5);
        }
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.28, -4, 3);
        break;

      case 'makoshark':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 6, 0, s * 0.7, s * 0.34);
        graphics.fillTriangle(-direction * s * 0.55, 0, -direction * s * 0.9, -10, -direction * s * 0.9, 10);
        break;

      case 'sawshark':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 6, 0, s * 0.7, s * 0.34);
        graphics.lineStyle(2, 0xffffff, 0.9);
        for (let i = -4; i <= 4; i += 1) {
          graphics.lineBetween(-direction * s * 0.2 + i * 3, -8, -direction * s * 0.55, i * 2);
        }
        graphics.fillTriangle(-direction * s * 0.55, 0, -direction * s * 0.9, -10, -direction * s * 0.9, 10);
        break;

      case 'hammerhead':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillRect(-direction * s * 0.15, -s * 0.18, direction * s * 0.55, s * 0.36);
        graphics.fillEllipse(direction * 8, 0, s * 0.72, s * 0.28);
        graphics.fillTriangle(-direction * s * 0.5, 0, -direction * s * 0.85, -12, -direction * s * 0.85, 12);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.05, -4, 3);
        graphics.fillCircle(direction * s * 0.22, -4, 3);
        break;

      case 'orca':
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(0, 4, s * 0.55, s * 0.22);
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.34);
        graphics.fillEllipse(direction * s * 0.38, -2, s * 0.22, s * 0.16);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(direction * s * 0.12, -6, s * 0.18, s * 0.1);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.34, -4, 2);
        break;

      case 'manta':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s, s * 0.62);
        graphics.fillStyle(0x78909c, 1);
        graphics.fillEllipse(0, 6, s * 0.35, s * 0.22);
        graphics.lineStyle(3, creatureColor, 1);
        graphics.lineBetween(-s * 0.15, s * 0.15, 0, s * 0.45);
        graphics.lineBetween(s * 0.15, s * 0.15, 0, s * 0.45);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 14, -4, 3);
        break;

      case 'giantsquid':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 4, -4, s * 0.72, s * 0.42);
        graphics.fillStyle(0xffdeeb, 1);
        graphics.fillCircle(direction * s * 0.28, -8, 7);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.3, -8, 3);
        graphics.lineStyle(2, 0xce93d8, 1);
        for (let i = -4; i <= 4; i += 1) {
          graphics.lineBetween(i * 5, s * 0.12, i * 8, s * 0.72);
        }
        break;

      case 'megalodon':
      case 'mosasaurus':
        graphics.fillStyle(0xb0bec5, 1);
        graphics.fillEllipse(-direction * 4, 6, s * 0.62, s * 0.34);
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 6, 0, s, s * 0.4);
        graphics.fillTriangle(-direction * s * 0.58, 0, -direction * s * 0.98, -18, -direction * s * 0.98, 18);
        graphics.fillStyle(0x263238, 1);
        graphics.fillTriangle(direction * 10, -s * 0.3, direction * 24, -s * 0.62, direction * 28, -s * 0.2);
        graphics.lineStyle(2, 0xffffff, 0.85);
        for (let i = -3; i <= 2; i += 1) {
          graphics.lineBetween(direction * (10 + i * 5), 8, direction * (12 + i * 5), 16);
        }
        graphics.fillStyle(0xff1744, 1);
        graphics.fillCircle(direction * s * 0.34, -6, 4);
        break;

      case 'seal':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.75, s * 0.34);
        graphics.fillCircle(-direction * s * 0.35, -2, s * 0.2);
        graphics.fillStyle(0x868e96, 1);
        graphics.fillEllipse(-direction * s * 0.08, 6, s * 0.45, s * 0.12);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.18, -4, 2);
        break;

      case 'leopard_seal':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.78, s * 0.32);
        graphics.fillCircle(-direction * s * 0.34, -2, s * 0.2);
        for (let i = -2; i <= 2; i += 1) {
          graphics.fillStyle(0x495057, 0.8);
          graphics.fillCircle(i * 8 - 4, (i % 2) * 3, 4);
        }
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.18, -4, 2);
        break;

      case 'dunkleosteus':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.38);
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(-direction * s * 0.42, -s * 0.12, direction * s * 0.28, s * 0.24);
        graphics.lineStyle(3, 0x8d6e63, 1);
        graphics.lineBetween(-direction * s * 0.15, -s * 0.18, direction * s * 0.2, s * 0.18);
        graphics.fillStyle(0xffeb3b, 1);
        graphics.fillCircle(direction * s * 0.22, -4, 3);
        break;

      case 'horseshoe_crab':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 2, s * 0.72, s * 0.48);
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillCircle(0, -s * 0.08, s * 0.22);
        for (let i = -2; i <= 2; i += 1) {
          graphics.lineStyle(2, 0x5d4037, 1);
          graphics.lineBetween(i * 6, s * 0.18, i * 8, s * 0.34);
        }
        break;

      case 'pufferfish':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillCircle(0, 0, s * 0.32);
        graphics.lineStyle(2, 0xf59f00, 1);
        for (let i = 0; i < 8; i += 1) {
          const a = (Math.PI * 2 * i) / 8;
          graphics.lineBetween(Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18, Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3);
        }
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 8, -3, 2);
        graphics.fillCircle(-direction * 4, 4, 2);
        break;

      case 'carp_king':
        graphics.fillStyle(0xffd43b, 1);
        graphics.fillTriangle(-4, -s * 0.22, 4, -s * 0.32, 0, -s * 0.12);
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.48);
        graphics.fillStyle(0xffec99, 1);
        graphics.fillEllipse(-s * 0.1, -s * 0.1, s * 0.2, s * 0.12);
        graphics.fillTriangle(-direction * s * 0.52, 0, -direction * s * 0.88, -10, -direction * s * 0.88, 10);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.24, -4, 3);
        break;

      case 'crocodile':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.28);
        graphics.fillEllipse(direction * s * 0.42, -2, s * 0.28, s * 0.14);
        graphics.lineStyle(2, creatureColor, 1);
        for (let i = -2; i <= 3; i += 1) {
          graphics.lineBetween(direction * (10 + i * 6), 4, direction * (14 + i * 6), 10);
        }
        graphics.fillStyle(0xff6b6b, 1);
        graphics.fillCircle(direction * s * 0.44, -4, 2);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.38, -2, 2);
        break;

      case 'pistol_shrimp':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(direction * 4, 0, s * 0.5, s * 0.22);
        graphics.fillEllipse(-direction * 6, -2, s * 0.28, s * 0.16);
        graphics.fillStyle(0xffd43b, 1);
        graphics.fillCircle(-direction * 12, 0, 4);
        graphics.lineStyle(2, creatureColor, 1);
        graphics.lineBetween(-direction * 8, 4, -direction * 14, 8);
        break;

      case 'mantis_shrimp':
        graphics.fillStyle(0x51cf66, 1);
        graphics.fillEllipse(0, 0, s * 0.72, s * 0.28);
        graphics.fillStyle(0xff6b6b, 1);
        graphics.fillEllipse(direction * s * 0.28, -2, s * 0.18, s * 0.14);
        graphics.fillStyle(0x339af0, 1);
        graphics.fillCircle(-direction * s * 0.18, -s * 0.08, s * 0.07);
        graphics.fillCircle(direction * s * 0.18, -s * 0.08, s * 0.07);
        graphics.lineStyle(2, 0xff922b, 1);
        graphics.lineBetween(-direction * s * 0.34, -s * 0.04, -direction * s * 0.48, -s * 0.12);
        graphics.lineBetween(-direction * s * 0.34, s * 0.04, -direction * s * 0.48, s * 0.12);
        break;

      case 'whale_shark':
        graphics.fillStyle(creatureColor, 1);
        graphics.fillEllipse(0, 0, s, s * 0.38);
        graphics.fillStyle(0xffffff, 1);
        for (let i = -3; i <= 2; i += 1) {
          graphics.fillCircle(i * 14 - 10, (i % 2) * 3, 4);
        }
        graphics.fillTriangle(-direction * s * 0.52, 0, -direction * s * 0.88, -14, -direction * s * 0.88, 14);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.28, -4, 3);
        break;

      default:
        graphics.fillStyle(creatureColor, 1);
        graphics.fillCircle(0, 0, s * 0.4);
        break;
    }
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.keySpace.on('down', () => {
      if (!this.isGameStarted || this.isGameOver || this.isQuizActive) return;
      if (!this.isCasting && !this.isReeling) this.cast();
    });

    this.keyR.on('down', () => {
      if (!this.isGameStarted || this.isGameOver || this.isQuizActive) return;
      if (this.isCasting && !this.isReeling) this.startReel();
    });

    this.updateTouchControlsVisibility();
  }

  setupAudio() {
    this.bgmStarted = false;
    this.bgm = this.sound.add(GAME_AUDIO.bgm.key, {
      loop: GAME_AUDIO.bgm.loop,
      volume: GAME_AUDIO.bgm.volume,
    });
    this.castSound = this.sound.add(GAME_AUDIO.cast.key, {
      volume: GAME_AUDIO.cast.volume,
    });
    this.catchSound = this.sound.add(GAME_AUDIO.catch.key, {
      volume: GAME_AUDIO.catch.volume,
    });
    this.quizCorrectSound = this.sound.add(GAME_AUDIO.quizCorrect.key, {
      volume: GAME_AUDIO.quizCorrect.volume,
    });
    this.quizWrongSound = this.sound.add(GAME_AUDIO.quizWrong.key, {
      volume: GAME_AUDIO.quizWrong.volume,
    });
    this.apexSpawnSound = this.sound.add(GAME_AUDIO.apexSpawn.key, {
      volume: GAME_AUDIO.apexSpawn.volume,
    });

    this.onAudioUnlocked = () => {
      if (this.isGameStarted) {
        this.startBgm();
      }
    };

    this.sound.on('unlocked', this.onAudioUnlocked);
  }

  startBgm() {
    if (this.bgmStarted || this.isGameOver || !this.bgm) return;

    if (this.sound.locked) {
      this.sound.unlock();
      return;
    }

    if (!this.bgm.isPlaying) {
      this.bgm.play();
    }

    if (this.bgm.isPlaying) {
      this.bgmStarted = true;
    }
  }

  shutdown() {
    if (this.onAudioUnlocked) {
      this.sound.off('unlocked', this.onAudioUnlocked);
    }
  }

  ensureAudioUnlocked() {
    if (this.sound.locked) {
      this.sound.unlock();
    }
  }

  playCastSound() {
    this.ensureAudioUnlocked();
    this.castSound.stop();
    this.castSound.play();
  }

  playCatchSound() {
    this.ensureAudioUnlocked();
    this.catchSound.play();
  }

  playQuizCorrectSound() {
    this.ensureAudioUnlocked();
    this.quizWrongSound.stop();
    this.quizCorrectSound.stop();
    this.quizCorrectSound.play();
  }

  playQuizWrongSound() {
    this.ensureAudioUnlocked();
    this.quizCorrectSound.stop();
    this.quizWrongSound.stop();
    this.quizWrongSound.play();
  }

  playApexPredatorSpawnSound() {
    if (!this.apexSpawnSound) return;

    this.ensureAudioUnlocked();
    this.apexSpawnSound.stop();
    this.apexSpawnSound.play();
  }

  setupTimers() {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft -= 1;
        this.timerText.setText(`시간: ${this.timeLeft}`);
        this.layoutHudTexts();

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true,
    });
  }

  cast() {
    if (!this.isGameStarted || this.timeLeft <= 0) return;

    this.playCastSound();
    this.isCasting = true;
    this.hookDepth = 80;
    this.updateHookPosition();
    this.updateTouchControlsVisibility();
    this.showMessage('방향 버튼으로 바늘을 움직이고 감기 버튼을 누르세요!', 1800);
  }

  startReel() {
    if (!this.isCasting || this.isReeling) return;
    this.isReeling = true;
    this.clearTouchInput();
    this.updateTouchControlsVisibility();
    this.showMessage('감는 중...', 800);
  }

  spawnCreature(forcedType = null) {
    if (this.timeLeft <= 0 || this.isGameOver) return;

    const type = forcedType ?? this.pickCreature();
    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const direction = fromLeft ? 1 : -1;
    const x = fromLeft ? -type.size : GAME_WIDTH + type.size;
    let y = this.getSpawnY(type);
    let vx = direction * type.speed;
    let vy = 0;

    if (type.moveStyle === 'diagonal') {
      const diagonalSpeed = type.speed * 0.707;
      const goingUp = type.kind === 'octopus' ? true : Phaser.Math.Between(0, 1) === 0;
      vx = direction * diagonalSpeed;
      vy = goingUp ? -diagonalSpeed : diagonalSpeed;
      y = goingUp
        ? Phaser.Math.Between(getWaterFloorY(type) - 48, getWaterFloorY(type) - 8)
        : Phaser.Math.Between(WATER_TOP + 60, WATER_TOP + 150);
    }

    if (type.moveStyle === 'zigzag') {
      const verticalRatio = type.zigzagVerticalRatio ?? 0.6;
      const goingUp = Phaser.Math.Between(0, 1) === 0;
      vx = direction * type.speed * 0.88;
      vy = (goingUp ? -1 : 1) * type.speed * verticalRatio;
    }

    if (type.moveStyle === 'sand') {
      vy = 0;
      y = getSandCrawlerY(type);
    }

    if (type.moveStyle === 'bottomJump') {
      y = getWaterFloorY(type);
      vy = 0;
    }

    const creature = this.createCreatureEntity(x, y, type, direction);

    creature.creatureType = type;
    creature.vx = vx;
    creature.vy = vy;
    creature.bobOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);

    if (type.moveStyle === 'bottomJump') {
      creature.jumpCooldown = 0;
    }

    if (type.fleeFromHook) {
      creature.baseVx = vx;
    }

    if (type.moveStyle === 'zigzag') {
      creature.zigzagInterval = type.zigzagInterval ?? 0.6;
      creature.zigzagTimer = Phaser.Math.FloatBetween(0, creature.zigzagInterval * 0.5);
    }

    creature.setDepth(
      isSandCrawler(type) ? SAND_CRAWLER_DEPTH
        : type.isGoldVariant || type.size >= 75 ? 6
          : CREATURE_DEPTH,
    );

    this.applyCreatureSpawnMotion(creature, type, vx, vy);

    if (isApexPredator(type.kind)) {
      this.registerApexPredatorThreat(type.kind);
    }

    this.fishes.add(creature);
  }

  registerApexPredatorThreat(kind) {
    const wasEmpty = this.apexPredatorThreatCount === 0;
    this.apexPredatorThreatCount += 1;

    if (this.isGameStarted) {
      this.playApexPredatorSpawnSound();
    } else {
      this.pendingApexSpawnSound = true;
    }

    if (wasEmpty) {
      this.showMessage(APEX_PREDATOR_SPAWN_MESSAGES[kind] ?? APEX_PREDATOR_SPAWN_MESSAGES.megalodon, 2800);
      this.setApexPredatorWaterTint(true);
      this.showApexTsunamiEffect();
    }
  }

  unregisterApexPredatorThreat() {
    if (this.apexPredatorThreatCount <= 0) return;

    this.apexPredatorThreatCount -= 1;
    if (this.apexPredatorThreatCount === 0) {
      this.setApexPredatorWaterTint(false);
      this.clearApexTsunamiEffects();
    }
  }

  paintWaterGradient(topColor, bottomColor) {
    if (!this.waterGraphics) return;

    this.waterGraphics.clear();
    this.waterGraphics.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.waterGraphics.fillRect(0, WATER_TOP, GAME_WIDTH, SAND_TOP - WATER_TOP);
  }

  setApexPredatorWaterTint(active) {
    if (!this.waterGraphics) return;

    if (this.apexPredatorWaterTween) {
      this.apexPredatorWaterTween.stop();
      this.apexPredatorWaterTween = null;
    }

    const blendState = { blend: this.apexPredatorWaterBlend ?? 0 };
    const targetBlend = active ? 1 : 0;

    this.apexPredatorWaterTween = this.tweens.add({
      targets: blendState,
      blend: targetBlend,
      duration: active ? 650 : 900,
      ease: active ? 'Sine.easeIn' : 'Sine.easeOut',
      onUpdate: () => {
        this.apexPredatorWaterBlend = blendState.blend;
        const top = lerpWaterColor(WATER_GRADIENT_TOP, MEGALODON_WATER_GRADIENT_TOP, blendState.blend);
        const bottom = lerpWaterColor(WATER_GRADIENT_BOTTOM, MEGALODON_WATER_GRADIENT_BOTTOM, blendState.blend);
        this.paintWaterGradient(top, bottom);
      },
      onComplete: () => {
        this.apexPredatorWaterBlend = targetBlend;
      },
    });
  }

  removeCreature(creature) {
    if (isApexPredator(creature?.creatureType?.kind)) {
      this.unregisterApexPredatorThreat();
    }
    creature.destroy();
  }

  applyWobbegongPredation() {
    const activeFish = this.fishes.getChildren().filter((fish) => fish.active);
    const wobbegongs = activeFish.filter((fish) => fish.creatureType.kind === 'wobbegong');
    if (wobbegongs.length === 0) return;

    const preyToRemove = new Set();

    for (const predator of wobbegongs) {
      for (const prey of activeFish) {
        if (prey === predator) continue;
        if (prey === this.caughtFish) continue;
        if (prey.creatureType.kind === 'wobbegong') continue;
        if (prey.creatureType.giantTier) continue;
        if (preyToRemove.has(prey)) continue;
        if (creaturesOverlap(predator, prey)) {
          preyToRemove.add(prey);
        }
      }
    }

    preyToRemove.forEach((prey) => this.removeCreature(prey));
  }

  catchFish(fish) {
    if (!this.isCasting || this.isReeling) return;

    const { creatureType: type } = fish;
    const successRate = resolveCatchSuccessRate(type);

    if (Math.random() >= successRate) {
      if (getLineBreakChance(type) > 0) {
        this.breakLine(fish);
      } else {
        this.escapeFromHook(fish);
      }
      return;
    }

    this.isReeling = true;
    this.caughtFish = fish;
    this.playCatchSound();
    fish.vx = 0;
    fish.vy = 0;
    fish.setDepth(HOOK_LINE_DEPTH);
    fish.setPosition(this.hook.x, this.hook.y);
    if (fish.usesTexture) {
      fish.setScale(fish.baseScale);
      this.getCreatureSprite(fish).clearTint();
    }
    fish.angle = 0;

    const isGolden = type.isGoldVariant === true;
    const isGiant = type.giantTier && !isGolden;
    const flashSize = isGolden ? 50 : isGiant ? 48 : type.size >= 70 ? 40 : 30;
    const flash = this.add.circle(fish.x, fish.y, flashSize, isGolden ? 0xffd43b : 0xffffff, 0.7);
    this.tweens.add({
      targets: flash,
      scale: isGolden || isGiant ? 2.5 : 2,
      alpha: 0,
      duration: isGolden || isGiant ? 600 : 400,
      onComplete: () => flash.destroy(),
    });

    let catchMessage = `${type.name} 낚았다! +${type.points}점`;
    if (isGolden) {
      catchMessage = `✨ ${type.name} 낚았다! +${type.points}점 ✨`;
    } else if (isGiant) {
      catchMessage = `🦈 ${type.name} 낚았다! +${type.points}점 🦈`;
    }
    this.showMessage(catchMessage, isGolden || isGiant ? 2000 : 1200);
    this.updateTouchControlsVisibility();

    if (INK_SPLASH_KINDS.has(type.kind)) {
      this.showInkSplash(fish.x, fish.y, type.kind === 'giantsquid');
    }
  }

  showInkSplash(x, y, isGiant = false) {
    const waterHeight = SAND_TOP - WATER_TOP;
    const blobCount = isGiant ? 22 : 14;
    const veilAlpha = isGiant ? 0.5 : 0.38;
    const duration = isGiant ? 1500 : 1200;

    const veil = this.add.rectangle(
      GAME_WIDTH / 2,
      WATER_TOP + waterHeight / 2,
      GAME_WIDTH,
      waterHeight,
      0x000000,
      veilAlpha,
    );
    veil.setDepth(INK_SPLASH_DEPTH);

    this.tweens.add({
      targets: veil,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => veil.destroy(),
    });

    const splash = this.add.container(x, y).setDepth(INK_SPLASH_DEPTH + 1);

    for (let i = 0; i < blobCount; i += 1) {
      const offsetX = Phaser.Math.Between(-30, 30);
      const offsetY = Phaser.Math.Between(-24, 24);
      const radius = Phaser.Math.Between(isGiant ? 22 : 14, isGiant ? 72 : 46);
      const blob = this.add.ellipse(
        offsetX,
        offsetY,
        radius,
        radius * Phaser.Math.FloatBetween(0.75, 1.15),
        0x111111,
        Phaser.Math.FloatBetween(0.45, 0.75),
      );
      splash.add(blob);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const spread = Phaser.Math.Between(isGiant ? 70 : 45, isGiant ? 220 : 140);
      this.tweens.add({
        targets: blob,
        x: offsetX + Math.cos(angle) * spread,
        y: offsetY + Math.sin(angle) * spread,
        alpha: 0,
        scaleX: Phaser.Math.FloatBetween(1.2, 1.9),
        scaleY: Phaser.Math.FloatBetween(1.2, 1.9),
        duration: Phaser.Math.Between(duration - 200, duration + 200),
        ease: 'Quad.easeOut',
      });
    }

    for (let i = 0; i < (isGiant ? 6 : 4); i += 1) {
      const edgeBlob = this.add.ellipse(
        Phaser.Math.Between(40, GAME_WIDTH - 40) - x,
        Phaser.Math.Between(WATER_TOP + 20, SAND_TOP - 20) - y,
        Phaser.Math.Between(28, 64),
        Phaser.Math.Between(20, 48),
        0x0a0a0a,
        Phaser.Math.FloatBetween(0.2, 0.4),
      );
      splash.add(edgeBlob);
      this.tweens.add({
        targets: edgeBlob,
        alpha: 0,
        duration: duration + Phaser.Math.Between(0, 300),
        ease: 'Sine.easeOut',
      });
    }

    this.time.delayedCall(duration + 250, () => splash.destroy());
  }

  escapeFromHook(fish) {
    const { creatureType: type } = fish;
    const escapeDirection = fish.x >= this.hook.x ? 1 : -1;

    fish.vx = escapeDirection * type.speed * 1.3;
    fish.vy = Phaser.Math.Between(-1, 1) * type.speed * 0.15;
    this.showMessage(`${type.name}가 도망갔어!`, 1500);
  }

  breakLine(fish) {
    const { creatureType: type } = fish;
    const escapeDirection = fish.x >= this.hook.x ? 1 : -1;

    fish.vx = escapeDirection * type.speed * 1.4;
    fish.vy = Phaser.Math.Between(-1, 1) * type.speed * 0.45;
    this.caughtFish = null;

    const snap = this.add.circle(this.hook.x, this.hook.y, 18, 0xff6b6b, 0.85);
    this.tweens.add({
      targets: snap,
      scale: 2.2,
      alpha: 0,
      duration: 350,
      onComplete: () => snap.destroy(),
    });

    this.isReeling = false;
    this.isCasting = false;
    this.hookDepth = 0;
    this.clearTouchInput();
    this.updateTouchControlsVisibility();
    this.hook.setPosition(this.rodTipX, this.rodTipY);
    this.fishingLine.setTo(this.rodTipX, this.rodTipY, this.rodTipX, this.rodTipY);
    this.showMessage(`💥 ${type.name}가 너무 세서 줄이 끊어졌어!`, 2500);
  }

  updateHookPosition() {
    const x = Phaser.Math.Clamp(this.hook.x, 28, GAME_WIDTH - 28);
    const y = Math.min(this.rodTipY + this.hookDepth, SAND_TOP - 6);

    this.hook.setPosition(x, y);
    this.fishingLine.setTo(this.rodTipX, this.rodTipY, x, y);
  }

  update(time, delta) {
    if (this.timeLeft <= 0) return;

    const dt = delta / 1000;
    const bobTime = time * 0.001;

    if (this.creatureFreezeRemaining > 0) {
      this.creatureFreezeRemaining = Math.max(0, this.creatureFreezeRemaining - dt);
    }

    const creaturesFrozen = this.creatureFreezeRemaining > 0;

    if (this.isGameStarted && this.isCasting && !this.isReeling) {
      const speed = HOOK_SPEED * dt;

      if (this.cursors.left.isDown || this.touchInput.left) this.hook.x -= speed;
      if (this.cursors.right.isDown || this.touchInput.right) this.hook.x += speed;
      if (this.cursors.up.isDown || this.touchInput.up) this.hookDepth = Math.max(40, this.hookDepth - speed);
      if (this.cursors.down.isDown || this.touchInput.down) this.hookDepth = Math.min(this.maxHookDepth, this.hookDepth + speed);

      this.updateHookPosition();
    }

    if (this.isGameStarted && this.isReeling) {
      this.hookDepth -= REEL_SPEED * dt;

      if (this.caughtFish) {
        this.caughtFish.setPosition(this.hook.x, this.hook.y);
      }

      if (this.hookDepth <= 0) {
        this.finishReel();
      } else {
        this.updateHookPosition();
      }
    }

    this.fishes.getChildren().forEach((fish) => {
      if (!fish.active) return;
      if (fish === this.caughtFish) return;
      if (creaturesFrozen) return;

      if (fish.creatureType.moveStyle === 'zigzag') {
        fish.zigzagTimer += dt;
        if (fish.zigzagTimer >= fish.zigzagInterval) {
          fish.zigzagTimer -= fish.zigzagInterval;
          fish.vy *= -1;
        }
      }

      this.applyHookFleeBehavior(fish);

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      const touchesSurface = fish.y < WATER_TOP + 20 && fish.vy < 0;
      const isDiagonalSwimmer = fish.creatureType.moveStyle === 'diagonal';
      if (isDiagonalSwimmer && touchesSurface) {
        fish.y = WATER_TOP + 20;
        fish.vy = Math.abs(fish.vy);
      }

      if (isSandCrawler(fish.creatureType)) {
        fish.vy = 0;
        fish.y = getSandCrawlerY(fish.creatureType, bobTime, fish.bobOffset);
        fish.angle = Math.sin(bobTime * 12 + fish.bobOffset) * 5;
        if (fish.usesTexture) {
          fish.setScale(fish.baseScale * (1 + Math.sin(bobTime * 14 + fish.bobOffset) * 0.05));
        }
      } else switch (fish.creatureType.kind) {
        case 'jellyfish':
          fish.y += Math.sin(bobTime * 2 + fish.bobOffset) * 35 * dt;
          break;
        case 'lantern_anglerfish':
          fish.y += Math.sin(bobTime * 1.6 + fish.bobOffset) * 16 * dt;
          fish.angle = Math.sin(bobTime * 2.2 + fish.bobOffset) * 3;
          break;
        case 'seahorse':
          fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 20 * dt;
          break;
        case 'octopus':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx || 0.001)) * 0.6
            + Math.sin(bobTime * 3 + fish.bobOffset) * 5;
          break;
        case 'squid':
        case 'giantsquid':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx)) * 0.4;
          break;
        case 'shark':
        case 'makoshark':
        case 'sawshark':
        case 'hammerhead':
        case 'whale_shark':
        case 'wobbegong':
        case 'orca':
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 12 * dt;
          fish.angle = Math.sin(bobTime * 3 + fish.bobOffset) * 2;
          break;
        case 'megalodon':
        case 'mosasaurus':
        case 'electric_eel':
        case 'mantis_shrimp':
          if (fish.creatureType.moveStyle === 'bottomJump') {
            this.applyBottomJumpMotion(fish, dt, bobTime);
          } else {
            fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 14 * dt;
            fish.angle = Math.sin(bobTime * 4 + fish.bobOffset) * 3;
          }
          if (fish.usesTexture) {
            const apexSprite = this.getCreatureSprite(fish);
            if (fish.creatureType.kind === 'electric_eel' && fish.electricAura) {
              fish.electricPhase = (fish.electricPhase ?? 0) + dt * 9;
              this.drawElectricCreatureAura(
                fish.electricAura,
                apexSprite.displayWidth,
                apexSprite.displayHeight,
                fish.electricPhase,
              );
            }
            const redPulse = Math.sin(bobTime * 14 + fish.bobOffset);
            if (!fish.creatureType.isGoldVariant) {
              if (redPulse > 0.45) {
                apexSprite.setTint(0xff3333);
              } else {
                apexSprite.clearTint();
              }
            }
          }
          break;
        case 'ray':
        case 'manta':
          fish.y += Math.sin(bobTime * 1.8 + fish.bobOffset) * 10 * dt;
          break;
        case 'seal':
        case 'leopard_seal':
          fish.y += Math.sin(bobTime * 2.8 + fish.bobOffset) * 16 * dt;
          break;
        case 'pufferfish':
          fish.setScale(fish.baseScale * (1 + Math.sin(bobTime * 6 + fish.bobOffset) * 0.12));
          break;
        case 'dunkleosteus':
          fish.angle = Math.sin(bobTime * 2 + fish.bobOffset) * 3;
          break;
        case 'horseshoe_crab':
        case 'pistol_shrimp':
          fish.angle = Math.sin(bobTime * 2 + fish.bobOffset) * 2;
          break;
        case 'crocodile':
          fish.y += Math.sin(bobTime * 1.5 + fish.bobOffset) * 6 * dt;
          break;
        case 'carp_king':
          fish.y += Math.sin(bobTime * 2.2 + fish.bobOffset) * 14 * dt;
          break;
        case 'turtle':
          fish.y += Math.sin(bobTime * 1.2 + fish.bobOffset) * 10 * dt;
          break;
        case 'eel':
          fish.angle = Math.sin(bobTime * 6 + fish.bobOffset) * 12;
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 18 * dt;
          break;
        case 'starfish':
          fish.angle = Math.sin(bobTime * 1.5 + fish.bobOffset) * 4;
          break;
        case 'beluga':
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 12 * dt;
          fish.angle = 0;
          if (fish.usesTexture) {
            this.getCreatureSprite(fish).setFlipX(fish.vx > 0);
          }
          break;
        case 'dolphin':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx)) * 0.75
            + Math.sin(bobTime * 4 + fish.bobOffset) * 14;
          fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 10 * dt;
          break;
        case 'flyingfish':
          fish.angle = getFlyingfishAngle(
            fish.vx,
            fish.vy,
            Math.sin(bobTime * 5 + fish.bobOffset) * 4,
          );
          break;
        default:
          fish.angle = 0;
          break;
      }

      this.clampWaterCreatureY(fish);

      if (fish.creatureType.isGoldVariant) {
        this.updateGoldVariantVisuals(fish, bobTime);
      }

      if (fish.creatureType.kind === 'flyingfish') {
        const floor = getWaterFloorY(fish.creatureType);
        if (fish.y >= floor && fish.vy > 0) {
          fish.y = floor;
          fish.vy = -Math.abs(fish.vy);
        }
      }

      if (this.isGameStarted && this.isCasting && !this.isReeling) {
        const dist = Phaser.Math.Distance.Between(this.hook.x, this.hook.y, fish.x, fish.y);
        if (dist < fish.creatureType.size * 0.55) {
          this.catchFish(fish);
        }
      }

      if (isDiagonalSwimmer && fish.y < WATER_TOP + 20) {
        fish.y = WATER_TOP + 20;
        if (fish.vy < 0) fish.vy = Math.abs(fish.vy);
      }

      const horizontalMargin = Math.max(80, fish.creatureType.size + 16);
      const escapedTop = fish.y < WATER_TOP + 20 && !isDiagonalSwimmer;
      const outOfBounds = fish.x < -horizontalMargin
        || fish.x > GAME_WIDTH + horizontalMargin
        || escapedTop
        || fish.y > WATER_BOTTOM + 20;

      if (outOfBounds) {
        this.removeCreature(fish);
      }
    });

    if (!creaturesFrozen) {
      this.applyWobbegongPredation();
    }
  }

  finishReel() {
    if (this.caughtFish) {
      this.score += this.caughtFish.creatureType.points;
      this.scoreText.setText(`점수: ${this.score}`);
      this.layoutHudTexts();
      this.removeCreature(this.caughtFish);
      this.caughtFish = null;
    }

    this.isCasting = false;
    this.isReeling = false;
    this.hookDepth = 0;
    this.clearTouchInput();
    this.updateTouchControlsVisibility();
    this.hook.setPosition(this.rodTipX, this.rodTipY);
    this.fishingLine.setTo(this.rodTipX, this.rodTipY, this.rodTipX, this.rodTipY);
  }

  showMessage(text, duration = 1500) {
    this.messageText.setText(text);
    this.messageText.setAlpha(1);

    if (this.messageTween) {
      this.messageTween.stop();
    }

    this.messageTween = this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      delay: duration,
      duration: 500,
    });
  }

  clearQuizCooldownTimer() {
    if (this.quizCooldownTimer) {
      this.quizCooldownTimer.remove(false);
      this.quizCooldownTimer = null;
    }
  }

  teardownDrawingQuizInput() {
    if (this.quizDrawingPointerMoveHandler) {
      this.input.off('pointermove', this.quizDrawingPointerMoveHandler);
      this.quizDrawingPointerMoveHandler = null;
    }
    if (this.quizDrawingPointerUpHandler) {
      this.input.off('pointerup', this.quizDrawingPointerUpHandler);
      this.quizDrawingPointerUpHandler = null;
    }
    if (this.quizDrawingPointerUpOutsideHandler) {
      this.input.off('pointerupoutside', this.quizDrawingPointerUpOutsideHandler);
      this.quizDrawingPointerUpOutsideHandler = null;
    }
    this.isDrawingQuizActive = false;
    this.quizDrawingState = null;
  }

  clearQuizInteraction() {
    this.teardownDrawingQuizInput();

    if (this.quizButtons) {
      this.quizButtons.forEach(({ button }) => button.destroy());
      this.quizButtons = [];
    }

    if (this.quizButtonContainer) {
      this.quizButtonContainer.removeAll(true);
    }

    if (this.quizDrawBrush) {
      this.quizDrawBrush.destroy();
      this.quizDrawBrush = null;
    }

    if (this.quizDrawingLayer) {
      this.quizDrawingLayer.destroy(true);
      this.quizDrawingLayer = null;
    }

    this.quizDrawingRenderTexture = null;
    this.quizDrawCanvasCenter = null;
    this.quizDrawCanvasBounds = null;
    this.quizDrawingHint = null;
    this.quizDrawButtons = [];
  }

  clearDrawingQuizCanvas() {
    if (this.quizDrawingRenderTexture) {
      this.quizDrawingRenderTexture.clear();
    }
    if (this.quizDrawingHint) {
      this.quizDrawingHint.setVisible(true);
    }
  }

  clampQuizDrawPoint(x, y) {
    const halfW = QUIZ_DRAW_CANVAS_WIDTH / 2;
    const halfH = QUIZ_DRAW_CANVAS_HEIGHT / 2;
    return {
      x: Phaser.Math.Clamp(x, -halfW, halfW),
      y: Phaser.Math.Clamp(y, -halfH, halfH),
    };
  }

  getQuizDrawPointFromPointer(pointer) {
    if (!this.quizDrawCanvasCenter) {
      return { x: 0, y: 0 };
    }

    return this.clampQuizDrawPoint(
      pointer.x - this.quizDrawCanvasCenter.x,
      pointer.y - this.quizDrawCanvasCenter.y,
    );
  }

  toQuizDrawTexturePoint(x, y) {
    return {
      x: x + QUIZ_DRAW_CANVAS_WIDTH / 2,
      y: y + QUIZ_DRAW_CANVAS_HEIGHT / 2,
    };
  }

  drawQuizStroke(fromX, fromY, toX, toY) {
    if (!this.quizDrawingRenderTexture || !this.quizDrawBrush) return;

    const start = this.toQuizDrawTexturePoint(fromX, fromY);
    const end = this.toQuizDrawTexturePoint(toX, toY);

    this.quizDrawBrush.clear();
    this.quizDrawBrush.lineStyle(3, 0x212529, 1);
    this.quizDrawBrush.lineBetween(start.x, start.y, end.x, end.y);
    this.quizDrawingRenderTexture.draw(this.quizDrawBrush, 0, 0);
  }

  handleDrawingPointerDown(pointer) {
    if (!this.isQuizActive || this.isQuizLocked || !this.quizDrawCanvasBounds) return;
    if (!Phaser.Geom.Rectangle.Contains(this.quizDrawCanvasBounds, pointer.x, pointer.y)) return;

    if (this.quizDrawingHint?.visible) {
      this.quizDrawingHint.setVisible(false);
    }

    const point = this.getQuizDrawPointFromPointer(pointer);
    this.quizDrawingState = {
      isDrawing: true,
      lastX: point.x,
      lastY: point.y,
    };
    this.isDrawingQuizActive = true;

    if (!this.quizDrawingPointerMoveHandler) {
      this.quizDrawingPointerMoveHandler = (activePointer) => {
        this.handleDrawingPointerMove(activePointer);
      };
      this.input.on('pointermove', this.quizDrawingPointerMoveHandler);
    }
  }

  handleDrawingPointerMove(pointer) {
    if (!this.quizDrawingState?.isDrawing || !this.quizDrawingRenderTexture) return;

    const point = this.getQuizDrawPointFromPointer(pointer);
    this.drawQuizStroke(
      this.quizDrawingState.lastX,
      this.quizDrawingState.lastY,
      point.x,
      point.y,
    );
    this.quizDrawingState.lastX = point.x;
    this.quizDrawingState.lastY = point.y;
  }

  handleDrawingPointerUp() {
    if (this.quizDrawingState) {
      this.quizDrawingState.isDrawing = false;
    }
    if (this.quizDrawingPointerMoveHandler) {
      this.input.off('pointermove', this.quizDrawingPointerMoveHandler);
      this.quizDrawingPointerMoveHandler = null;
    }
  }

  setQuizDrawButtonsEnabled(enabled) {
    if (!this.quizDrawButtons) return;

    this.quizDrawButtons.forEach(({ button, bg }) => {
      if (enabled) {
        button.setInteractive({ useHandCursor: true });
        bg.setAlpha(1);
      } else {
        button.disableInteractive();
        bg.setAlpha(0.45);
      }
    });
  }

  buildDrawingQuiz() {
    this.clearQuizInteraction();

    if (this.quizPanelBg) {
      this.quizPanelBg.setSize(560, 360);
    }
    if (this.quizPanel) {
      this.quizPanel.setY(QUIZ_DRAW_PANEL_Y);
    }
    if (this.quizFeedback) {
      this.quizFeedback.setY(148);
    }
    if (this.quizCategoryText) {
      this.quizCategoryText.setY(QUIZ_CATEGORY_TEXT_Y - QUIZ_DRAW_TEXT_RAISE);
    }
    if (this.quizText) {
      this.quizText.setY(QUIZ_TEXT_Y - QUIZ_DRAW_TEXT_RAISE);
    }

    this.quizDrawCanvasCenter = {
      x: QUIZ_DRAW_CANVAS_CENTER_X,
      y: QUIZ_DRAW_CANVAS_CENTER_Y,
    };
    this.quizDrawCanvasBounds = new Phaser.Geom.Rectangle(
      QUIZ_DRAW_CANVAS_CENTER_X - QUIZ_DRAW_CANVAS_WIDTH / 2,
      QUIZ_DRAW_CANVAS_CENTER_Y - QUIZ_DRAW_CANVAS_HEIGHT / 2,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
    );

    this.quizDrawingLayer = this.add.container(0, 0).setDepth(103);

    const canvasBg = this.add.rectangle(
      QUIZ_DRAW_CANVAS_CENTER_X,
      QUIZ_DRAW_CANVAS_CENTER_Y,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
      0xffffff,
      1,
    );
    canvasBg.setStrokeStyle(2, 0x868e96);
    canvasBg.setInteractive({ useHandCursor: true });

    this.quizDrawingRenderTexture = this.add.renderTexture(
      QUIZ_DRAW_CANVAS_CENTER_X,
      QUIZ_DRAW_CANVAS_CENTER_Y,
      QUIZ_DRAW_CANVAS_WIDTH,
      QUIZ_DRAW_CANVAS_HEIGHT,
    );
    this.quizDrawingRenderTexture.setOrigin(0.5, 0.5);

    const canvasHint = this.add.text(QUIZ_DRAW_CANVAS_CENTER_X, QUIZ_DRAW_CANVAS_CENTER_Y, '여기에 그려 보세요', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#adb5bd',
    }).setOrigin(0.5);
    this.quizDrawingHint = canvasHint;

    this.quizDrawBrush = this.make.graphics({ add: false });
    this.quizDrawingLayer.add([canvasBg, this.quizDrawingRenderTexture, canvasHint]);

    canvasBg.on('pointerdown', (pointer) => this.handleDrawingPointerDown(pointer));

    this.quizDrawingPointerUpHandler = () => this.handleDrawingPointerUp();
    this.quizDrawingPointerUpOutsideHandler = () => this.handleDrawingPointerUp();
    this.input.on('pointerup', this.quizDrawingPointerUpHandler);
    this.input.on('pointerupoutside', this.quizDrawingPointerUpOutsideHandler);

    const clearButton = this.createQuizPanelButton(-95, 108, '지우기', 0x868e96, () => {
      this.clearDrawingQuizCanvas();
    });
    const submitButton = this.createQuizPanelButton(95, 108, '확인', 0x40c057, () => {
      this.submitDrawingQuiz();
    });

    this.quizButtonContainer.add([clearButton, submitButton]);
    this.quizDrawButtons = [
      { button: clearButton, bg: clearButton.list[0] },
      { button: submitButton, bg: submitButton.list[0] },
    ];
    this.quizButtons = [];
  }

  createQuizPanelButton(x, y, label, color, onPress) {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 150, 42, color, 1);
    bg.setStrokeStyle(2, 0xffffff);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(150, 42);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      if (!this.isQuizLocked) bg.setAlpha(0.88);
    });
    button.on('pointerout', () => {
      if (!this.isQuizLocked) bg.setAlpha(1);
    });
    button.on('pointerdown', () => {
      if (!this.isQuizActive || this.isQuizLocked) return;
      onPress();
    });

    return button;
  }

  completeQuizSuccess(message) {
    this.playQuizCorrectSound();
    this.quizFeedback.setText(message);
    this.quizFeedback.setColor('#69db7c');
    this.isQuizActive = false;
    this.clearQuizCooldownTimer();
    this.clearQuizInteraction();

    this.time.delayedCall(900, () => {
      this.scene.restart();
    });
  }

  submitDrawingQuiz() {
    if (!this.isQuizActive || this.isQuizLocked) return;
    this.completeQuizSuccess('완료! 다시 낚시를 시작해요');
  }

  setQuizButtonsEnabled(enabled) {
    if (!this.quizButtons) return;

    this.quizButtons.forEach(({ button, bg }) => {
      if (enabled) {
        button.setInteractive({ useHandCursor: true });
        bg.setAlpha(1);
      } else {
        button.disableInteractive();
        bg.setAlpha(0.45);
      }
    });
  }

  updateQuizCooldownFeedback() {
    if (!this.quizFeedback) return;

    this.quizFeedback.setText(`틀렸어요! ${this.quizCooldownLeft}초 후에 다시 풀 수 있어요`);
    this.quizFeedback.setColor('#ff8787');
  }

  startQuizCooldown() {
    this.isQuizLocked = true;
    this.quizCooldownLeft = QUIZ_COOLDOWN_SECONDS;
    this.setQuizButtonsEnabled(false);
    this.setQuizDrawButtonsEnabled(false);
    this.updateQuizCooldownFeedback();

    this.clearQuizCooldownTimer();
    this.quizCooldownTimer = this.time.addEvent({
      delay: 1000,
      repeat: QUIZ_COOLDOWN_SECONDS - 1,
      callback: () => {
        this.quizCooldownLeft -= 1;
        if (this.quizCooldownLeft <= 0) {
          this.endQuizCooldown();
          return;
        }
        this.updateQuizCooldownFeedback();
      },
    });
  }

  endQuizCooldown() {
    this.clearQuizCooldownTimer();
    this.isQuizLocked = false;
    this.quizCooldownLeft = 0;
    this.setQuizButtonsEnabled(true);
    this.setQuizDrawButtonsEnabled(true);

    if (this.quizFeedback) {
      const isDraw = getQuizQuestionType(this.quizQuestion) === 'draw';
      this.quizFeedback.setText(isDraw ? '그림을 그리고 확인을 눌러 주세요' : '정답을 골라 보세요');
      this.quizFeedback.setColor('#ced4da');
    }
  }

  presentQuizQuestion() {
    this.quizQuestion = pickRandomQuizQuestion();
    this.isQuizLocked = false;
    this.quizCooldownLeft = 0;
    this.clearQuizCooldownTimer();
    this.clearQuizInteraction();

    const categoryLabel = QUIZ_CATEGORY_LABELS[this.quizQuestion.category] ?? '';
    const isDraw = getQuizQuestionType(this.quizQuestion) === 'draw';

    this.quizCategoryText.setText(`[${categoryLabel}]`);
    this.quizText.setText(this.quizQuestion.prompt);

    if (isDraw) {
      this.quizFeedback.setText('그림을 그리고 확인을 눌러 주세요');
      this.quizFeedback.setColor('#ced4da');
      this.buildDrawingQuiz();
      return;
    }

    if (this.quizPanelBg) {
      this.quizPanelBg.setSize(560, 312);
    }
    if (this.quizPanel) {
      this.quizPanel.setY(GAME_HEIGHT / 2 + 20);
    }
    if (this.quizFeedback) {
      this.quizFeedback.setY(132);
    }
    if (this.quizCategoryText) {
      this.quizCategoryText.setY(QUIZ_CATEGORY_TEXT_Y);
    }
    if (this.quizText) {
      this.quizText.setY(QUIZ_TEXT_Y);
    }

    this.quizFeedback.setText('정답을 골라 보세요');
    this.quizFeedback.setColor('#ced4da');
    this.quizButtons = [];
    this.quizDrawButtons = [];
    this.buildQuizButtons(this.quizQuestion.options);
  }

  buildQuizButtons(choices) {
    const positions = [
      { x: -95, y: 28 },
      { x: 95, y: 28 },
      { x: -95, y: 78 },
      { x: 95, y: 78 },
    ];

    choices.forEach((choice, index) => {
      const { x, y } = positions[index];
      const button = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 150, 42, 0x339af0, 1);
      bg.setStrokeStyle(2, 0xffffff);
      const fontSize = choice.length > 6 ? '18px' : '22px';
      const label = this.add.text(0, 0, choice, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize,
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 136 },
      }).setOrigin(0.5);

      button.add([bg, label]);
      button.setSize(150, 42);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        if (!this.isQuizLocked) bg.setFillStyle(0x228be6, 1);
      });

      button.on('pointerout', () => {
        if (!this.isQuizLocked) bg.setFillStyle(0x339af0, 1);
      });

      button.on('pointerdown', () => {
        this.checkQuizAnswer(choice, bg);
      });

      this.quizButtonContainer.add(button);
      this.quizButtons.push({ button, bg, choice });
    });
  }

  showRestartQuiz() {
    this.isQuizActive = true;
    this.clearQuizCooldownTimer();

    if (this.quizPanel) {
      this.clearQuizInteraction();
      this.quizPanel.destroy(true);
    }

    this.quizPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    this.quizPanel.setDepth(102);

    const panelBg = this.add.rectangle(0, 0, 560, 312, 0x1c314a, 0.95);
    panelBg.setStrokeStyle(3, 0xffd43b);
    panelBg.setInteractive({ useHandCursor: false });
    this.quizPanelBg = panelBg;

    const quizTitle = this.add.text(0, -102, '다시 낚시하려면 문제를 풀어요!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.quizCategoryText = this.add.text(0, QUIZ_CATEGORY_TEXT_Y, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#91a7ff',
    }).setOrigin(0.5);

    this.quizText = this.add.text(0, QUIZ_TEXT_Y, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.quizButtonContainer = this.add.container(0, 10);

    this.quizFeedback = this.add.text(0, 132, '정답을 골라 보세요', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ced4da',
    }).setOrigin(0.5);

    this.quizPanel.add([
      panelBg,
      quizTitle,
      this.quizCategoryText,
      this.quizText,
      this.quizButtonContainer,
      this.quizFeedback,
    ]);
    this.quizButtons = [];
    this.quizDrawButtons = [];

    this.presentQuizQuestion();
  }

  checkQuizAnswer(selected, buttonBg) {
    if (!this.isQuizActive || this.isQuizLocked) return;

    if (selected === this.quizQuestion.answer) {
      buttonBg.setFillStyle(0x40c057, 1);
      this.completeQuizSuccess('정답! 다시 낚시를 시작해요');
      return;
    }

    buttonBg.setFillStyle(0xfa5252, 1);
    this.playQuizWrongSound();
    this.startQuizCooldown();

    this.time.delayedCall(500, () => {
      if (!this.isQuizActive || !this.isQuizLocked) return;
      buttonBg.setFillStyle(0x339af0, 1);
      buttonBg.setAlpha(0.45);
    });
  }

  endGame() {
    this.isGameOver = true;
    this.clearLightningCooldownTimer();
    this.clearLightningWaterEffect();
    this.clearApexTsunamiEffects();
    this.creatureFreezeRemaining = 0;
    if (this.bgm?.isPlaying) {
      this.bgm.stop();
    }
    this.isCasting = false;
    this.isReeling = false;
    this.apexPredatorThreatCount = 0;
    this.setApexPredatorWaterTint(false);
    this.clearTouchInput();
    this.updateTouchControlsVisibility();
    this.gameTimer.remove(false);
    this.fishes.clear(true, true);

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    overlay.setDepth(100);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 52, '게임 종료!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, `최종 점수: ${this.score}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '24px',
      color: '#ffd43b',
    }).setOrigin(0.5).setDepth(101);

    this.showRestartQuiz();
  }
}
