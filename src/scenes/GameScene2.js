import Phaser from 'phaser';
import { GAME_AUDIO, stopGameBgm } from '../config/gameAudio.js';
import {
  FISHING2_FISH,
  FISHING2_LAYOUT,
  FISHING2_PHASE,
  FISHING2_TIMINGS,
  getFishing2TrackLayout,
  getFish2DisplayHeight,
  pickRandomFish2,
} from '../config/fishingGame2Config.js';

const GAME_WIDTH = 844;
const GAME_HEIGHT = 390;
const HORIZON_Y = 118;
const DOCK_TOP = 248;
const FISHERMAN_X = 148;
const DOCK_EXTEND_RIGHT = 20;
const DOCK_BACK_EDGE_X = FISHERMAN_X + DOCK_EXTEND_RIGHT;
const DOCK_COLOR_MAIN = 0x8d6e63;
const DOCK_COLOR_EDGE = 0x6d4c41;
const CATCH_PILE_BASE_X = 98;
const CATCH_PILE_BASE_Y = DOCK_TOP + 48;
const CATCH_PILE_STACK_OFFSET_Y = 8;
const CATCH_FISH_DISPLAY_WIDTH = 14;
const MAX_CAST_DISTANCE = 420;
const MIN_CAST_DISTANCE = 120;

export default class GameScene2 extends Phaser.Scene {
  constructor() {
    super('GameScene2');
  }

  create() {
    this.score = 0;
    this.phase = FISHING2_PHASE.IDLE;
    this.power = 0;
    this.castDistance = 0;
    this.bobberX = 0;
    this.bobberY = 0;
    this.currentFish = null;
    this.fightProgress = 0;
    this.fightTimeLeft = 0;
    this.reelTimeLeft = 0;
    this.fishTrackY = 0;
    this.fishTargetY = 0;
    this.playerBarY = 0;
    this.playerBarVelocity = 0;
    this.fishMoveTimer = 0;
    this.isFightHolding = false;
    this.caughtFishCount = 0;

    this.setupAudio();
    this.buildWorld();
    this.buildHud();
    this.buildFightUi();
    this.bindInput();
    this.setPhase(FISHING2_PHASE.IDLE);
    this.startBgm();
  }

  setupAudio() {
    this.bgm = this.sound.add(GAME_AUDIO.bgm.key, {
      loop: GAME_AUDIO.bgm.loop,
      volume: GAME_AUDIO.bgm.volume * 0.85,
    });
    this.castSound = this.sound.add(GAME_AUDIO.cast.key, {
      volume: GAME_AUDIO.cast.volume,
    });
    this.catchSound = this.sound.add(GAME_AUDIO.catch.key, {
      volume: GAME_AUDIO.catch.volume,
    });
    this.biteSound = this.sound.add(GAME_AUDIO.bite.key, {
      volume: GAME_AUDIO.bite.volume,
    });
    this.fishEscapeSound = this.sound.add(GAME_AUDIO.fishEscape.key, {
      volume: GAME_AUDIO.fishEscape.volume,
    });
  }

  startBgm() {
    if (this.sound.locked) {
      if (!this.onBgmUnlocked) {
        this.onBgmUnlocked = () => this.bgm?.play();
      }
      this.sound.once('unlocked', this.onBgmUnlocked);
      return;
    }
    if (this.bgm && !this.bgm.isPlaying) {
      this.bgm.play();
    }
  }

  playCastSound() {
    if (this.sound.locked) this.sound.unlock();
    this.castSound?.stop();
    this.castSound?.play();
  }

  playCatchSound() {
    if (this.sound.locked) this.sound.unlock();
    this.catchSound?.play();
  }

  playBiteSound() {
    if (this.sound.locked) this.sound.unlock();
    this.biteSound?.stop();
    this.biteSound?.play();
  }

  playFishEscapeSound() {
    if (this.sound.locked) this.sound.unlock();
    this.fishEscapeSound?.stop();
    this.fishEscapeSound?.play();
  }

  buildWorld() {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x74c0fc, 0x74c0fc, 0xa5d8ff, 0xa5d8ff, 1);
    sky.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);

    const shoreMidY = HORIZON_Y + (DOCK_TOP - HORIZON_Y) / 2;
    const waterMidY = (DOCK_TOP + GAME_HEIGHT) / 2;
    const shoreHeight = DOCK_TOP - HORIZON_Y;
    const waterHeight = GAME_HEIGHT - DOCK_TOP;
    const waterWidth = GAME_WIDTH - DOCK_BACK_EDGE_X;
    const waterCenterX = DOCK_BACK_EDGE_X + waterWidth / 2;

    this.add.rectangle(DOCK_BACK_EDGE_X / 2, shoreMidY, DOCK_BACK_EDGE_X, shoreHeight, DOCK_COLOR_EDGE).setDepth(3);
    this.add.rectangle(DOCK_BACK_EDGE_X / 2, waterMidY, DOCK_BACK_EDGE_X, waterHeight, DOCK_COLOR_MAIN).setDepth(3);
    this.add.rectangle(waterCenterX, shoreMidY, waterWidth, shoreHeight, 0x228be6).setDepth(2);
    this.add.rectangle(waterCenterX, waterMidY, waterWidth, waterHeight, 0x1864ab).setDepth(2);
    this.add.rectangle(DOCK_BACK_EDGE_X, waterMidY, 4, waterHeight, 0x5c4033).setDepth(4);

    this.waveGfx = this.add.graphics().setDepth(2);
    this.drawWaves(0);

    this.fisherman = this.add.container(FISHERMAN_X, DOCK_TOP - 8).setDepth(5);
    const body = this.add.rectangle(0, 18, 28, 44, 0x364fc7);
    const head = this.add.circle(0, -14, 16, 0xffd8a8);
    const legL = this.add.rectangle(-8, 48, 10, 28, 0x343a40);
    const legR = this.add.rectangle(8, 48, 10, 28, 0x343a40);
    this.fisherman.add([legL, legR, body, head]);

    this.caughtFishPile = this.add.container(0, 0).setDepth(5);

    this.rodGfx = this.add.graphics().setDepth(6);
    this.bobber = this.add.circle(FISHERMAN_X, DOCK_TOP + 30, 7, 0xff6b6b).setDepth(6).setStrokeStyle(2, 0xffffff);
    this.bobber.setVisible(false);

    this.biteMark = this.add.text(0, 0, '!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '42px',
      color: '#ff6b6b',
      stroke: '#ffffff',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8).setVisible(false);

    this.add.text(GAME_WIDTH - 16, 16, '3인칭 낚시', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(20);
  }

  drawWaves(offset) {
    this.waveGfx.clear();
    this.waveGfx.fillStyle(0xffffff, 0.08);
    for (let i = 0; i < 6; i += 1) {
      const y = HORIZON_Y + 36 + i * 28 + Math.sin(offset + i) * 4;
      const x = DOCK_BACK_EDGE_X + 100 + i * 72;
      this.waveGfx.fillEllipse(x, y, 160, 10);
    }
  }

  applyFishSprite(sprite, fish, displayWidth) {
    const displayHeight = getFish2DisplayHeight(fish, displayWidth);
    sprite.setTexture(fish.texture);
    sprite.setDisplaySize(displayWidth, displayHeight);
    if (fish.useTint && fish.color != null) {
      sprite.setTint(fish.color);
    } else {
      sprite.clearTint();
    }
    sprite.setFlipX(fish.flipX ?? false);
    return displayHeight;
  }

  buildHud() {
    this.scoreText = this.add.text(16, 14, '점수: 0', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20);

    this.statusText = this.add.text(GAME_WIDTH / 2, 22, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(20);

    this.powerGaugeBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 36, 280, 22, 0x1c314a, 0.9)
      .setStrokeStyle(2, 0xffffff).setDepth(20).setVisible(false);
    this.powerGaugeFill = this.add.rectangle(GAME_WIDTH / 2 - 138, GAME_HEIGHT - 36, 0, 16, 0x51cf66, 1)
      .setOrigin(0, 0.5).setDepth(21).setVisible(false);
    this.powerGaugeLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 62, '파워 게이지 — 떼면 던짐', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#ffd43b',
    }).setOrigin(0.5).setDepth(21).setVisible(false);

    this.menuButton = this.add.text(16, GAME_HEIGHT - 28, '← 메뉴', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ced4da',
    }).setDepth(20).setInteractive({ useHandCursor: true });
    this.menuButton.on('pointerdown', () => {
      stopGameBgm(this.sound);
      if (this.onBgmUnlocked) {
        this.sound.off('unlocked', this.onBgmUnlocked);
      }
      this.scene.start('MenuScene');
    });
  }

  buildFightUi() {
    const trackCenterY = GAME_HEIGHT / 2;
    const { trackWidth, trackHeight, progressBarWidth } = FISHING2_LAYOUT;
    const { trackCenterX, progressCenterX } = getFishing2TrackLayout(GAME_WIDTH);

    this.fightUi = this.add.container(0, 0).setDepth(30).setVisible(false);

    const panelBg = this.add.rectangle(trackCenterX, trackCenterY, trackWidth + 28, trackHeight + 80, 0x1c314a, 0.92)
      .setStrokeStyle(2, 0xffd43b);
    const trackBg = this.add.rectangle(trackCenterX, trackCenterY, trackWidth, trackHeight, 0x0b1d33, 1)
      .setStrokeStyle(2, 0x495057);

    this.fightTrackTop = trackCenterY - trackHeight / 2;
    this.fightTrackBottom = trackCenterY + trackHeight / 2;
    this.fightTrackCenterX = trackCenterX;

    this.playerZoneGfx = this.add.rectangle(
      trackCenterX,
      trackCenterY,
      trackWidth - 8,
      FISHING2_LAYOUT.playerZoneHeight,
      0x51cf66,
      0.45,
    ).setStrokeStyle(2, 0x40c057);

    this.fishIcon = this.add.image(trackCenterX, trackCenterY, 'creature_normal_fish');
    this.applyFishSprite(this.fishIcon, FISHING2_FISH[0], FISHING2_LAYOUT.fishIconSize);

    this.fightProgressBg = this.add.rectangle(progressCenterX, trackCenterY, progressBarWidth, trackHeight, 0x343a40, 1);
    this.fightProgressFill = this.add.rectangle(
      progressCenterX,
      trackCenterY + trackHeight / 2,
      progressBarWidth,
      0,
      0x339af0,
      1,
    ).setOrigin(0.5, 0);

    this.fightHint = this.add.text(trackCenterX, this.fightTrackBottom + 36, '클릭 유지로 막대를 올려 물고기에 맞추세요!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#ced4da',
      align: 'center',
      wordWrap: { width: 200 },
    }).setOrigin(0.5, 0);

    this.fightTimerText = this.add.text(trackCenterX, this.fightTrackTop - 24, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    this.fightUi.add([
      panelBg,
      trackBg,
      this.playerZoneGfx,
      this.fishIcon,
      this.fightProgressBg,
      this.fightProgressFill,
      this.fightHint,
      this.fightTimerText,
    ]);
  }

  bindInput() {
    this.input.on('pointerdown', () => this.onPointerDown());
    this.input.on('pointerup', () => this.onPointerUp());
  }

  onPointerDown() {
    if (this.phase === FISHING2_PHASE.FIGHTING) {
      this.isFightHolding = true;
      return;
    }
    if (this.phase === FISHING2_PHASE.IDLE) {
      this.setPhase(FISHING2_PHASE.CHARGING);
      return;
    }
    if (this.phase === FISHING2_PHASE.BITE) {
      this.isFightHolding = true;
      this.startFighting();
    }
  }

  onPointerUp() {
    this.isFightHolding = false;
    if (this.phase === FISHING2_PHASE.CHARGING) {
      this.releaseCast();
    }
  }

  setPhase(nextPhase) {
    this.phase = nextPhase;

    this.powerGaugeBg.setVisible(nextPhase === FISHING2_PHASE.CHARGING);
    this.powerGaugeFill.setVisible(nextPhase === FISHING2_PHASE.CHARGING);
    this.powerGaugeLabel.setVisible(nextPhase === FISHING2_PHASE.CHARGING);
    this.fightUi.setVisible(nextPhase === FISHING2_PHASE.FIGHTING);
    this.biteMark.setVisible(nextPhase === FISHING2_PHASE.BITE);

    switch (nextPhase) {
      case FISHING2_PHASE.IDLE:
        this.statusText.setText('화면을 눌러 파워를 모은 뒤 떼면 던집니다');
        this.bobber.setVisible(false);
        this.biteMark.setVisible(false);
        this.power = 0;
        this.updatePowerGauge();
        this.drawRodLine(FISHERMAN_X, DOCK_TOP - 20);
        break;
      case FISHING2_PHASE.CHARGING:
        this.statusText.setText('파워 게이지를 채우세요!');
        this.power = 0;
        break;
      case FISHING2_PHASE.CASTING:
        this.statusText.setText('낚시줄을 던지는 중...');
        break;
      case FISHING2_PHASE.WAITING:
        this.statusText.setText('입질을 기다리는 중...');
        this.bobber.setVisible(true);
        this.scheduleBite();
        break;
      case FISHING2_PHASE.BITE:
        this.statusText.setText('입질! 빨리 클릭해서 낚시줄을 당기세요!');
        this.reelTimeLeft = FISHING2_TIMINGS.reelWindowMs;
        this.positionBiteMark();
        this.playBiteSound();
        this.tweens.add({
          targets: this.biteMark,
          scale: { from: 0.8, to: 1.2 },
          duration: 280,
          yoyo: true,
          repeat: -1,
        });
        break;
      case FISHING2_PHASE.FIGHTING:
        this.statusText.setText('물고기를 막대 안에 맞추세요!');
        this.biteMark.setVisible(false);
        this.tweens.killTweensOf(this.biteMark);
        this.biteMark.setScale(1);
        this.initFightMiniGame();
        break;
      case FISHING2_PHASE.CAUGHT:
        this.statusText.setText(`${this.currentFish.name} 낚음! +${this.currentFish.points}점`);
        this.playCatchSound();
        this.time.delayedCall(FISHING2_TIMINGS.caughtDisplayMs, () => {
          if (this.phase === FISHING2_PHASE.CAUGHT) this.setPhase(FISHING2_PHASE.IDLE);
        });
        break;
      case FISHING2_PHASE.ESCAPED:
        this.statusText.setText('물고기가 도망갔어요...');
        this.biteMark.setVisible(false);
        this.tweens.killTweensOf(this.biteMark);
        this.playFishEscapeSound();
        this.time.delayedCall(FISHING2_TIMINGS.escapedDisplayMs, () => {
          if (this.phase === FISHING2_PHASE.ESCAPED) this.setPhase(FISHING2_PHASE.IDLE);
        });
        break;
      default:
        break;
    }
  }

  releaseCast() {
    if (this.power < 0.08) {
      this.setPhase(FISHING2_PHASE.IDLE);
      return;
    }

    this.castDistance = MIN_CAST_DISTANCE + (MAX_CAST_DISTANCE - MIN_CAST_DISTANCE) * this.power;
    this.bobberX = FISHERMAN_X + this.castDistance * 0.92;
    this.bobberY = DOCK_TOP + 24 + this.castDistance * 0.08;
    this.setPhase(FISHING2_PHASE.CASTING);
    this.playCastSound();

    this.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: FISHING2_TIMINGS.castAnimMs,
      onUpdate: (tween) => {
        const t = tween.getValue();
        const x = Phaser.Math.Linear(FISHERMAN_X, this.bobberX, t);
        const y = Phaser.Math.Linear(DOCK_TOP - 20, this.bobberY, t);
        this.bobber.setPosition(x, y);
        this.bobber.setVisible(true);
        this.drawRodLine(x, y);
      },
      onComplete: () => {
        this.setPhase(FISHING2_PHASE.WAITING);
      },
    });
  }

  scheduleBite() {
    const delay = Phaser.Math.Between(FISHING2_TIMINGS.biteWaitMin, FISHING2_TIMINGS.biteWaitMax);
    this.biteTimer?.remove(false);
    this.biteTimer = this.time.delayedCall(delay, () => {
      if (this.phase === FISHING2_PHASE.WAITING) {
        this.currentFish = pickRandomFish2();
        this.setPhase(FISHING2_PHASE.BITE);
      }
    });
  }

  positionBiteMark() {
    this.biteMark.setPosition(this.bobberX, this.bobberY - 34);
  }

  startFighting() {
    if (this.phase !== FISHING2_PHASE.BITE) return;
    this.biteTimer?.remove(false);
    this.setPhase(FISHING2_PHASE.FIGHTING);
  }

  initFightMiniGame() {
    const margin = FISHING2_LAYOUT.playerZoneHeight / 2 + 4;
    const mid = (this.fightTrackTop + this.fightTrackBottom) / 2;

    this.fightProgress = 0;
    this.fightTimeLeft = FISHING2_TIMINGS.fightTimeLimitMs;
    this.fishTrackY = mid;
    this.fishTargetY = mid;
    this.playerBarY = mid;
    this.playerBarVelocity = 0;
    this.fishMoveTimer = 0;
    this.isFightHolding = false;
    this.scheduleNextFishTarget();

    this.applyFishSprite(this.fishIcon, this.currentFish, FISHING2_LAYOUT.fishIconSize);
    this.fishIcon.y = this.fishTrackY;
    this.playerZoneGfx.y = this.playerBarY;
    this.updateFightProgressBar();
  }

  scheduleNextFishTarget() {
    const margin = FISHING2_LAYOUT.fishIconSize / 2 + 6;
    this.fishTargetY = Phaser.Math.Between(
      this.fightTrackTop + margin,
      this.fightTrackBottom - margin,
    );
    this.fishMoveDelay = Phaser.Math.Between(
      FISHING2_LAYOUT.fishMoveIntervalMin,
      FISHING2_LAYOUT.fishMoveIntervalMax,
    );
    this.fishMoveTimer = 0;
  }

  drawRodLine(endX, endY) {
    const startX = 168;
    const startY = DOCK_TOP - 28;
    this.rodGfx.clear();
    this.rodGfx.lineStyle(3, 0x5c3d2e, 1);
    this.rodGfx.beginPath();
    this.rodGfx.moveTo(startX, startY);
    this.rodGfx.lineTo(endX, endY);
    this.rodGfx.strokePath();
  }

  updatePowerGauge() {
    this.powerGaugeFill.width = 276 * this.power;
  }

  updateFightProgressBar() {
    const h = (FISHING2_LAYOUT.trackHeight * this.fightProgress) / 100;
    this.fightProgressFill.setOrigin(0.5, 0);
    this.fightProgressFill.setSize(FISHING2_LAYOUT.progressBarWidth, Math.max(0, h));
    this.fightProgressFill.y = this.fightTrackBottom - h;
  }

  isPlayerOnFish() {
    const zoneHalf = FISHING2_LAYOUT.playerZoneHeight / 2;
    const fishHalf = getFish2DisplayHeight(this.currentFish ?? FISHING2_FISH[0], FISHING2_LAYOUT.fishIconSize) / 2;
    return Math.abs(this.playerBarY - this.fishTrackY) <= zoneHalf + fishHalf - 6;
  }

  escapeFish() {
    if (this.phase === FISHING2_PHASE.BITE || this.phase === FISHING2_PHASE.FIGHTING) {
      this.biteTimer?.remove(false);
      this.setPhase(FISHING2_PHASE.ESCAPED);
    }
  }

  catchFish() {
    this.score += this.currentFish.points;
    this.scoreText.setText(`점수: ${this.score}`);
    this.addCaughtFishToPile(this.currentFish);
    this.setPhase(FISHING2_PHASE.CAUGHT);
  }

  addCaughtFishToPile(fish) {
    const index = this.caughtFishCount;
    const x = CATCH_PILE_BASE_X;
    const y = CATCH_PILE_BASE_Y - index * CATCH_PILE_STACK_OFFSET_Y;
    const targetWidth = CATCH_FISH_DISPLAY_WIDTH;
    const targetHeight = getFish2DisplayHeight(fish, targetWidth);

    const fishSprite = this.add.image(x, y, fish.texture);
    this.applyFishSprite(fishSprite, fish, targetWidth * 0.4);
    fishSprite.setAngle(Phaser.Math.Between(-5, 5));

    this.caughtFishPile.add(fishSprite);
    this.caughtFishCount += 1;

    this.tweens.add({
      targets: fishSprite,
      displayWidth: targetWidth,
      displayHeight: targetHeight,
      duration: 280,
      ease: 'Back.easeOut',
    });
  }

  update(_time, delta) {
    const dt = delta / 1000;
    this.drawWaves(_time * 0.001);

    if (this.phase === FISHING2_PHASE.CHARGING) {
      this.power = Math.min(1, this.power + dt * 0.85);
      this.updatePowerGauge();
    }

    if (this.phase === FISHING2_PHASE.WAITING) {
      const bob = Math.sin(_time * 0.004) * 3;
      this.bobber.y = this.bobberY + bob;
      this.drawRodLine(this.bobberX, this.bobber.y);
    }

    if (this.phase === FISHING2_PHASE.BITE) {
      this.reelTimeLeft -= delta;
      const sec = Math.max(0, this.reelTimeLeft / 1000).toFixed(1);
      this.statusText.setText(`입질! ${sec}초 안에 클릭해서 당기세요!`);
      this.bobber.y = this.bobberY + Math.sin(_time * 0.02) * 6;
      this.positionBiteMark();
      this.drawRodLine(this.bobberX, this.bobber.y);
      if (this.reelTimeLeft <= 0) {
        this.escapeFish();
      }
    }

    if (this.phase === FISHING2_PHASE.FIGHTING) {
      this.updateFightMiniGame(dt, delta);
    }
  }

  updateFightMiniGame(dt, delta) {
    this.fightTimeLeft -= delta;
    this.fightTimerText.setText(`${Math.max(0, Math.ceil(this.fightTimeLeft / 1000))}초`);

    const holding = this.isFightHolding;
    const gravity = 520;
    const lift = 680;

    if (holding) {
      this.playerBarVelocity -= lift * dt;
    } else {
      this.playerBarVelocity += gravity * dt;
    }
    this.playerBarVelocity = Phaser.Math.Clamp(this.playerBarVelocity, -360, 360);
    this.playerBarY += this.playerBarVelocity * dt;

    const zoneHalf = FISHING2_LAYOUT.playerZoneHeight / 2;
    const minY = this.fightTrackTop + zoneHalf;
    const maxY = this.fightTrackBottom - zoneHalf;
    if (this.playerBarY < minY) {
      this.playerBarY = minY;
      this.playerBarVelocity = 0;
    }
    if (this.playerBarY > maxY) {
      this.playerBarY = maxY;
      this.playerBarVelocity = 0;
    }
    this.playerZoneGfx.y = this.playerBarY;

    this.fishMoveTimer += delta;
    if (this.fishMoveTimer >= this.fishMoveDelay) {
      this.scheduleNextFishTarget();
    }
    const fishSpeed = 140 * (this.currentFish?.speed ?? 1);
    this.fishTrackY = Phaser.Math.Linear(this.fishTrackY, this.fishTargetY, fishSpeed * dt / 120);
    this.fishIcon.y = this.fishTrackY;

    const fish = this.currentFish ?? FISHING2_FISH[0];
    if (this.isPlayerOnFish()) {
      this.fightProgress += fish.progressGain * dt;
    } else {
      this.fightProgress -= fish.progressLoss * dt;
    }
    this.fightProgress = Phaser.Math.Clamp(this.fightProgress, 0, 100);
    this.updateFightProgressBar();

    if (this.fightProgress >= FISHING2_TIMINGS.catchProgressRequired) {
      this.catchFish();
      return;
    }
    if (this.fightTimeLeft <= 0) {
      this.escapeFish();
    }
  }

  shutdown() {
    this.biteTimer?.remove(false);
    if (this.onBgmUnlocked) {
      this.sound.off('unlocked', this.onBgmUnlocked);
    }
    stopGameBgm(this.sound);
  }
}
