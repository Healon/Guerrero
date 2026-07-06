// ============================================================
// GRAVE GENT — 入口
// ============================================================
import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import { OverScene, ClearScene } from './scenes/OverlayScenes.js';
import { unlockAudio } from './audio/sfx.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#07060f',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      fixedStep: true,
      debug: new URLSearchParams(location.search).get('physdebug') === '1'
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  input: { activePointers: 4 },
  scene: [BootScene, TitleScene, GameScene, UIScene, OverScene, ClearScene]
});

// WebAudio 需要使用者手勢解鎖
const unlock = () => unlockAudio();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
window.addEventListener('touchstart', unlock, { once: true });

// 測試掛鉤
window.__GG = game;
