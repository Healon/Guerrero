// ============================================================
// 第一關：墓園之夜（程式化關卡定義）
// 座標單位：t = 磚（16px）、k = 距底部磚數（表面頂 y = 270 - k*16）
// ============================================================
import { TILE, GAME_H } from '../config.js';

export const LEVEL = {
  wTiles: 210,

  // 地面段 [x0, x1, h]，段與段之間即深淵
  grounds: [
    [0, 17, 3],
    [21, 38, 3],
    [42, 58, 3],
    [61, 78, 4],
    [83, 100, 3],
    [104, 124, 3],
    [128, 148, 3],
    [152, 170, 4],
    [174, 209, 3]
  ],
  stoneFromT: 179, // 這一磚之後地面改石磚（boss 區）

  // 單向木板 [x0, x1, k]
  planks: [
    [45, 49, 6],
    [79, 82, 6],
    [91, 95, 6],
    [106, 108, 6],
    [111, 113, 8]
  ],

  // 實心石台 [x0, x1, k]
  ledges: [
    [64, 66, 6],
    [116, 119, 9]
  ],

  // 尖刺 [x0, x1, k]（k = 地面 h + 1）
  spikes: [
    [46, 48, 4],
    [92, 94, 4],
    [142, 144, 4]
  ],

  // 木箱 {t, k}（k = 所站表面的高度；堆疊即 k+1）
  crates: [
    { t: 15, k: 3 },
    { t: 30, k: 3 }, { t: 30, k: 4 },
    { t: 72, k: 4 }, { t: 72, k: 5 },
    { t: 117, k: 9 },
    { t: 146, k: 3 }, { t: 146, k: 4 },
    { t: 177, k: 3 }, { t: 177, k: 4 },
    { t: 206, k: 3 }, { t: 206, k: 4 }
  ],

  // 場景骷髏頭（直接放置的貨幣）{t, k}
  skulls: [
    { t: 19, k: 5 },
    { t: 60, k: 5 },
    { t: 112, k: 10 },
    { t: 116, k: 10 }, { t: 117, k: 10 }, { t: 118, k: 10 }, { t: 119, k: 10 },
    { t: 126, k: 5 },
    { t: 150, k: 5 }
  ],

  // 裝飾
  graves: [
    { t: 8, kind: 1 }, { t: 34, kind: 2 }, { t: 50, kind: 1 },
    { t: 73, kind: 1 }, { t: 90, kind: 2 }, { t: 118, kind: 2 },
    { t: 140, kind: 1 }, { t: 157, kind: 1 }, { t: 176, kind: 2 }
  ],
  trees: [12, 44, 70, 110, 134, 158],
  fences: [
    [22, 26], [62, 66], [128, 132], [152, 156]
  ],

  // 檢查點燈籠
  lanterns: [76, 168],

  // 武器升級（放在跳台頂端，需小跳取得）
  powerups: [{ t: 118, k: 12, kind: 'wave' }],

  enemies: [
    { t: 'ghost', x: 26, y: 120 },
    { t: 'ghost', x: 68, y: 100 },
    { t: 'ghost', x: 97, y: 110 },
    { t: 'ghost', x: 132, y: 115 },
    { t: 'ghost', x: 160, y: 100 },
    { t: 'ghoul', x: 53, r: [50, 57] },
    { t: 'ghoul', x: 120, r: [114, 124] },
    { t: 'ghoul', x: 164, r: [158, 169] },
    { t: 'hopper', x: 36, r: [33, 38] },
    { t: 'hopper', x: 86, r: [83, 92] },
    { t: 'hopper', x: 136, r: [130, 140] }
  ],

  playerStartT: 3,

  boss: {
    triggerT: 186,
    gateT: 179,
    spawnT: 202,
    arenaEndT: 209
  }
};

export const worldW = LEVEL.wTiles * TILE;

/** 磚 x → 世界 px（磚中心） */
export const tx = (t) => t * TILE + TILE / 2;
/** k（距底磚數）→ 表面頂 y */
export const ky = (k) => GAME_H - k * TILE;

/** 查某磚所在地面段高度 h（無地面回 null） */
export function groundHAt(t) {
  for (const [x0, x1, h] of LEVEL.grounds) {
    if (t >= x0 && t <= x1) return h;
  }
  return null;
}
