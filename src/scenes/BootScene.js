// ============================================================
// Boot：生成全部貼圖與動畫 → Title（或 ?auto=1 直入關卡）
// ============================================================
import Phaser from 'phaser';
import { registerAllSprites } from '../art/sprites.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    registerAllSprites(this);

    const mk = (key, tex, frames, frameRate, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((i) => ({ key: `${tex}_${i}` })),
        frameRate,
        repeat
      });
    };

    mk('mort_idle', 'mort_idle', [0, 1], 2.5);
    mk('mort_run', 'mort_run', [0, 1, 2, 3], 10);
    mk('mort_jump', 'mort_jump', [0], 1);
    mk('mort_fall', 'mort_fall', [0], 1);
    mk('mort_atk', 'mort_atk', [0, 1, 2], 12, 0);
    mk('ghost_anim', 'ghost', [0, 1], 4);
    mk('ghoul_anim', 'ghoul', [0, 1], 5);
    mk('skullp_anim', 'skullp', [0, 1], 5);
    mk('flame_anim', 'flame', [0, 1], 8);
    mk('reaper_float_anim', 'reaper_float', [0, 1], 3);
    mk('wave_anim', 'wave', [0, 1], 12);
    mk('item_wave_anim', 'item_wave', [0, 1], 4);
    mk('fire_anim', 'fire', [0, 1], 10);
    mk('item_fire_anim', 'item_fire', [0, 1], 4);

    document.getElementById('boot-msg')?.remove();

    const params = new URLSearchParams(location.search);
    if (params.get('auto') === '1') {
      this.scene.start('Game');
    } else {
      this.scene.start('Title');
    }
  }
}
