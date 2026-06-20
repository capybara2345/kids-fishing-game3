import Phaser from 'phaser';

const GAME_WIDTH = 844;
const GAME_HEIGHT = 390;
const WATER_TOP = 72;
const CONTROL_ZONE_HEIGHT = 112;
const WATER_BOTTOM = GAME_HEIGHT;
const HOOK_SPEED = 280;
const REEL_SPEED = 320;
const GOLDEN_FISH_CHANCE = 0.04;
const GOLDEN_FISH = {
  kind: 'golden_fish',
  name: '황금 물고기',
  color: 0xffd43b,
  points: 100,
  speed: 180,
  size: 32,
};
const CREATURES = [
  { kind: 'fish', name: '붕어', color: 0xffa94d, points: 10, speed: 80, size: 28, weight: 18 },
  { kind: 'fish', name: '잉어', color: 0xff6b6b, points: 20, speed: 100, size: 34, weight: 16 },
  { kind: 'fish', name: '송어', color: 0x69db7c, points: 35, speed: 130, size: 30, weight: 14 },
  { kind: 'fish', name: '참치', color: 0x4dabf7, points: 50, speed: 160, size: 42, weight: 10 },
  { kind: 'jellyfish', name: '해파리', color: 0xda77f2, points: 25, speed: 55, size: 34, weight: 9 },
  { kind: 'octopus', name: '문어', color: 0x845ef7, points: 45, speed: 70, size: 38, weight: 6 },
  { kind: 'squid', name: '오징어', color: 0xf06595, points: 38, speed: 110, size: 40, weight: 8 },
  { kind: 'seahorse', name: '해마', color: 0xff922b, points: 30, speed: 65, size: 26, weight: 8 },
  { kind: 'turtle', name: '거북이', color: 0x40c057, points: 60, speed: 45, size: 44, weight: 8 },
  { kind: 'eel', name: '바다장어', color: 0x343a40, points: 40, speed: 95, size: 52, weight: 7 },
  { kind: 'crab', name: '게', color: 0xfa5252, points: 22, speed: 90, size: 30, weight: 11 },
  { kind: 'crayfish', name: '가재', color: 0xb01e1e, points: 28, speed: 75, size: 34, weight: 9 },
  { kind: 'dolphin', name: '돌고래', color: 0x339af0, points: 42, speed: 120, size: 46, weight: 7, moveStyle: 'diagonal' },
  { kind: 'flyingfish', name: '날치', color: 0x91a7ff, points: 32, speed: 140, size: 30, weight: 8, moveStyle: 'diagonal' },
  { kind: 'starfish', name: '불가사리', color: 0xff6b6b, points: 18, speed: 35, size: 28, weight: 10 },
  { kind: 'shrimp', name: '새우', color: 0xff8787, points: 15, speed: 145, size: 22, weight: 12 },
  { kind: 'ray', name: '가오리', color: 0x748ffc, points: 55, speed: 75, size: 48, weight: 5 },
  { kind: 'shark', name: '상어', color: 0x5c6773, points: 80, speed: 125, size: 68, weight: 2 },
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.score = 0;
    this.timeLeft = 90;
    this.isCasting = false;
    this.isReeling = false;
    this.isGameOver = false;
    this.isQuizActive = false;
    this.hookDepth = 0;

    this.createBackground();
    this.createDock();
    this.createFisherman();
    this.createLineAndHook();
    this.maxHookDepth = WATER_BOTTOM - this.rodTipY - 12;
    this.createUI();
    this.createTouchControls();
    this.createFishGroup();
    this.setupInput();
    this.setupTimers();

    this.showMessage('던지기 버튼으로 낚싯줄을 던지세요!', 2200);
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
    water.fillGradientStyle(0x1864ab, 0x1864ab, 0x0b7285, 0x0b7285, 1);
    water.fillRect(0, WATER_TOP, GAME_WIDTH, GAME_HEIGHT - WATER_TOP);

    for (let i = 0; i < 18; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(WATER_TOP + 40, WATER_BOTTOM - 16),
        Phaser.Math.Between(2, 6),
        0xffffff,
        0.15
      );
      this.tweens.add({
        targets: bubble,
        y: bubble.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          bubble.y = Phaser.Math.Between(WATER_TOP + 40, WATER_BOTTOM - 16);
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
    const y = WATER_TOP - 42;

    const body = this.add.rectangle(x, y + 16, 20, 28, 0x364fc7);
    const head = this.add.circle(x, y - 2, 11, 0xffd8a8);
    const hat = this.add.triangle(x, y - 12, 0, 10, -14, -6, 14, -6, 0x495057);
    const rod = this.add.line(0, 0, x + 6, y + 6, x + 52, y - 14, 0x5c4033);
    rod.setLineWidth(3);

    this.fisherman = this.add.container(0, 0, [body, head, hat, rod]);
  }

  createLineAndHook() {
    this.rodTipX = GAME_WIDTH / 2 + 52;
    this.rodTipY = WATER_TOP - 50;

    this.fishingLine = this.add.line(0, 0, this.rodTipX, this.rodTipY, this.rodTipX, this.rodTipY, 0xe9ecef);
    this.fishingLine.setLineWidth(2);

    this.hook = this.add.container(this.rodTipX, this.rodTipY);
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

    this.timerText = this.add.text(GAME_WIDTH - 12, 10, '시간: 90', {
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

    for (let i = 0; i < 4; i += 1) {
      this.spawnCreature();
    }

    this.time.addEvent({
      delay: 1200,
      callback: this.spawnCreature,
      callbackScope: this,
      loop: true,
    });
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

  spawnCreature() {
    if (this.timeLeft <= 0 || this.isGameOver) return;

    const type = this.pickCreature();
    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const direction = fromLeft ? 1 : -1;
    const x = fromLeft ? -type.size : GAME_WIDTH + type.size;
    let y = Phaser.Math.Between(WATER_TOP + 50, WATER_BOTTOM - 20);
    let vx = direction * type.speed;
    let vy = 0;

    if (type.moveStyle === 'diagonal') {
      const diagonalSpeed = type.speed * 0.707;
      const goingUp = Phaser.Math.Between(0, 1) === 0;
      vx = direction * diagonalSpeed;
      vy = goingUp ? -diagonalSpeed : diagonalSpeed;
      y = goingUp
        ? Phaser.Math.Between(WATER_BOTTOM - 120, WATER_BOTTOM - 30)
        : Phaser.Math.Between(WATER_TOP + 60, WATER_TOP + 150);
    } else if (type.kind === 'crab' || type.kind === 'starfish' || type.kind === 'crayfish') {
      y = Phaser.Math.Between(WATER_BOTTOM - 80, WATER_BOTTOM - 20);
    } else if (type.kind === 'jellyfish') {
      y = Phaser.Math.Between(WATER_TOP + 60, WATER_BOTTOM - 80);
    } else if (type.kind === 'squid') {
      y = Phaser.Math.Between(WATER_TOP + 70, WATER_BOTTOM - 60);
    } else if (type.kind === 'golden_fish') {
      y = Phaser.Math.Between(WATER_TOP + 80, WATER_BOTTOM - 40);
    } else if (type.kind === 'shark') {
      y = Phaser.Math.Between(WATER_TOP + 80, WATER_BOTTOM - 60);
    } else if (type.kind === 'turtle') {
      y = Phaser.Math.Between(WATER_TOP + 90, WATER_BOTTOM - 30);
    } else if (type.kind === 'eel') {
      y = Phaser.Math.Between(WATER_BOTTOM - 100, WATER_BOTTOM - 20);
    }

    const creature = this.add.graphics({ x, y });
    this.drawCreature(creature, type, direction);

    creature.creatureType = type;
    creature.vx = vx;
    creature.vy = vy;
    creature.bobOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    creature.setDepth(type.kind === 'golden_fish' ? 6 : 5);

    if (type.moveStyle === 'diagonal') {
      creature.setAngle(Phaser.Math.RadToDeg(Math.atan2(vy, vx)));
    } else if (type.kind === 'golden_fish') {
      creature.setScale(1);
    }

    this.fishes.add(creature);
  }

  catchFish(fish) {
    if (!this.isCasting || this.isReeling) return;

    this.isReeling = true;
    this.caughtFish = fish;
    fish.vx = 0;
    fish.vy = 0;

    const isGolden = fish.creatureType.kind === 'golden_fish';
    const flash = this.add.circle(fish.x, fish.y, isGolden ? 50 : 30, isGolden ? 0xffd43b : 0xffffff, 0.7);
    this.tweens.add({
      targets: flash,
      scale: isGolden ? 2.5 : 2,
      alpha: 0,
      duration: isGolden ? 600 : 400,
      onComplete: () => flash.destroy(),
    });

    const catchMessage = isGolden
      ? `✨ ${fish.creatureType.name} 낚았다! +${fish.creatureType.points}점 ✨`
      : `${fish.creatureType.name} 낚았다! +${fish.creatureType.points}점`;
    this.showMessage(catchMessage, isGolden ? 2000 : 1200);
  }

  updateHookPosition() {
    const x = Phaser.Math.Clamp(this.hook.x, 28, GAME_WIDTH - 28);
    const y = this.rodTipY + this.hookDepth;

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

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      switch (fish.creatureType.kind) {
        case 'jellyfish':
          fish.y += Math.sin(bobTime * 2 + fish.bobOffset) * 35 * dt;
          break;
        case 'seahorse':
          fish.y += Math.sin(bobTime * 3 + fish.bobOffset) * 20 * dt;
          break;
        case 'octopus':
          fish.angle = Math.sin(bobTime * 4 + fish.bobOffset) * 6;
          break;
        case 'squid':
          fish.y += Math.sin(bobTime * 3.5 + fish.bobOffset) * 22 * dt;
          fish.angle = Math.sin(bobTime * 5 + fish.bobOffset) * 5;
          break;
        case 'golden_fish':
          fish.y += Math.sin(bobTime * 4 + fish.bobOffset) * 28 * dt;
          fish.setScale(1 + Math.sin(bobTime * 8 + fish.bobOffset) * 0.1);
          fish.alpha = 0.88 + Math.sin(bobTime * 10 + fish.bobOffset) * 0.12;
          break;
        case 'shark':
          fish.y += Math.sin(bobTime * 2.5 + fish.bobOffset) * 12 * dt;
          fish.angle = Math.sin(bobTime * 3 + fish.bobOffset) * 2;
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
        case 'crayfish':
          fish.angle = Math.sin(bobTime * 3 + fish.bobOffset) * 3;
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

      if (this.isCasting && !this.isReeling) {
        const dist = Phaser.Math.Distance.Between(this.hook.x, this.hook.y, fish.x, fish.y);
        if (dist < fish.creatureType.size * 0.45) {
          this.catchFish(fish);
        }
      }

      const outOfBounds = fish.x < -80
        || fish.x > GAME_WIDTH + 80
        || fish.y < WATER_TOP + 20
        || fish.y > WATER_BOTTOM + 20;

      if (outOfBounds) {
        fish.destroy();
      }
    });
  }

  finishReel() {
    if (this.caughtFish) {
      this.score += this.caughtFish.creatureType.points;
      this.scoreText.setText(`점수: ${this.score}`);
      this.caughtFish.destroy();
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

  generateAdditionQuestion() {
    const a = Phaser.Math.Between(1, 9);
    const b = Phaser.Math.Between(1, Math.min(9, 10 - a));
    return { a, b, answer: a + b };
  }

  buildAnswerChoices(correctAnswer) {
    const choices = new Set([correctAnswer]);
    let guard = 0;

    while (choices.size < 4 && guard < 50) {
      guard += 1;
      const candidate = Phaser.Math.Between(0, 12);
      if (candidate !== correctAnswer) {
        choices.add(candidate);
      }
    }

    return Phaser.Utils.Array.Shuffle([...choices]);
  }

  showRestartQuiz() {
    this.isQuizActive = true;
    this.quizQuestion = this.generateAdditionQuestion();

    if (this.quizPanel) {
      this.quizPanel.destroy(true);
    }

    this.quizPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28);
    this.quizPanel.setDepth(102);

    const panelBg = this.add.rectangle(0, 0, 500, 148, 0x1c314a, 0.95);
    panelBg.setStrokeStyle(3, 0xffd43b);

    const quizTitle = this.add.text(0, -62, '다시 낚시하려면 문제를 풀어요!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.quizText = this.add.text(0, -18, `${this.quizQuestion.a} + ${this.quizQuestion.b} = ?`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '34px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.quizFeedback = this.add.text(0, 62, '정답을 골라 보세요', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ced4da',
    }).setOrigin(0.5);

    this.quizPanel.add([panelBg, quizTitle, this.quizText, this.quizFeedback]);
    this.quizButtons = [];

    const choices = this.buildAnswerChoices(this.quizQuestion.answer);
    const startX = -150;
    const gap = 100;

    choices.forEach((choice, index) => {
      const button = this.add.container(startX + index * gap, 24);
      const bg = this.add.rectangle(0, 0, 72, 52, 0x339af0, 1);
      bg.setStrokeStyle(2, 0xffffff);
      const label = this.add.text(0, 0, String(choice), {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
      }).setOrigin(0.5);

      button.add([bg, label]);
      button.setSize(72, 52);
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => {
        bg.setFillStyle(0x228be6, 1);
      });

      button.on('pointerout', () => {
        bg.setFillStyle(0x339af0, 1);
      });

      button.on('pointerdown', () => {
        this.checkQuizAnswer(choice, bg);
      });

      this.quizPanel.add(button);
      this.quizButtons.push({ button, bg, choice });
    });
  }

  checkQuizAnswer(selected, buttonBg) {
    if (!this.isQuizActive) return;

    if (selected === this.quizQuestion.answer) {
      buttonBg.setFillStyle(0x40c057, 1);
      this.quizFeedback.setText('정답! 다시 낚시를 시작해요');
      this.quizFeedback.setColor('#69db7c');
      this.isQuizActive = false;

      this.time.delayedCall(900, () => {
        this.scene.restart();
      });
      return;
    }

    buttonBg.setFillStyle(0xfa5252, 1);
    this.quizFeedback.setText('틀렸어요! 다시 골라 보세요');
    this.quizFeedback.setColor('#ff8787');

    this.time.delayedCall(500, () => {
      if (!this.isQuizActive) return;
      buttonBg.setFillStyle(0x339af0, 1);
      this.quizFeedback.setText('정답을 골라 보세요');
      this.quizFeedback.setColor('#ced4da');
    });
  }

  endGame() {
    this.isGameOver = true;
    this.isCasting = false;
    this.isReeling = false;
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
