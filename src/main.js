import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameScene2 from './scenes/GameScene2.js';
import GameScene3 from './scenes/GameScene3.js';
import { initFullscreenToggle } from './fullscreen.js';

const config = {
  type: Phaser.AUTO,
  width: 844,
  height: 390,
  parent: 'game-container',
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameScene2, GameScene3],
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
};

new Phaser.Game(config);
initFullscreenToggle();
