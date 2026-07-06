// ============================================================
// HUD：血條、骷髏頭貨幣、命數、boss 血條、暫停、觸控按鍵
// ============================================================
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { sfx, setMuted, isMuted } from '../audio/sfx.js';

class NumberDisplay {
  constructor(scene, x, y, maxDigits = 3) {
    this.scene = scene;
    this.imgs = [];
    for (let i = 0; i < maxDigits; i++) {
      this.imgs.push(
        scene.add.image(x + i * 5, y, 'digit_0').setOrigin(0, 0).setVisible(false).setDepth(100)
      );
    }
    this.set(0);
  }
  set(n) {
    const s = String(Math.max(0, Math.floor(n)));
    this.imgs.forEach((img, i) => {
      if (i < s.length && this.scene.textures.exists(`digit_${s[i]}`)) {
        img.setTexture(`digit_${s[i]}`).setVisible(true);
      } else {
        img.setVisible(false);
      }
    });
  }
}

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    // 多點觸控數量由 main.js 的 input.activePointers 統一設定；
    // 不在此 addPointer——UIScene 每次重啟都會執行，會讓全域 pointer 池無限增生
    // ---- HP 條 ----
    this.weaponIcon = this.add.image(5, 5, 'hud_scythe').setOrigin(0, 0).setDepth(100);
    const maxHp = this.registry.get('maxHp') || 6;
    this.hpSegs = [];
    for (let i = 0; i < maxHp; i++) {
      this.add.rectangle(20 + i * 9, 6, 8, 9, 0x12101c).setOrigin(0, 0).setDepth(99);
      this.hpSegs.push(
        this.add.rectangle(21 + i * 9, 7, 6, 7, 0x8df23c).setOrigin(0, 0).setDepth(100)
      );
    }

    // ---- 骷髏頭貨幣 ----
    this.add.image(6, 20, 'hud_skull').setOrigin(0, 0).setDepth(100);
    this.skullNum = new NumberDisplay(this, 20, 21, 3);

    // ---- 命數（頂部中央）----
    this.add.image(GAME_W / 2 - 14, 6, 'hud_skull').setOrigin(0, 0).setDepth(100);
    this.add.image(GAME_W / 2 - 2, 7, 'digit_x').setOrigin(0, 0).setDepth(100);
    this.livesNum = new NumberDisplay(this, GAME_W / 2 + 4, 7, 2);

    // ---- Boss 血條（出現時顯示）----
    this.bossBarBg = this.add.rectangle(298, 8, 148, 10, 0x12101c)
      .setOrigin(0, 0).setDepth(99).setStrokeStyle(1, 0x5c2fb0).setVisible(false);
    this.bossBarFill = this.add.rectangle(300, 10, 144, 6, 0xf24c5c)
      .setOrigin(0, 0).setDepth(100).setVisible(false);
    this.bossSkull = this.add.image(288, 7, 'hud_skull').setOrigin(0, 0)
      .setDepth(100).setTint(0xf24c5c).setVisible(false);

    // ---- 暫停鍵 ----
    this.pauseBtn = this.add.image(GAME_W - 14, 13, 'icon_pause')
      .setDepth(100).setAlpha(0.8)
      .setInteractive({ useHandCursor: false });
    this.pauseBtn.on('pointerdown', () => this.togglePause());

    // ---- 暫停覆蓋層 ----
    this.pausedGroup = this.add.container(0, 0).setDepth(200).setVisible(false);
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x06050c, 0.72);
    const ptxt = this.add.text(GAME_W / 2, GAME_H / 2 - 12, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '26px', fontStyle: 'bold', color: '#f2ead8'
    }).setOrigin(0.5);
    const ptxt2 = this.add.text(GAME_W / 2, GAME_H / 2 + 16, 'P / TAP HERE: RESUME', {
      fontFamily: 'monospace', fontSize: '11px', color: '#8df23c'
    }).setOrigin(0.5);
    this.pausedGroup.add([dim, ptxt, ptxt2]);
    dim.setInteractive();
    dim.on('pointerdown', () => this.togglePause());

    // ---- 靜音提示 ----
    this.muteTxt = this.add.text(GAME_W - 30, 24, 'MUTED', {
      fontFamily: 'monospace', fontSize: '8px', color: '#f24c5c'
    }).setOrigin(0.5, 0).setDepth(100).setVisible(isMuted());

    // ---- 觸控 ----
    const params = new URLSearchParams(location.search);
    const wantTouch =
      params.get('touch') === '1' ||
      (params.get('touch') !== '0' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    if (wantTouch) this.buildVpad();

    // ---- 鍵盤 ----
    this.keys = this.input.keyboard.addKeys('P,ESC,M');

    // ---- registry 監聽 ----
    this.registry.events.on('changedata', this.onData, this);
    this.events.once('shutdown', () => {
      this.registry.events.off('changedata', this.onData, this);
    });
    this.refreshAll();

    // ---- debug fps ----
    if (params.get('debug') === '1') {
      this.fpsTxt = this.add.text(4, GAME_H - 12, '', {
        fontFamily: 'monospace', fontSize: '9px', color: '#8df23c'
      }).setDepth(300);
    }
  }

  buildVpad() {
    const vpad = this.registry.get('vpad') || { left: false, right: false, jump: false, attack: false };
    this.registry.set('vpad', vpad);

    const mkBtn = (x, y, glyphKey, prop, { rotate = 0, flip = false, scale = 1 } = {}) => {
      const ring = this.add.image(x, y, 'ring_btn').setDepth(150).setAlpha(0.4).setScale(1.15);
      const glyph = this.add.image(x, y, glyphKey).setDepth(151).setAlpha(0.5)
        .setAngle(rotate).setFlipX(flip).setScale(scale);
      const zone = this.add.zone(x, y, 58, 58).setDepth(152)
        .setInteractive({ useHandCursor: false });
      const on = () => {
        vpad[prop] = true;
        ring.setAlpha(0.8); glyph.setAlpha(0.95);
      };
      const off = () => {
        vpad[prop] = false;
        ring.setAlpha(0.4); glyph.setAlpha(0.5);
      };
      zone.on('pointerdown', on);
      zone.on('pointerover', (p) => { if (p.isDown) on(); });
      zone.on('pointerup', off);
      zone.on('pointerout', off);
    };

    mkBtn(32, GAME_H - 32, 'glyph_arrow', 'left');
    mkBtn(80, GAME_H - 32, 'glyph_arrow', 'right', { flip: true });
    mkBtn(GAME_W - 80, GAME_H - 32, 'hud_scythe', 'attack', { scale: 1.6 });
    mkBtn(GAME_W - 32, GAME_H - 32, 'glyph_arrow', 'jump', { rotate: 90 });
  }

  togglePause() {
    const game = this.scene.get('Game');
    if (!game) return;
    if (this.scene.isPaused('Game')) {
      this.registry.set('paused', false);
      this.scene.resume('Game');
      sfx.blip();
    } else if (this.scene.isActive('Game') || this.scene.isPaused('Game')) {
      this.registry.set('paused', true);
      this.scene.pause('Game');
      sfx.blip();
    }
  }

  onData(parent, key, value) {
    switch (key) {
      case 'hp': this.drawHp(value); break;
      case 'skulls': this.skullNum.set(value); break;
      case 'lives': this.livesNum.set(value); break;
      case 'bossHp':
      case 'bossMax': this.drawBoss(); break;
      case 'paused': this.pausedGroup.setVisible(!!value); break;
      case 'weaponLv': this.drawWeapon(value); break;
    }
  }

  refreshAll() {
    this.drawHp(this.registry.get('hp') ?? 6);
    this.skullNum.set(this.registry.get('skulls') ?? 0);
    this.livesNum.set(this.registry.get('lives') ?? 3);
    this.drawBoss();
    this.drawWeapon(this.registry.get('weaponLv') ?? 1);
    this.pausedGroup.setVisible(!!this.registry.get('paused'));
  }

  drawWeapon(lv) {
    this.weaponIcon.setTexture(lv >= 2 ? 'hud_scythe2' : 'hud_scythe');
  }

  drawHp(hp) {
    this.hpSegs.forEach((seg, i) => {
      seg.setVisible(i < hp);
      seg.fillColor = hp <= 2 ? 0xf24c5c : 0x8df23c;
    });
  }

  drawBoss() {
    const max = this.registry.get('bossMax');
    const hp = this.registry.get('bossHp');
    const show = !!max;
    this.bossBarBg.setVisible(show);
    this.bossBarFill.setVisible(show);
    this.bossSkull.setVisible(show);
    if (show && hp != null) {
      this.bossBarFill.width = Math.max(0, 144 * (hp / max));
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) {
      setMuted(!isMuted());
      this.muteTxt.setVisible(isMuted());
    }
    if (
      this.registry.get('paused') &&
      (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC))
    ) {
      this.togglePause();
    }
    if (this.fpsTxt) {
      this.fpsTxt.setText(`FPS ${Math.round(this.game.loop.actualFps)}`);
    }
  }
}
