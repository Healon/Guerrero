// ============================================================
// GRAVE GENT — 全部難度/手感參數集中於此（調參只改這裡）
// ============================================================

export const GAME_W = 480;
export const GAME_H = 270;
export const TILE = 16;

export const PHYS = {
  gravity: 1150
};

export const PLAYER = {
  runSpeed: 108,          // 地面移動速度 px/s
  accelLerp: 0.5,         // 速度趨近係數（越大越跟手）
  jumpVel: -350,          // 起跳初速（apex ≈ 53px ≈ 3.3 磚）
  jumpCutVel: -120,       // 放開跳躍鍵時的截斷速度（可變跳高）
  coyoteMs: 90,           // 離開平台後仍可跳的寬限
  bufferMs: 110,          // 落地前預按跳躍的緩衝
  maxHp: 6,
  lives: 3,
  iframesMs: 900,         // 受擊無敵
  hurtLockMs: 240,        // 受擊硬直（不可操作）
  knockX: 170,
  knockY: -150,
  attackTotalMs: 260,     // 揮刀全程
  attackActiveFromMs: 50, // 判定窗開始
  attackActiveToMs: 175,  // 判定窗結束
  attackCooldownMs: 80,   // 收招後冷卻
  attackMoveFactor: 0.55, // 地面揮刀時移速倍率
  hitboxW: 28,
  hitboxH: 24,
  hitboxDX: 19,           // 判定框中心距玩家中心
  bodyW: 10,
  bodyH: 20
};

export const ENEMIES = {
  ghost:  { hp: 1, speed: 34, aggroR: 150, dropR: 300, dmg: 1, bobAmp: 12, bobHz: 2.4, dropChance: 0.35 },
  ghoul:  { hp: 2, speed: 24, dmg: 1, dropChance: 0.5 },
  hopper: { hp: 1, dmg: 1, hopVy: -245, hopVx: 80, hopEveryMs: 1150, aggroR: 170, dropChance: 0.35 }
};

export const COMBAT = {
  spikeDmg: 2,
  crateSkullMin: 1,
  crateSkullMax: 3,
  heartChance: 0.18,      // 破箱掉紅心機率
  heartHeal: 2,
  pickupLifeMs: 9000
};

export const BOSS = {
  hp: 16,
  phase2At: 8,            // 血量 ≤ 此值進第二階段
  contactDmg: 1,
  slamDmg: 2,
  slamRadius: 74,
  projDmg: 1,
  hoverMs: 1250,
  hoverSpeed: 46,
  swoopSpeed: 215,
  swoopTelegraphMs: 380,
  slamHangMs: 420,
  slamFallVy: 410,
  recoverMs: 900,
  p2SpeedMul: 1.25,
  throwSpeed: 170,
  throwBoomerangMs: 950,
  skullReward: 15
};

export const WEAPON = {
  waveSpeed: 250,     // 刀氣飛行速度 px/s
  waveMaxDist: 150,   // 刀氣射程
  waveLifeMs: 800     // 刀氣壽命上限
};

export const SOULFIRE = {
  speed: 165,         // 追蹤／滑翔飛行速度
  steer: 0.09,        // 轉向趨近係數（越大轉彎越銳利）
  acquireR: 220,      // 索敵半徑
  lifeMs: 1800,       // 壽命（無目標時＝往前飛的「盡頭」）
  launchVx: 150,      // 出手前拋水平初速（乘 facing，向前）
  launchVy: -170,     // 出手上拋初速（拋物線弧高 ≈ 28px）
  arcGravity: 520,    // 未鎖定時的下墜加速度（畫出拋物線）
  armMs: 150          // 出手後至少此時間才開始索敵（保留前拋起手視覺）
};

export const AUDIO = {
  master: 0.5,
  sfx: 0.7,
  bgm: 0.24,
  bgmBpm: 96,
  bossBpm: 122
};
