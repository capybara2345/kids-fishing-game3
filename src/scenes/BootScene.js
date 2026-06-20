import Phaser from 'phaser';
import { PILOT_TEXTURES } from '../config/creatureAssets.js';

const BOOT_LOAD_TIMEOUT_MS = 12000;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.loadFailures = [];
    this.bootHandoffDone = false;
    this.createLoadingUI();

    this.load.on('loaderror', (file) => {
      this.loadFailures.push(file.key);
      console.error('[BootScene] asset load failed:', file.key, file.src);
      this.loadingText.setText(`이미지 로드 실패: ${file.key}`);
    });

    PILOT_TEXTURES.forEach(({ key, path }) => {
      this.load.image(key, path);
    });

    this.bootTimeout = this.time.delayedCall(BOOT_LOAD_TIMEOUT_MS, () => {
      if (!this.bootHandoffDone) {
        console.warn('[BootScene] load timeout — starting game with fallbacks');
        this.startGame();
      }
    });
  }

  createLoadingUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.loadingText = this.add.text(centerX, centerY, '바다 생물 불러오는 중...', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const barWidth = 220;
    const barHeight = 12;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 24;

    this.loadBarBg = this.add.rectangle(centerX, barY, barWidth, barHeight, 0x1c314a, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.5);
    this.loadBarFill = this.add.rectangle(barX, barY, 0, barHeight - 4, 0x339af0, 1)
      .setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      this.loadBarFill.width = (barWidth - 4) * value;
    });
  }

  create() {
    this.startGame();
  }

  startGame() {
    if (this.bootHandoffDone) return;
    this.bootHandoffDone = true;

    if (this.bootTimeout) {
      this.bootTimeout.remove(false);
      this.bootTimeout = null;
    }

    if (this.loadFailures.length > 0) {
      this.loadingText.setText(`일부 에셋 로드 실패 (${this.loadFailures.length}개)`);
    } else {
      this.loadingText.setText('준비 완료!');
    }

    this.scene.start('GameScene');
  }
}
