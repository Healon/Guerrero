// ============================================================
// Game Over 與 Stage Clear 覆蓋場景
// ============================================================
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { sfx } from '../audio/sfx.js';

function exitToTitle(scene) {
  scene.scene.stop('UI');
  scene.scene.stop('Game');
  scene.scene.start('Title');
}

function restartGame(scene) {
  const game = scene.scene.get('Game');
  game.scene.restart();
  scene.scene.stop();
}

export class OverScene extends Phaser.Scene {
  constructor() {
    super('Over');
  }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x06050c, 0.82);
    const skull = this.add.image(GAME_W / 2, 86, 'hud_skull').setScale(3).setAlpha(0.9);
    this.tweens.add({ targets: skull, y: 82, duration: 900, yoyo: true, repeat: -1 });

    this.add.text(GAME_W / 2, 126, 'GAME OVER', {
      fontFamily: '"Courier New", monospace', fontSize: '34px', fontStyle: 'bold',
      color: '#f24c5c', stroke: '#06050c', strokeThickness: 6
    }).setOrigin(0.5);

    const hint = this.add.text(GAME_W / 2, 168, 'Z / TAP: RETRY      T: TITLE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f2ead8'
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-Z', () => restartGame(this));
    this.input.once('pointerdown', () => restartGame(this));
    this.input.keyboard.once('keydown-T', () => exitToTitle(this));
  }
}

export class ClearScene extends Phaser.Scene {
  constructor() {
    super('Clear');
  }

  create(data) {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x06050c, 0.78);

    this.add.text(GAME_W / 2, 74, 'STAGE CLEAR!', {
      fontFamily: '"Courier New", monospace', fontSize: '32px', fontStyle: 'bold',
      color: '#8df23c', stroke: '#1f4a33', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 108, 'THE REAPER HAS BEEN REAPED', {
      fontFamily: 'monospace', fontSize: '10px', color: '#8a4df2'
    }).setOrigin(0.5);

    // 骷髏頭結算（滾動計數）
    this.add.image(GAME_W / 2 - 34, 134, 'hud_skull').setScale(2).setOrigin(0.5);
    const numTxt = this.add.text(GAME_W / 2 - 12, 134, 'x 0', {
      fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#f2ead8'
    }).setOrigin(0, 0.5);
    const total = data.skulls ?? 0;
    this.tweens.addCounter({
      from: 0,
      to: total,
      duration: Math.min(1500, 90 * total + 200),
      onUpdate: (tw) => numTxt.setText(`x ${Math.floor(tw.getValue())}`),
      onComplete: () => sfx.pickup()
    });

    this.add.text(GAME_W / 2, 176, 'THANKS FOR PLAYING THE DEMO', {
      fontFamily: 'monospace', fontSize: '10px', color: '#6f6a8a'
    }).setOrigin(0.5);

    const hint = this.add.text(GAME_W / 2, 200, 'Z / TAP: BACK TO TITLE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f2ead8'
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });

    const done = () => exitToTitle(this);
    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown-Z', done);
      this.input.once('pointerdown', done);
    });
  }
}
