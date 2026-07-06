// ============================================================
// 標題畫面：夜空、月亮、墓園剪影、LOGO、開始提示
// ============================================================
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { sfx, unlockAudio } from '../audio/sfx.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const W = GAME_W, H = GAME_H;

    this.add.image(W / 2, H / 2, 'sky').setDisplaySize(W, H);
    this.add.tileSprite(W / 2, 60, W, 90, 'stars');
    this.add.image(W - 92, 58, 'moon');
    this.add.image(W - 92, 58, 'glow_g').setBlendMode(Phaser.BlendModes.ADD).setScale(2).setAlpha(0.5);
    this.add.tileSprite(W / 2, H - 88, W, 70, 'farhills');

    // 前景墓園
    const groundY = H - 26;
    this.add.rectangle(W / 2, H - 13, W, 26, 0x12101c);
    this.add.rectangle(W / 2, groundY - 1, W, 3, 0x1f4a33);
    this.add.image(60, groundY - 26, 'tree').setScale(1.1).setAlpha(0.9);
    this.add.image(392, groundY - 22, 'tree').setFlipX(true).setAlpha(0.75).setScale(0.9);
    this.add.image(120, groundY - 9, 'grave2');
    this.add.image(330, groundY - 7, 'grave1');
    this.add.image(160, groundY - 7, 'grave1').setFlipX(true);
    this.add.tileSprite(W / 2, groundY - 10, W, 20, 'fence').setAlpha(0.5);
    this.add.tileSprite(W / 2, H - 34, W, 22, 'mist').setAlpha(0.8);

    // 主角站在墓碑旁
    const mort = this.add.sprite(240, groundY - 14, 'mort_idle_0').setScale(1.4);
    mort.play('mort_idle');

    // 幽靈飄過
    const ghost = this.add.sprite(-20, 120, 'ghost_0').setAlpha(0.85);
    ghost.play('ghost_anim');
    this.tweens.add({
      targets: ghost,
      x: W + 30,
      y: { value: 90, ease: 'Sine.easeInOut', yoyo: true, repeat: 3 },
      duration: 12000,
      repeat: -1
    });

    // LOGO
    const title = this.add.text(W / 2, 78, 'GRAVE GENT', {
      fontFamily: '"Courier New", monospace',
      fontSize: '46px',
      fontStyle: 'bold',
      color: '#f2ead8',
      stroke: '#5c2fb0',
      strokeThickness: 6
    }).setOrigin(0.5).setShadow(0, 4, '#06050c', 0, true, true);

    this.add.text(W / 2, 106, '~ A KRAINO-STYLE TRIBUTE · ORIGINAL DEMO ~', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#8a4df2'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 74,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const prompt = this.add.text(W / 2, 168, 'PRESS  Z  /  TAP  TO  START', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#8df23c'
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.15, duration: 520, yoyo: true, repeat: -1 });

    this.add.text(W / 2, 196, 'ARROWS / WASD: MOVE    Z / SPACE: JUMP    X / J: ATTACK', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6f6a8a'
    }).setOrigin(0.5);
    this.add.text(W / 2, 208, 'M: MUTE    P: PAUSE', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6f6a8a'
    }).setOrigin(0.5);

    const start = () => {
      unlockAudio();
      sfx.blip();
      this.cameras.main.fadeOut(300, 6, 5, 12);
      this.time.delayedCall(320, () => this.scene.start('Game'));
    };
    this.input.keyboard.once('keydown-Z', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
