import Phaser from 'phaser';
import { GAME_AUDIO } from '../config/gameAudio.js';
import {
  GROW_PLAYER,
  GROW_TIMINGS,
  GROW_WORLD,
  calcEatPoints,
  calcPlayerSpeed,
  isLargeGrowSpecies,
  pickGrowSpecies,
  rollFishSize,
} from '../config/fishGrowConfig.js';
import RestartQuizPanel, { setupQuizSounds } from '../systems/RestartQuizPanel.js';

const { width: GAME_WIDTH, height: GAME_HEIGHT } = GROW_WORLD;
const CONTROL_ZONE_HEIGHT = 112;
const WATER_GRADIENT_TOP = 0x0b3d66;
const WATER_GRADIENT_BOTTOM = 0x1864ab;
const DANGER_WATER_TOP = 0x9b1c1c;
const DANGER_WATER_BOTTOM = 0x5c1010;

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

function getFishRadius(size) {
  return size * 0.4;
}

function fitCircleBody(sprite, size) {
  const radius = getFishRadius(size);
  sprite.body.setCircle(
    radius,
    sprite.displayWidth / 2 - radius,
    sprite.displayHeight / 2 - radius,
  );
}

function updateSpriteFacing(sprite, vx, facing = 'left') {
  if (Math.abs(vx) <= 1) return;
  const facesLeft = facing === 'left';
  sprite.setFlipX(facesLeft ? vx > 0 : vx < 0);
}

export default class GameScene3 extends Phaser.Scene {
  constructor() {
    super('GameScene3');
  }

  create() {
    this.physics.resume();

    this.score = 0;
    this.playerSize = GROW_PLAYER.startSize;
    this.isGameOver = false;
    this.isQuizActive = false;
    this.eatCount = 0;
    this.largeFishThreatCount = 0;
    this.waterDangerBlend = 0;
    this.waterDangerTween = null;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.buildOcean();
    this.createPlayer();
    this.createFishGroup();
    this.buildHud();
    this.buildTouchControls();
    this.setupAudio();
    setupQuizSounds(this);

    this.restartQuiz = new RestartQuizPanel(this, {
      panelTitle: '다시 플레이하려면 문제를 풀어요!',
      successMessage: '정답! 다시 시작해요',
      drawSuccessMessage: '완료! 다시 시작해요',
      onSuccess: () => this.restartAfterQuiz(),
    });

    this.spawnTimer = this.time.addEvent({
      delay: GROW_TIMINGS.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnOceanFish(),
    });

    this.time.delayedCall(400, () => {
      this.spawnOceanFish();
      this.spawnOceanFish();
    });
  }

  setupAudio() {
    this.bgm = this.sound.add(GAME_AUDIO.bgm.key, {
      loop: GAME_AUDIO.bgm.loop,
      volume: GAME_AUDIO.bgm.volume * 0.75,
    });
    this.catchSound = this.sound.add(GAME_AUDIO.catch.key, {
      volume: GAME_AUDIO.catch.volume * 0.7,
    });
    this.escapeSound = this.sound.add(GAME_AUDIO.fishEscape.key, {
      volume: GAME_AUDIO.fishEscape.volume,
    });
    this.apexSpawnSound = this.sound.add(GAME_AUDIO.apexSpawn.key, {
      volume: GAME_AUDIO.apexSpawn.volume,
    });

    if (this.sound.locked) {
      this.sound.once('unlocked', () => this.bgm?.play());
    } else {
      this.bgm?.play();
    }
  }

  buildOcean() {
    this.waterGraphics = this.add.graphics().setDepth(0);
    this.paintWaterGradient(WATER_GRADIENT_TOP, WATER_GRADIENT_BOTTOM);

    this.bubbleGfx = this.add.graphics().setDepth(1);
    this.drawBubbles(0);
  }

  paintWaterGradient(topColor, bottomColor) {
    if (!this.waterGraphics) return;
    this.waterGraphics.clear();
    this.waterGraphics.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.waterGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  setDangerWaterTint(active) {
    if (!this.waterGraphics) return;

    if (this.waterDangerTween) {
      this.waterDangerTween.stop();
      this.waterDangerTween = null;
    }

    const blendState = { blend: this.waterDangerBlend ?? 0 };
    const targetBlend = active ? 1 : 0;

    this.waterDangerTween = this.tweens.add({
      targets: blendState,
      blend: targetBlend,
      duration: active ? 650 : 900,
      ease: active ? 'Sine.easeIn' : 'Sine.easeOut',
      onUpdate: () => {
        this.waterDangerBlend = blendState.blend;
        const top = lerpWaterColor(WATER_GRADIENT_TOP, DANGER_WATER_TOP, blendState.blend);
        const bottom = lerpWaterColor(WATER_GRADIENT_BOTTOM, DANGER_WATER_BOTTOM, blendState.blend);
        this.paintWaterGradient(top, bottom);
      },
      onComplete: () => {
        this.waterDangerBlend = targetBlend;
      },
    });
  }

  playApexSpawnSound() {
    if (this.sound.locked) this.sound.unlock();
    this.apexSpawnSound?.stop();
    this.apexSpawnSound?.play();
  }

  showLargeFishWarning(message) {
    if (this.warningText) {
      this.warningText.destroy();
      this.tweens.killTweensOf(this.warningText);
    }

    this.warningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 72, message, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: this.warningText,
      alpha: 0,
      delay: 2200,
      duration: 700,
      onComplete: () => {
        this.warningText?.destroy();
        this.warningText = null;
      },
    });
  }

  registerLargeFishThreat(species, fish) {
    if (!isLargeGrowSpecies(species) || fish.getData('threatRegistered')) return;

    fish.setData('threatRegistered', true);
    fish.setData('isLargeThreat', true);
    const wasEmpty = this.largeFishThreatCount === 0;
    this.largeFishThreatCount += 1;

    if (wasEmpty) {
      this.setDangerWaterTint(true);
      this.playApexSpawnSound();
    }
    this.showLargeFishWarning(species.warningMessage ?? `${species.name}가 나타났다!`);
  }

  releaseLargeFishThreat(fish) {
    if (!fish?.getData('isLargeThreat') || fish.getData('threatReleased')) return;

    fish.setData('threatReleased', true);
    this.largeFishThreatCount = Math.max(0, this.largeFishThreatCount - 1);

    if (this.largeFishThreatCount === 0) {
      this.setDangerWaterTint(false);
    }
  }

  drawBubbles(time) {
    this.bubbleGfx.clear();
    this.bubbleGfx.fillStyle(0xffffff, 0.07);
    for (let i = 0; i < 10; i += 1) {
      const x = (i * 97 + time * 40) % GAME_WIDTH;
      const y = ((i * 53 + time * 25) % GAME_HEIGHT);
      this.bubbleGfx.fillCircle(x, y, 3 + (i % 3));
    }
  }

  createPlayer() {
    const startX = GAME_WIDTH * 0.42;
    const startY = GAME_HEIGHT * 0.55;

    this.player = this.physics.add.image(startX, startY, GROW_PLAYER.texture);
    this.player.setTint(GROW_PLAYER.tint);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.applyPlayerSize();
  }

  createFishGroup() {
    this.fishes = this.physics.add.group();
  }

  applyPlayerSize() {
    const height = this.playerSize * 0.72;
    this.player.setDisplaySize(this.playerSize, height);
    fitCircleBody(this.player, this.playerSize);
    this.playerSpeed = calcPlayerSpeed(this.playerSize);
    if (this.sizeText) {
      this.sizeText.setText(`크기: ${Math.round(this.playerSize)}`);
    }
  }

  applySpeciesSprite(sprite, species, size) {
    const height = size * (species.aspect ?? 0.72);
    sprite.setTexture(species.texture);
    sprite.setDisplaySize(size, height);
    if (species.useTint && species.color != null) {
      sprite.setTint(species.color);
    } else {
      sprite.clearTint();
    }
  }

  spawnOceanFish() {
    if (this.isGameOver || this.isQuizActive) return;
    if (this.fishes.countActive(true) >= GROW_TIMINGS.maxFishOnScreen) return;

    const species = pickGrowSpecies();
    const size = Math.max(14, rollFishSize(species, this.playerSize));
    const spawn = this.getSpawnPoint();
    const fish = this.fishes.create(spawn.x, spawn.y, species.texture);
    fish.setDepth(5);
    fish.setData('size', size);
    fish.setData('species', species);

    this.applySpeciesSprite(fish, species, size);
    fitCircleBody(fish, size);

    const angle = Phaser.Math.Angle.Between(spawn.x, spawn.y, spawn.targetX, spawn.targetY);
    const speed = species.speed * Phaser.Math.FloatBetween(0.85, 1.15);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    fish.setVelocity(vx, vy);
    updateSpriteFacing(fish, vx, species.textureFacing ?? 'left');

    if (isLargeGrowSpecies(species) && size > this.playerSize) {
      this.registerLargeFishThreat(species, fish);
    }
  }

  getSpawnPoint() {
    const margin = 40;
    const edge = Phaser.Math.Between(0, 3);
    const targetX = Phaser.Math.Between(margin, GAME_WIDTH - margin);
    const targetY = Phaser.Math.Between(margin, GAME_HEIGHT - margin);

    switch (edge) {
      case 0:
        return { x: -margin, y: targetY, targetX: GAME_WIDTH + margin, targetY };
      case 1:
        return { x: GAME_WIDTH + margin, y: targetY, targetX: -margin, targetY };
      case 2:
        return { x: targetX, y: -margin, targetX, targetY: GAME_HEIGHT + margin };
      default:
        return { x: targetX, y: GAME_HEIGHT + margin, targetX, targetY: -margin };
    }
  }

  resolveFishCollision(fish) {
    if (!fish?.active || fish.getData('collisionResolved') || this.isGameOver || this.isQuizActive) {
      return;
    }

    const fishSize = fish.getData('size');
    fish.setData('collisionResolved', true);

    if (fishSize <= this.playerSize) {
      this.eatFish(fish);
      return;
    }

    this.triggerGameOver(fish.getData('species')?.name ?? '큰 물고기');
  }

  checkFishCollisions() {
    const playerRadius = getFishRadius(this.playerSize);

    this.fishes.getChildren().forEach((fish) => {
      if (!fish.active || fish.getData('collisionResolved')) return;

      const fishSize = fish.getData('size');
      const fishRadius = getFishRadius(fishSize);
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.x, fish.y);

      if (dist <= playerRadius + fishRadius) {
        this.resolveFishCollision(fish);
      }
    });
  }

  eatFish(fish) {
    if (!fish?.active) return;
    const fishSize = fish.getData('size');
    const points = calcEatPoints(fishSize);
    this.score += points;
    this.eatCount += 1;
    this.playerSize = Math.min(GROW_PLAYER.maxSize, this.playerSize + GROW_PLAYER.growthPerBite);
    this.applyPlayerSize();

    if (this.scoreText) this.scoreText.setText(`점수: ${this.score}`);
    this.playEatSound();
    this.flashEatEffect(fish.x, fish.y);
    this.releaseLargeFishThreat(fish);
    fish.destroy();

    if (this.eatCount % 3 === 0) {
      this.spawnOceanFish();
    }
  }

  playEatSound() {
    if (this.sound.locked) this.sound.unlock();
    this.catchSound?.play();
  }

  flashEatEffect(x, y) {
    const ring = this.add.circle(x, y, 8, 0xffffff, 0.35).setDepth(12);
    this.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
  }

  clearGameOverOverlay() {
    this.restartQuiz?.destroy();
    this.children.list.slice().forEach((child) => {
      if (child.depth >= 100) {
        child.destroy();
      }
    });
  }

  restartAfterQuiz() {
    this.clearGameOverOverlay();

    if (this.warningText) {
      this.tweens.killTweensOf(this.warningText);
      this.warningText.destroy();
      this.warningText = null;
    }

    this.isGameOver = false;
    this.isQuizActive = false;
    this.score = 0;
    this.eatCount = 0;
    this.playerSize = GROW_PLAYER.startSize;
    this.largeFishThreatCount = 0;
    this.waterDangerBlend = 0;

    if (this.waterDangerTween) {
      this.waterDangerTween.stop();
      this.waterDangerTween = null;
    }
    this.paintWaterGradient(WATER_GRADIENT_TOP, WATER_GRADIENT_BOTTOM);

    this.player.setPosition(GAME_WIDTH * 0.42, GAME_HEIGHT * 0.55);
    this.player.setVelocity(0);
    this.player.setActive(true).setVisible(true);
    this.applyPlayerSize();

    this.fishes.clear(true, true);
    this.scoreText?.setText('점수: 0');

    this.spawnTimer?.remove(false);
    this.spawnTimer = this.time.addEvent({
      delay: GROW_TIMINGS.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnOceanFish(),
    });

    this.time.delayedCall(400, () => {
      this.spawnOceanFish();
      this.spawnOceanFish();
    });

    if (this.bgm && !this.bgm.isPlaying) {
      this.bgm.play();
    }
  }

  triggerGameOver(eaterName) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.spawnTimer?.remove(false);
    this.clearTouchInput();
    this.destroyLargeFishThreats();
    this.player.setVelocity(0);
    this.fishes.getChildren().forEach((fish) => fish.setVelocity(0));

    if (this.sound.locked) this.sound.unlock();
    this.escapeSound?.play();
    if (this.bgm?.isPlaying) this.bgm.stop();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setDepth(100);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, '잡아먹혔어요!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '34px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, `${eaterName}에게 잡혔습니다`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ced4da',
    }).setOrigin(0.5).setDepth(101);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, `최종 점수: ${this.score}  |  크기: ${Math.round(this.playerSize)}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffd43b',
    }).setOrigin(0.5).setDepth(101);

    this.restartQuiz.show();
  }

  buildHud() {
    this.scoreText = this.add.text(16, 14, '점수: 0', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);

    this.sizeText = this.add.text(16, 42, `크기: ${Math.round(this.playerSize)}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(20);

    this.add.text(GAME_WIDTH / 2, 14, '작은 물고기를 먹고 커지세요!  |  오른쪽: 방향', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(20);

    this.add.text(GAME_WIDTH - 16, 14, '물고기 키우기', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(20);

    this.menuButton = this.add.text(16, GAME_HEIGHT - 28, '← 메뉴', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ced4da',
    }).setDepth(20).setInteractive({ useHandCursor: true });
    this.menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  buildTouchControls() {
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

    this.touchUI.add(this.dpad);
    this.cursors = this.input.keyboard?.createCursorKeys();
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

  clearTouchInput() {
    if (!this.touchInput) return;
    this.touchInput.left = false;
    this.touchInput.right = false;
    this.touchInput.up = false;
    this.touchInput.down = false;
  }

  update(time, delta) {
    if (this.isGameOver || this.isQuizActive) return;

    this.drawBubbles(time * 0.001);
    this.movePlayer();
    this.checkFishCollisions();
    this.updateFishFacing();
    this.cleanupOffscreenFish();
  }

  updateFishFacing() {
    this.fishes.getChildren().forEach((fish) => {
      const species = fish.getData('species');
      if (!species || !fish.body) return;
      updateSpriteFacing(fish, fish.body.velocity.x, species.textureFacing ?? 'left');
    });
  }

  movePlayer() {
    let vx = 0;
    let vy = 0;

    if (this.cursors?.left.isDown || this.touchInput.left) vx = -this.playerSpeed;
    if (this.cursors?.right.isDown || this.touchInput.right) vx = this.playerSpeed;
    if (this.cursors?.up.isDown || this.touchInput.up) vy = -this.playerSpeed;
    if (this.cursors?.down.isDown || this.touchInput.down) vy = this.playerSpeed;

    if (vx !== 0 && vy !== 0) {
      const scale = Math.SQRT1_2;
      vx *= scale;
      vy *= scale;
    }

    this.player.setVelocity(vx, vy);
    updateSpriteFacing(this.player, vx, GROW_PLAYER.textureFacing);
  }

  cleanupOffscreenFish() {
    const margin = 80;
    this.fishes.getChildren().forEach((fish) => {
      if (
        fish.x < -margin
        || fish.x > GAME_WIDTH + margin
        || fish.y < -margin
        || fish.y > GAME_HEIGHT + margin
      ) {
        this.releaseLargeFishThreat(fish);
        fish.destroy();
      }
    });
  }

  destroyLargeFishThreats() {
    this.fishes.getChildren().forEach((fish) => this.releaseLargeFishThreat(fish));
    this.largeFishThreatCount = 0;
    this.setDangerWaterTint(false);
  }

  shutdown() {
    this.spawnTimer?.remove(false);
    if (this.waterDangerTween) {
      this.waterDangerTween.stop();
      this.waterDangerTween = null;
    }
    this.clearTouchInput();
    this.restartQuiz?.clearRestartDelayTimer();
    this.restartQuiz?.destroy();
    this.bgm?.stop();
  }
}
