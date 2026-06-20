import Phaser from 'phaser';
import { getTextureKeyForCreature, FUR_SEAL_TEXTURE, NORMAL_FISH_TEXTURE, RAY_TEXTURE, SQUID_TEXTURE, TURTLE_TEXTURE } from '../config/creatureAssets.js';
import { pickRandomQuizQuestion, QUIZ_CATEGORY_LABELS } from '../config/quizQuestions.js';

const GAME_WIDTH = 844;
const WHALE_SHARK_SIZE = Math.round(GAME_WIDTH / 3);
const MEGALODON_SIZE = Math.round(WHALE_SHARK_SIZE * 0.86);
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
const MEGALODON_SPAWN_MESSAGE = '🦈 메갈로돈이 나타났다! 🦈';

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
const ROD_BASE_OFFSET_X = 30;
const ROD_TIP_OFFSET_X = 76;
const ROD_OFFSET_Y = 20;
const FISHERMAN_Y = WATER_TOP - 42;
const ROD_BASE_Y_OFFSET = 6 + ROD_OFFSET_Y;
const ROD_TIP_Y_OFFSET = -14 + ROD_OFFSET_Y;
const HOOK_SPEED = 280;
const REEL_SPEED = 320;
const GOLDEN_FISH_CHANCE = 0.04;
const GIANT_LINE_BREAK_CHANCE = 0.38;
const SHARK_LINE_BREAK_CHANCE = 0.15;
const SHARK_KINDS = new Set(['shark', 'wobbegong', 'makoshark', 'hammerhead']);
const QUIZ_COOLDOWN_SECONDS = 20;
/** 테스트용: 게임 시작 시 강제 등장 종 ('megalodon' | 'whale_shark' | null) */
const TEST_FIRST_CREATURE = 'turtle';

function getLineBreakChance(type) {
  if (type.lineBreakChance != null) return type.lineBreakChance;
  if (type.giantTier) return GIANT_LINE_BREAK_CHANCE;
  if (SHARK_KINDS.has(type.kind)) return SHARK_LINE_BREAK_CHANCE;
  return 0;
}
const GOLDEN_FISH = {
  kind: 'golden_fish',
  name: '황금 물고기',
  color: 0xffd43b,
  points: 100,
  speed: 180,
  size: 32,
  texture: 'creature_golden_fish',
  textureScale: 0.72,
  textureFacing: 'left',
};
const CREATURES = [
  { kind: 'fish', name: '붕어', color: 0xffa94d, points: 10, speed: 80, size: 28, weight: 18, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '잉어', color: 0xff6b6b, points: 20, speed: 100, size: 34, weight: 16, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '송어', color: 0x69db7c, points: 35, speed: 130, size: 30, weight: 14, ...NORMAL_FISH_TEXTURE },
  { kind: 'fish', name: '참치', color: 0x4dabf7, points: 50, speed: 160, size: 42, weight: 10, ...NORMAL_FISH_TEXTURE },
  { kind: 'jellyfish', name: '해파리', color: 0xda77f2, points: 25, speed: 55, size: 34, weight: 9 },
  { kind: 'octopus', name: '문어', color: 0x845ef7, points: 45, speed: 70, size: 38, weight: 6, moveStyle: 'zigzag', zigzagInterval: 0.85, zigzagVerticalRatio: 0.52 },
  { kind: 'squid', name: '오징어', color: 0xffffff, points: 38, speed: 110, size: 40, weight: 8, moveStyle: 'zigzag', zigzagInterval: 0.48, zigzagVerticalRatio: 0.68, ...SQUID_TEXTURE },
  { kind: 'seahorse', name: '해마', color: 0xff922b, points: 30, speed: 65, size: 26, weight: 8 },
  { kind: 'turtle', name: '거북이', color: 0x40c057, points: 60, speed: 38, size: 44, weight: 8, ...TURTLE_TEXTURE, fleeFromHook: true, fleeRadius: 130, fleeSpeedMultiplier: 1.8 },
  { kind: 'eel', name: '바다장어', color: 0x343a40, points: 40, speed: 95, size: 52, weight: 7 },
  { kind: 'crab', name: '게', color: 0xfa5252, points: 22, speed: 75, size: 50, weight: 11, spawnZone: 'bottom', moveStyle: 'sand', texture: 'creature_crab', textureScale: 0.92, textureFacing: 'left' },
  { kind: 'crayfish', name: '가재', color: 0xb01e1e, points: 28, speed: 65, size: 34, weight: 9, spawnZone: 'bottom', moveStyle: 'sand', sandYOffset: -15 },
  { kind: 'dolphin', name: '돌고래', color: 0x339af0, points: 42, speed: 120, size: 46, weight: 7, moveStyle: 'diagonal' },
  { kind: 'flyingfish', name: '날치', color: 0x91a7ff, points: 32, speed: 140, size: 30, weight: 8, moveStyle: 'diagonal' },
  { kind: 'starfish', name: '불가사리', color: 0xff6b6b, points: 18, speed: 35, size: 28, weight: 10 },
  { kind: 'shrimp', name: '새우', color: 0xff8787, points: 15, speed: 145, size: 22, weight: 12 },
  { kind: 'ray', name: '가오리', color: 0x748ffc, points: 55, speed: 75, size: 48, weight: 5, ...RAY_TEXTURE },
  { kind: 'shark', name: '상어', color: 0x5c6773, points: 80, speed: 125, size: 68, weight: 2, texture: 'creature_shark', textureFacing: 'left' },
  { kind: 'wobbegong', name: '돌묵상어', color: 0x8d6e63, points: 70, speed: 65, size: 58, weight: 3, spawnZone: 'bottom' },
  { kind: 'makoshark', name: '청상아리', color: 0x78909c, points: 75, speed: 70, size: 124, weight: 3, spawnZone: 'mid', texture: 'creature_makoshark', textureScale: 0.78, textureFacing: 'left' },
  { kind: 'hammerhead', name: '귀상어', color: 0x607d8b, points: 85, speed: 115, size: 64, weight: 2, spawnZone: 'mid' },
  { kind: 'orca', name: '범고래', color: 0x212529, points: 90, speed: 130, size: 72, weight: 2, spawnZone: 'large' },
  { kind: 'manta', name: '만타가오리', color: 0x546e7a, points: 88, speed: 60, size: 144, weight: 2, spawnZone: 'large', ...RAY_TEXTURE, useTint: true },
  { kind: 'giantsquid', name: '대왕오징어', color: 0x4a148c, points: 95, speed: 85, size: 76, weight: 2, spawnZone: 'deep', moveStyle: 'zigzag', zigzagInterval: 0.65, zigzagVerticalRatio: 0.58, giantTier: true, lineBreakChance: 0.35, ...SQUID_TEXTURE, textureScale: 0.82 },
  { kind: 'megalodon', name: '메갈로돈', color: 0x37474f, points: 300, speed: 165, size: MEGALODON_SIZE, weight: 1, spawnZone: 'large', giantTier: true, lineBreakChance: 0.5, catchChance: 0.1, texture: 'creature_megalodon', textureScale: 1, textureFacing: 'left' },
  { kind: 'seal', name: '물개', color: 0xadb5bd, points: 48, speed: 85, size: 40, weight: 6, spawnZone: 'surface', ...FUR_SEAL_TEXTURE },
  { kind: 'leopard_seal', name: '바다표범', color: 0xf1f3f5, points: 65, speed: 100, size: 44, weight: 4, spawnZone: 'mid', ...FUR_SEAL_TEXTURE, leopardPattern: true },
  { kind: 'dunkleosteus', name: '둔클레오사우루스', color: 0x5d4e37, points: 92, speed: 55, size: 70, weight: 2, spawnZone: 'mid' },
  { kind: 'horseshoe_crab', name: '투구게', color: 0x6d4c41, points: 35, speed: 50, size: 36, weight: 7, spawnZone: 'bottom' },
  { kind: 'pufferfish', name: '복어', color: 0xffe066, points: 35, speed: 70, size: 30, weight: 8, spawnZone: 'mid' },
  { kind: 'carp_king', name: '잉어킹', color: 0xff922b, points: 75, speed: 90, size: 50, weight: 4, spawnZone: 'mid', texture: 'creature_carp_king', textureScale: 0.72, textureFacing: 'left' },
  { kind: 'crocodile', name: '악어', color: 0x2b8a3e, points: 70, speed: 45, size: 84, weight: 4, spawnZone: 'surface', catchChance: 0.3, texture: 'creature_crocodile', textureScale: 0.78, textureFacing: 'left' },
  { kind: 'pistol_shrimp', name: '딱총새우', color: 0xff6b6b, points: 28, speed: 120, size: 24, weight: 9, spawnZone: 'bottom' },
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
    this.megalodonThreatCount = 0;
    this.megalodonWaterTween = null;
    this.megalodonWaterBlend = 0;

    this.createBackground();
    this.createDock();
    this.createFisherman();
    this.createLineAndHook();
    this.maxHookDepth = Math.max(40, SAND_TOP - this.rodTipY - 10);
    this.createUI();
    this.createTouchControls();
    this.createFishGroup();
    this.setupInput();
    this.setupTimers();

    if (TEST_FIRST_CREATURE === 'megalodon') {
      this.time.delayedCall(3200, () => {
        if (!this.isGameOver) {
          this.showMessage('던지기 버튼으로 낚싯줄을 던지세요!', 2200);
        }
      });
    } else {
      this.showMessage('던지기 버튼으로 낚싯줄을 던지세요!', 2200);
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
      if (this.isGameOver || this.isQuizActive || this.isCasting || this.isReeling) return;
      this.cast();
    });

    this.reelButton = this.createActionButton(68, controlCenterY, '감기', () => {
      if (this.isGameOver || this.isQuizActive) return;
      this.startReel();
    });
    this.reelButton.setVisible(false);

    this.touchUI.add([this.dpad, this.castButton, this.reelButton]);
  }

  updateTouchControlsVisibility() {
    if (!this.dpad || !this.castButton || !this.reelButton) return;

    const canPlay = !this.isGameOver && !this.isQuizActive;
    const aiming = this.isCasting && !this.isReeling;

    this.dpad.setVisible(canPlay && aiming);
    this.castButton.setVisible(canPlay && !this.isCasting && !this.isReeling);
    this.reelButton.setVisible(canPlay && aiming);
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

    this.timerText = this.add.text(GAME_WIDTH - 12, 10, `시간: ${GAME_DURATION}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);

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
    if (Math.random() < GOLDEN_FISH_CHANCE) {
      return GOLDEN_FISH;
    }

    const totalWeight = CREATURES.reduce((sum, creature) => sum + creature.weight, 0);
    let roll = Phaser.Math.Between(1, totalWeight);

    for (const creature of CREATURES) {
      roll -= creature.weight;
      if (roll <= 0) {
        return creature;
      }
    }

    return CREATURES[0];
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
    if (type.kind === 'golden_fish') {
      return Phaser.Math.Between(WATER_TOP + 80, floor - 12);
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

    const floor = getWaterFloorY(fish.creatureType);
    if (fish.y > floor) {
      fish.y = floor;
      if (fish.vy > 0) fish.vy = 0;
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

      if (type.useTint && type.color) {
        sprite.setTint(type.color);
      }

      if (type.leopardPattern) {
        try {
          if (sprite.preFX) {
            const matrix = sprite.preFX.addColorMatrix();
            matrix.brightness(1.35, false);
            matrix.saturate(-0.3, true);
          }
        } catch (error) {
          console.warn('[GameScene] leopard seal color effect skipped:', error);
        }

        const container = this.add.container(x, y);
        const spots = this.add.graphics();
        this.drawLeopardSealSpots(spots, sprite.displayWidth, sprite.displayHeight);
        sprite.setFlipX(flipX);
        spots.setScale(flipX ? -1 : 1, 1);
        container.add([sprite, spots]);
        container.creatureSprite = sprite;
        container.baseScale = scale;
        container.usesTexture = true;
        return container;
      }

      sprite.setPosition(x, y);
      sprite.setFlipX(flipX);
      sprite.baseScale = scale;
      sprite.usesTexture = true;
      return sprite;
    }

    const graphics = this.add.graphics({ x, y });
    this.drawCreature(graphics, type, direction);
    graphics.baseScale = 1;
    graphics.usesTexture = false;
    return graphics;
  }

  drawLeopardSealSpots(graphics, bodyWidth, bodyHeight) {
    graphics.clear();
    const spots = [
      { x: -0.2, y: -0.18, rx: 0.045, ry: 0.038 },
      { x: -0.08, y: -0.14, rx: 0.052, ry: 0.042 },
      { x: 0.05, y: -0.16, rx: 0.04, ry: 0.034 },
      { x: 0.16, y: -0.1, rx: 0.038, ry: 0.032 },
      { x: -0.14, y: -0.02, rx: 0.048, ry: 0.04 },
      { x: 0.02, y: -0.03, rx: 0.044, ry: 0.036 },
      { x: 0.12, y: 0.02, rx: 0.036, ry: 0.03 },
      { x: -0.22, y: 0.04, rx: 0.04, ry: 0.034 },
      { x: -0.04, y: 0.06, rx: 0.035, ry: 0.028 },
    ];

    for (const spot of spots) {
      graphics.fillStyle(0x343a40, 0.9);
      graphics.fillEllipse(
        spot.x * bodyWidth,
        spot.y * bodyHeight,
        spot.rx * bodyWidth,
        spot.ry * bodyHeight,
      );
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
    sprite.setFlipX(facesLeft ? direction > 0 : direction < 0);
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
    if (type.moveStyle === 'diagonal' || type.moveStyle === 'zigzag') {
      creature.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)) * (type.moveStyle === 'zigzag' ? 0.4 : 1));
      return;
    }

    if (type.kind === 'golden_fish' && creature.usesTexture) {
      creature.setScale(creature.baseScale);
    }
  }

  drawCreature(graphics, type, direction) {
    const s = type.size;

    switch (type.kind) {
      case 'fish':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 0.55);
        graphics.fillEllipse(0, -6, s * 0.9, s * 0.45);
        graphics.lineStyle(2, type.color, 0.7);
        for (let i = -2; i <= 2; i += 1) {
          graphics.lineBetween(i * 5, 2, i * 4, s * 0.55);
        }
        graphics.fillStyle(0xffffff, 0.35);
        graphics.fillCircle(-6, -10, 4);
        break;

      case 'octopus':
        graphics.fillStyle(type.color, 1);
        graphics.fillCircle(0, -4, s * 0.38);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 8, -8, 4);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 9, -8, 2);
        for (let i = -3; i <= 3; i += 1) {
          graphics.lineStyle(3, type.color, 1);
          graphics.lineBetween(i * 5, 6, i * 7, s * 0.45);
        }
        break;

      case 'seahorse':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(direction * 4, 0, s * 0.35, s * 0.7);
        graphics.fillEllipse(-direction * 6, -s * 0.35, s * 0.22, s * 0.22);
        graphics.lineStyle(3, type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillCircle(direction * s * 0.38, -2, s * 0.24);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.44, -4, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.45, -4, 1.5);
        break;

      case 'crab':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 2, s * 0.75, s * 0.45);
        graphics.fillCircle(-s * 0.42, -2, 7);
        graphics.fillCircle(s * 0.42, -2, 7);
        graphics.lineStyle(3, type.color, 1);
        for (let i = -1; i <= 1; i += 2) {
          graphics.lineBetween(i * s * 0.35, 6, i * s * 0.55, 14);
          graphics.lineBetween(i * s * 0.35, 6, i * s * 0.15, 14);
        }
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 6, -2, 2);
        break;

      case 'crayfish':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.88, s * 0.34);
        graphics.fillTriangle(
          direction * s * 0.08, -s * 0.12,
          direction * s * 0.22, -s * 0.34,
          direction * s * 0.28, -s * 0.04
        );
        graphics.fillEllipse(direction * s * 0.44, 2, s * 0.24, s * 0.13);
        graphics.fillStyle(0xe7f5ff, 0.85);
        graphics.fillEllipse(-direction * s * 0.05, 5, s * 0.52, s * 0.12);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.16, -4, 3);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.17, -4, 1.5);
        break;

      case 'flyingfish':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(direction * 6, 0, s * 0.55, s * 0.28);
        graphics.fillEllipse(-direction * 4, -2, s * 0.35, s * 0.22);
        graphics.lineStyle(2, type.color, 1);
        graphics.lineBetween(-direction * 10, -4, -direction * 14, -10);
        graphics.lineBetween(-direction * 10, 4, -direction * 14, 10);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * 10, -2, 1.5);
        break;

      case 'ray':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 4, s, s * 0.55);
        graphics.fillTriangle(
          -direction * s * 0.45, 4,
          -direction * s * 0.75, s * 0.35,
          -direction * s * 0.15, s * 0.35
        );
        graphics.lineStyle(3, type.color, 1);
        graphics.lineBetween(0, s * 0.2, direction * s * 0.35, s * 0.55);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 12, -2, 3);
        break;

      case 'shark':
        graphics.fillStyle(0xdde2e8, 1);
        graphics.fillEllipse(-direction * 2, 4, s * 0.55, s * 0.32);
        graphics.fillStyle(type.color, 1);
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

      case 'eel':
        graphics.lineStyle(s * 0.16, type.color, 1);
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
        break;

      case 'squid':
        graphics.fillStyle(type.color, 1);
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

      case 'golden_fish':
        graphics.fillStyle(0xffec99, 1);
        graphics.fillTriangle(
          -direction * s * 0.55, 0,
          -direction * s * 0.95, -10,
          -direction * s * 0.95, 10
        );
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s, s * 0.58);
        graphics.fillStyle(0xffffff, 0.75);
        graphics.fillEllipse(-s * 0.12, -s * 0.12, s * 0.22, s * 0.14);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.26, -4, 3.5);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.28, -4, 1.5);
        graphics.lineStyle(2, 0xfff3bf, 0.9);
        graphics.strokeEllipse(0, 0, s * 0.85, s * 0.48);
        break;

      case 'wobbegong':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.9, s * 0.38);
        for (let i = -2; i <= 2; i += 1) {
          graphics.fillStyle(0x5d4037, 0.7);
          graphics.fillCircle(i * 10 - 8, (i % 2) * 4, 5);
        }
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.28, -4, 3);
        break;

      case 'makoshark':
      case 'sawshark':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(direction * 6, 0, s * 0.7, s * 0.34);
        graphics.lineStyle(2, 0xffffff, 0.9);
        for (let i = -4; i <= 4; i += 1) {
          graphics.lineBetween(-direction * s * 0.2 + i * 3, -8, -direction * s * 0.55, i * 2);
        }
        graphics.fillTriangle(-direction * s * 0.55, 0, -direction * s * 0.9, -10, -direction * s * 0.9, 10);
        break;

      case 'hammerhead':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.34);
        graphics.fillEllipse(direction * s * 0.38, -2, s * 0.22, s * 0.16);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(direction * s * 0.12, -6, s * 0.18, s * 0.1);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.34, -4, 2);
        break;

      case 'manta':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s, s * 0.62);
        graphics.fillStyle(0x78909c, 1);
        graphics.fillEllipse(0, 6, s * 0.35, s * 0.22);
        graphics.lineStyle(3, type.color, 1);
        graphics.lineBetween(-s * 0.15, s * 0.15, 0, s * 0.45);
        graphics.lineBetween(s * 0.15, s * 0.15, 0, s * 0.45);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * 14, -4, 3);
        break;

      case 'giantsquid':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(0xb0bec5, 1);
        graphics.fillEllipse(-direction * 4, 6, s * 0.62, s * 0.34);
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.75, s * 0.34);
        graphics.fillCircle(-direction * s * 0.35, -2, s * 0.2);
        graphics.fillStyle(0x868e96, 1);
        graphics.fillEllipse(-direction * s * 0.08, 6, s * 0.45, s * 0.12);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.18, -4, 2);
        break;

      case 'leopard_seal':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.38);
        graphics.fillStyle(0x3e2723, 1);
        graphics.fillRect(-direction * s * 0.42, -s * 0.12, direction * s * 0.28, s * 0.24);
        graphics.lineStyle(3, 0x8d6e63, 1);
        graphics.lineBetween(-direction * s * 0.15, -s * 0.18, direction * s * 0.2, s * 0.18);
        graphics.fillStyle(0xffeb3b, 1);
        graphics.fillCircle(direction * s * 0.22, -4, 3);
        break;

      case 'horseshoe_crab':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 2, s * 0.72, s * 0.48);
        graphics.fillStyle(0x8d6e63, 1);
        graphics.fillCircle(0, -s * 0.08, s * 0.22);
        for (let i = -2; i <= 2; i += 1) {
          graphics.lineStyle(2, 0x5d4037, 1);
          graphics.lineBetween(i * 6, s * 0.18, i * 8, s * 0.34);
        }
        break;

      case 'pufferfish':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.48);
        graphics.fillStyle(0xffec99, 1);
        graphics.fillEllipse(-s * 0.1, -s * 0.1, s * 0.2, s * 0.12);
        graphics.fillTriangle(-direction * s * 0.52, 0, -direction * s * 0.88, -10, -direction * s * 0.88, 10);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(direction * s * 0.24, -4, 3);
        break;

      case 'crocodile':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(0, 0, s * 0.82, s * 0.28);
        graphics.fillEllipse(direction * s * 0.42, -2, s * 0.28, s * 0.14);
        graphics.lineStyle(2, type.color, 1);
        for (let i = -2; i <= 3; i += 1) {
          graphics.lineBetween(direction * (10 + i * 6), 4, direction * (14 + i * 6), 10);
        }
        graphics.fillStyle(0xff6b6b, 1);
        graphics.fillCircle(direction * s * 0.44, -4, 2);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(direction * s * 0.38, -2, 2);
        break;

      case 'pistol_shrimp':
        graphics.fillStyle(type.color, 1);
        graphics.fillEllipse(direction * 4, 0, s * 0.5, s * 0.22);
        graphics.fillEllipse(-direction * 6, -2, s * 0.28, s * 0.16);
        graphics.fillStyle(0xffd43b, 1);
        graphics.fillCircle(-direction * 12, 0, 4);
        graphics.lineStyle(2, type.color, 1);
        graphics.lineBetween(-direction * 8, 4, -direction * 14, 8);
        break;

      case 'whale_shark':
        graphics.fillStyle(type.color, 1);
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
        graphics.fillStyle(type.color, 1);
        graphics.fillCircle(0, 0, s * 0.4);
        break;
    }
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.keySpace.on('down', () => {
      if (this.isGameOver || this.isQuizActive) return;
      if (!this.isCasting && !this.isReeling) this.cast();
    });

    this.keyR.on('down', () => {
      if (this.isCasting && !this.isReeling) this.startReel();
    });

    this.updateTouchControlsVisibility();
  }

  setupTimers() {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft -= 1;
        this.timerText.setText(`시간: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true,
    });
  }

  cast() {
    if (this.timeLeft <= 0) return;

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
      const goingUp = Phaser.Math.Between(0, 1) === 0;
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

    const creature = this.createCreatureEntity(x, y, type, direction);

    creature.creatureType = type;
    creature.vx = vx;
    creature.vy = vy;
    creature.bobOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);

    if (type.fleeFromHook) {
      creature.baseVx = vx;
    }

    if (type.moveStyle === 'zigzag') {
      creature.zigzagInterval = type.zigzagInterval ?? 0.6;
      creature.zigzagTimer = Phaser.Math.FloatBetween(0, creature.zigzagInterval * 0.5);
    }

    creature.setDepth(
      isSandCrawler(type) ? SAND_CRAWLER_DEPTH
        : type.kind === 'golden_fish' || type.size >= 75 ? 6
          : CREATURE_DEPTH,
    );

    this.applyCreatureSpawnMotion(creature, type, vx, vy);

    if (type.kind === 'megalodon') {
      this.registerMegalodonThreat();
    }

    this.fishes.add(creature);
  }

  registerMegalodonThreat() {
    this.megalodonThreatCount += 1;
    if (this.megalodonThreatCount === 1) {
      this.showMessage(MEGALODON_SPAWN_MESSAGE, 2800);
      this.setMegalodonWaterTint(true);
    }
  }

  unregisterMegalodonThreat() {
    if (this.megalodonThreatCount <= 0) return;

    this.megalodonThreatCount -= 1;
    if (this.megalodonThreatCount === 0) {
      this.setMegalodonWaterTint(false);
    }
  }

  paintWaterGradient(topColor, bottomColor) {
    if (!this.waterGraphics) return;

    this.waterGraphics.clear();
    this.waterGraphics.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.waterGraphics.fillRect(0, WATER_TOP, GAME_WIDTH, SAND_TOP - WATER_TOP);
  }

  setMegalodonWaterTint(active) {
    if (!this.waterGraphics) return;

    if (this.megalodonWaterTween) {
      this.megalodonWaterTween.stop();
      this.megalodonWaterTween = null;
    }

    const blendState = { blend: this.megalodonWaterBlend ?? 0 };
    const targetBlend = active ? 1 : 0;

    this.megalodonWaterTween = this.tweens.add({
      targets: blendState,
      blend: targetBlend,
      duration: active ? 650 : 900,
      ease: active ? 'Sine.easeIn' : 'Sine.easeOut',
      onUpdate: () => {
        this.megalodonWaterBlend = blendState.blend;
        const top = lerpWaterColor(WATER_GRADIENT_TOP, MEGALODON_WATER_GRADIENT_TOP, blendState.blend);
        const bottom = lerpWaterColor(WATER_GRADIENT_BOTTOM, MEGALODON_WATER_GRADIENT_BOTTOM, blendState.blend);
        this.paintWaterGradient(top, bottom);
      },
      onComplete: () => {
        this.megalodonWaterBlend = targetBlend;
      },
    });
  }

  removeCreature(creature) {
    if (creature?.creatureType?.kind === 'megalodon') {
      this.unregisterMegalodonThreat();
    }
    creature.destroy();
  }

  catchFish(fish) {
    if (!this.isCasting || this.isReeling) return;

    const { creatureType: type } = fish;

    if (type.catchChance != null && Math.random() >= type.catchChance) {
      this.escapeFromHook(fish);
      return;
    }

    const breakChance = getLineBreakChance(type);

    if (breakChance > 0 && Math.random() < breakChance) {
      this.breakLine(fish);
      return;
    }

    this.isReeling = true;
    this.caughtFish = fish;
    fish.vx = 0;
    fish.vy = 0;
    fish.setDepth(HOOK_LINE_DEPTH);
    fish.setPosition(this.hook.x, this.hook.y);
    if (fish.usesTexture) {
      fish.setScale(fish.baseScale);
      this.getCreatureSprite(fish).clearTint();
    }
    fish.angle = 0;

    const isGolden = type.kind === 'golden_fish';
    const isGiant = type.giantTier;
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

    if (this.isCasting && !this.isReeling) {
      const speed = HOOK_SPEED * dt;

      if (this.cursors.left.isDown || this.touchInput.left) this.hook.x -= speed;
      if (this.cursors.right.isDown || this.touchInput.right) this.hook.x += speed;
      if (this.cursors.up.isDown || this.touchInput.up) this.hookDepth = Math.max(40, this.hookDepth - speed);
      if (this.cursors.down.isDown || this.touchInput.down) this.hookDepth = Math.min(this.maxHookDepth, this.hookDepth + speed);

      this.updateHookPosition();
    }

    if (this.isReeling) {
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
        case 'seahorse':
          fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 20 * dt;
          break;
        case 'octopus':
        case 'squid':
        case 'giantsquid':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx)) * 0.4;
          break;
        case 'shark':
        case 'makoshark':
        case 'hammerhead':
        case 'whale_shark':
        case 'wobbegong':
        case 'orca':
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 12 * dt;
          fish.angle = Math.sin(bobTime * 3 + fish.bobOffset) * 2;
          break;
        case 'megalodon':
          fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 14 * dt;
          fish.angle = Math.sin(bobTime * 4 + fish.bobOffset) * 3;
          if (fish.usesTexture) {
            const redPulse = Math.sin(bobTime * 14 + fish.bobOffset);
            const megalodonSprite = this.getCreatureSprite(fish);
            if (redPulse > 0.45) {
              megalodonSprite.setTint(0xff3333);
            } else {
              megalodonSprite.clearTint();
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
        case 'golden_fish':
          fish.y += Math.sin(bobTime * 4 + fish.bobOffset) * 28 * dt;
          fish.setScale(fish.baseScale * (1 + Math.sin(bobTime * 8 + fish.bobOffset) * 0.1));
          fish.alpha = 0.88 + Math.sin(bobTime * 10 + fish.bobOffset) * 0.12;
          break;
        case 'eel':
          fish.angle = Math.sin(bobTime * 6 + fish.bobOffset) * 12;
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 18 * dt;
          break;
        case 'starfish':
          fish.angle = Math.sin(bobTime * 1.5 + fish.bobOffset) * 4;
          break;
        case 'dolphin':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx))
            + Math.sin(bobTime * 2 + fish.bobOffset) * 2;
          break;
        case 'flyingfish':
          fish.angle = Phaser.Math.RadToDeg(Math.atan2(fish.vy, fish.vx))
            + Math.sin(bobTime * 5 + fish.bobOffset) * 4;
          break;
        default:
          fish.angle = 0;
          break;
      }

      this.clampWaterCreatureY(fish);

      if (this.isCasting && !this.isReeling) {
        const dist = Phaser.Math.Distance.Between(this.hook.x, this.hook.y, fish.x, fish.y);
        if (dist < fish.creatureType.size * 0.45) {
          this.catchFish(fish);
        }
      }

      const horizontalMargin = Math.max(80, fish.creatureType.size + 16);
      const outOfBounds = fish.x < -horizontalMargin
        || fish.x > GAME_WIDTH + horizontalMargin
        || fish.y < WATER_TOP + 20
        || fish.y > WATER_BOTTOM + 20;

      if (outOfBounds) {
        this.removeCreature(fish);
      }
    });
  }

  finishReel() {
    if (this.caughtFish) {
      this.score += this.caughtFish.creatureType.points;
      this.scoreText.setText(`점수: ${this.score}`);
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

    if (this.quizFeedback) {
      this.quizFeedback.setText('정답을 골라 보세요');
      this.quizFeedback.setColor('#ced4da');
    }
  }

  presentQuizQuestion() {
    this.quizQuestion = pickRandomQuizQuestion();
    this.isQuizLocked = false;
    this.quizCooldownLeft = 0;
    this.clearQuizCooldownTimer();

    const categoryLabel = QUIZ_CATEGORY_LABELS[this.quizQuestion.category] ?? '';
    this.quizCategoryText.setText(`[${categoryLabel}]`);
    this.quizText.setText(this.quizQuestion.prompt);
    this.quizFeedback.setText('정답을 골라 보세요');
    this.quizFeedback.setColor('#ced4da');

    this.quizButtons.forEach(({ button }) => button.destroy());
    this.quizButtons = [];
    this.buildQuizButtons(this.quizQuestion.options);
  }

  buildQuizButtons(choices) {
    const positions = [
      { x: -95, y: 30 },
      { x: 95, y: 30 },
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
      this.quizPanel.destroy(true);
    }

    this.quizPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24);
    this.quizPanel.setDepth(102);

    const panelBg = this.add.rectangle(0, 0, 560, 228, 0x1c314a, 0.95);
    panelBg.setStrokeStyle(3, 0xffd43b);

    const quizTitle = this.add.text(0, -88, '다시 낚시하려면 문제를 풀어요!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.quizCategoryText = this.add.text(0, -60, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#91a7ff',
    }).setOrigin(0.5);

    this.quizText = this.add.text(0, -28, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.quizButtonContainer = this.add.container(0, 0);

    this.quizFeedback = this.add.text(0, 108, '정답을 골라 보세요', {
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

    this.presentQuizQuestion();
  }

  checkQuizAnswer(selected, buttonBg) {
    if (!this.isQuizActive || this.isQuizLocked) return;

    if (selected === this.quizQuestion.answer) {
      buttonBg.setFillStyle(0x40c057, 1);
      this.quizFeedback.setText('정답! 다시 낚시를 시작해요');
      this.quizFeedback.setColor('#69db7c');
      this.isQuizActive = false;
      this.clearQuizCooldownTimer();

      this.time.delayedCall(900, () => {
        this.scene.restart();
      });
      return;
    }

    buttonBg.setFillStyle(0xfa5252, 1);
    this.startQuizCooldown();

    this.time.delayedCall(500, () => {
      if (!this.isQuizActive || !this.isQuizLocked) return;
      buttonBg.setFillStyle(0x339af0, 1);
      buttonBg.setAlpha(0.45);
    });
  }

  endGame() {
    this.isGameOver = true;
    this.isCasting = false;
    this.isReeling = false;
    this.megalodonThreatCount = 0;
    this.setMegalodonWaterTint(false);
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
