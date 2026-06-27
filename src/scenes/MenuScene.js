import Phaser from 'phaser';

const GAME_WIDTH = 844;
const GAME_HEIGHT = 390;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b1d33);

    this.add.text(GAME_WIDTH / 2, 52, '낚시 게임', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '38px',
      color: '#ffd43b',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 92, '플레이할 게임을 선택하세요', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '17px',
      color: '#ced4da',
    }).setOrigin(0.5);

    this.createMenuButton(GAME_WIDTH / 2, 148, '낚시 게임 1', '2D 바다 낚시 + 퀴즈', () => {
      this.scene.start('GameScene');
    });

    this.createMenuButton(GAME_WIDTH / 2, 222, '낚시 게임 2', '3인칭 시점 + 입질 미니게임', () => {
      this.scene.start('GameScene2');
    });

    this.createMenuButton(GAME_WIDTH / 2, 296, '물고기 키우기', '먹고 크기 키우기 + 퀴즈', () => {
      this.scene.start('GameScene3');
    });
  }

  createMenuButton(x, y, title, subtitle, onSelect) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 420, 64, 0x1c314a, 0.95)
      .setStrokeStyle(2, 0x339af0)
      .setInteractive({ useHandCursor: true });

    const titleText = this.add.text(0, -10, title, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const subText = this.add.text(0, 16, subtitle, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#91a7ff',
    }).setOrigin(0.5);

    button.add([bg, titleText, subText]);

    bg.on('pointerover', () => bg.setFillStyle(0x228be6, 0.35));
    bg.on('pointerout', () => bg.setFillStyle(0x1c314a, 0.95));
    bg.on('pointerdown', onSelect);

    return button;
  }
}
