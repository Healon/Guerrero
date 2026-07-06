// ============================================================
// 全部原創像素素材（向 Kraino 風格致敬，非複製）
// 主角 Mort：戴禮帽的骷髏紳士，武器為鐮刀
// ============================================================
import {
  PAL, blank, place, flipH, texFromRows, framesFromRows, texFromDraw, disc, ring
} from './pixelart.js';

// ---------- 主角：畫布 36×28，身體核心 16 寬置於 x=10（中心 col 18），腳底 row 27 ----------
export const MORT_W = 36;
export const MORT_H = 28;

const HEAD = [
  '....hhhhhhh.....',
  '....hHHhhhh.....',
  '....hHhhhhh.....',
  '....PpPPPPP.....',
  '..hhhhhhhhhhh...',
  '....wwwwwww.....',
  '...wwwwwwwwww...',
  '...wwkkwwwkkw...',
  '...wwkWwwwkWw...',
  '...wwwwwkwwww...',
  '...bwbwbwbwbw...',
  '....bbbbbbbb....'
];

const TORSO = [
  '.....cwwc.......',
  '....ccCCCcc.....',
  '...ccCCCCCcc....',
  '...ccCCCCCccww..',
  '...ccCCCCCcc....',
  '....ccCCCcc.....',
  '....ccCCCcc.....'
];

// 揮刀用軀幹（手臂前伸）
const TORSO_ATK = [
  '.....cwwc.......',
  '....ccCCCcc.....',
  '...ccCCCCCcc....',
  '...ccCCCCCccwww.',
  '...ccCCCCCcc....',
  '....ccCCCcc.....',
  '....ccCCCcc.....'
];

const LEGS_IDLE = [
  '....cc.ccc......',
  '.....ww.ww......',
  '.....ww.ww......',
  '.....bb.bb......',
  '.....ww.ww......',
  '.....ww.ww......',
  '....www.www.....'
];

const LEGS_RUN_A = [
  '....cc.ccc......',
  '....ww...ww.....',
  '...ww.....ww....',
  '...bb.....bb....',
  '..ww.......ww...',
  '..ww........ww..',
  '.www........www.'
];

const LEGS_RUN_B = [
  '....cc.ccc......',
  '.....ww.ww......',
  '.....wwww.......',
  '......bb........',
  '.....ww.........',
  '.....ww.........',
  '....www.........'
];

const LEGS_JUMP = [
  '....cc.ccc......',
  '....ww..ww......',
  '...www..www.....',
  '...bb....bb.....',
  '................',
  '................',
  '................'
];

const LEGS_FALL = [
  '....cc.ccc......',
  '....ww..ww......',
  '...ww....ww.....',
  '...bb....bb.....',
  '...ww.....ww....',
  '..www.....www...',
  '................'
];

// 手持鐮刀（非攻擊時）：刀刃橫在頭頂後方，木柄直立於身側
const BLADE_HELD = [
  'WWWWWWWWWWWWWW..',
  '..tttttttttttttt',
  '............TTtt'
];
const HANDLE_ROWS = Array.from({ length: 20 }, () => 'vu');

// 攻擊幀刀刃
const BLADE_WINDUP = [
  '......WWWWW.',
  '...WWWtttttW',
  '.tttttttTT..',
  'tttTTT......'
];
const BLADE_SWING = [
  'tW........',
  'ttW.......',
  '.ttW......',
  '.tttWW....',
  '..tttWW...',
  '..ttttWW..',
  '...ttttWW.',
  '...ttttWW.',
  '...ttttWW.',
  '..ttttWW..',
  '..tttWW...',
  '.tttWW....',
  '.ttW......',
  'ttW.......',
  'tW........'
];
const BLADE_LOW = [
  '..........tW',
  '......ttttWW',
  '..ttttttWW..',
  'ttttttWW....',
  'ttttWW......',
  'ttW.........'
];

function mortBase(legs, headDx = 0, headDy = 0, torso = TORSO) {
  let f = blank(MORT_W, MORT_H);
  // 鐮刀畫在最底層（被身體遮住的部分自然消失）
  f = place(f, BLADE_HELD, 10, 1);
  f = place(f, HANDLE_ROWS, 24, 3);
  f = place(f, HEAD, 10 + headDx, 2 + headDy);
  f = place(f, torso, 10, 14);
  f = place(f, legs, 10, 21);
  return f;
}

function mortAttack(stage) {
  let f = blank(MORT_W, MORT_H);
  if (stage === 0) {
    f = place(f, BLADE_WINDUP, 21, 1);
    f = place(f, ['vu', 'vu', 'vu', 'vu', 'vu', 'vu'], 23, 5);
    f = place(f, HEAD, 9, 2);
    f = place(f, TORSO_ATK, 10, 14);
    f = place(f, LEGS_IDLE, 10, 21);
  } else if (stage === 1) {
    f = place(f, ['uuuu'], 22, 16);
    f = place(f, BLADE_SWING, 25, 6);
    f = place(f, HEAD, 11, 2);
    f = place(f, TORSO_ATK, 10, 14);
    f = place(f, LEGS_RUN_A, 10, 21);
  } else {
    f = place(f, ['uuu'], 22, 19);
    f = place(f, BLADE_LOW, 23, 20);
    f = place(f, HEAD, 11, 3);
    f = place(f, TORSO, 10, 15);
    f = place(f, LEGS_RUN_B, 10, 21);
  }
  return f;
}

// ---------- 幽靈 ----------
const GHOST_HEAD = [
  '.....eeeee......',
  '...eeeeeeeee....',
  '..eeeeeeeeeee...',
  '..eekkeeekkee...',
  '..eekkeeekkee...',
  '..eeeeeeeeeee...',
  '..eeeekkeeeee...',
  '..eeeeeeeeeee...',
  '..Eeeeeeeeeee...',
  '..EEeeeeeeeee...',
  '...EEeeeeeee....'
];
const GHOST_0 = [...GHOST_HEAD,
  '...Ee.eee.ee....',
  '....e..ee..e....',
  '.......e........'
];
const GHOST_1 = [...GHOST_HEAD,
  '...Eee.ee.eee...',
  '....e.ee..e.....',
  '.........e......'
];

// ---------- 食屍鬼 ----------
const GHOUL_TOP = [
  '......qqqqq.....',
  '.....qqqqqqq....',
  '.....qggqggq....',
  '.....qqqqqqq....',
  '......qbwbq.....',
  '.....QqqqqQ.....',
  '....Qqqqqqqq....',
  '....Qqqqqqqqww..',
  '...QQqqqqqqqww..',
  '...QQqqqqqq.....',
  '...QQqqqqqq.....',
  '...NQQqqqqN.....',
  '....NQQqqN......',
  '....N.qq.N......'
];
const GHOUL_A = [...GHOUL_TOP,
  '.....qq..qq.....',
  '.....qq..qq.....',
  '....Qq....qq....',
  '....Qq....qq....',
  '....qq.....qq...',
  '...qqq.....qqq..'
];
const GHOUL_B = [...GHOUL_TOP,
  '.....qq..qq.....',
  '......qq.qq.....',
  '......qq.qq.....',
  '.....qq...q.....',
  '.....qq...qq....',
  '....qqq...qqq...'
];

// ---------- 跳跳骷髏頭 ----------
const HOPPER = [
  '...wwwww....',
  '..wwwwwww...',
  '..woowwoow..',
  '..wwwwwwww..',
  '..wwwkwwww..',
  '...wwwwww...',
  '..bwbwbwbw..',
  '...bbbbbb...'
];

// ---------- 木箱（骷髏標記）----------
const CRATE = [
  'UUUUUUUUUUUUUUUU',
  'Uvuuuuuuuuuuuuvu'.replace(/u$/, 'U'),
  'Ub uuuuuuuuuu bU'.replace(/ /g, 'u'),
  'Uu...www www..uU'.replace(/\./g, 'u').replace(/ /g, 'w'),
  'Uuuu.wwwwww.uuuU'.replace(/\./g, 'u'),
  'Uuuu.wkwwkw.uuuU'.replace(/\./g, 'u'),
  'Uuuu.wwwwww.uuuU'.replace(/\./g, 'u'),
  'Uuuu..bwwb..uuuU'.replace(/\./g, 'u'),
  'Uuuu..bwbw..uuuU'.replace(/\./g, 'u'),
  'Uuuuu.bbbb.uuuuU'.replace(/\./g, 'u'),
  'Uuuuuuuuuuuuuuu U'.replace(/ /g, '').slice(0, 16),
  'UuUuuuuuuuuuuUuU',
  'UbuuuuuuuuuuuubU',
  'Uvuuuuuuuuuuuuvu'.replace(/u$/, 'U'),
  'UUUUUUUUUUUUUUUU',
  'UUUUUUUUUUUUUUUU'
];

// ---------- 拾取物 ----------
const SKULL_P0 = [
  '..wwww..',
  '.wwwwww.',
  '.wkwwkw.',
  '.wwwwww.',
  '..wbbw..',
  '..bwwb..',
  '...bb...',
  '........'
];
const SKULL_P1 = [
  '..wWww..',
  '.wwwwww.',
  '.wkwwkw.',
  '.wwwwWw.',
  '..wbbw..',
  '..bwwb..',
  '...bb...',
  '........'
];
const HEART = [
  '.rr..rr.',
  'rWrrrrrr',
  'rrrrrrrr',
  'Rrrrrrrr',
  '.Rrrrrr.',
  '..Rrrr..',
  '...rr...',
  '........'
];

// ---------- 地形磚 ----------
const TILE_GRASS = [
  '.n...g...n....g.',
  'nnNnnnnNnnnnNnnn',
  'NnnnNnnnnnNnnnnN',
  'NNdDNNddNNdNNddN',
  'ddddDddddddDdddd',
  'dddddddDdddddddd',
  'dDddddddddddDddd',
  'ddddddDddddddddd',
  'dddDdddddddddddD',
  'ddddddddDddddddd',
  'dDdddddddddddddd',
  'ddddddDddddddDdd',
  'dddddddddddddddd',
  'ddDddddddDdddddd',
  'dddddddddddddddd',
  'DdddddDddddddddD'
];
const TILE_DIRT = [
  'dddddddddddddddd',
  'ddDddddddDdddddd',
  'dddddddddddddddd',
  'ddddddDddddddddd',
  'dDdddddddddddDdd',
  'dddddddddddddddd',
  'dddDddddddDddddd',
  'dddddddddddddddd',
  'ddddddddddddDddd',
  'dDddddDddddddddd',
  'dddddddddddddddd',
  'ddddDddddddddDdd',
  'dddddddddddddddd',
  'dDdddddddDdddddd',
  'ddddddddddddddDd',
  'dddddddddddddddd'
];
const TILE_STONE = [
  'ZZZZZZZZZZZZZZZZ',
  'ssssssSsssssssSs',
  'ssssssSsssssssSs',
  'SSSSSSSSSSSSSSSS',
  'ssSsssssssssSsss',
  'ssSsssssssssSsss',
  'SSSSSSSSSSSSSSSS',
  'ssssssSsssssssSs',
  'ssssssSsssssssSs',
  'SSSSSSSSSSSSSSSS',
  'ssSsssssssssSsss',
  'ssSsssssssssSsss',
  'SSSSSSSSSSSSSSSS',
  'ssssssSsssssssSs',
  'ssssssSsssssssSs',
  'SSSSSSSSSSSSSSSS'
];
const TILE_PLANK = [
  'vvvvvvvvvvvvvvvv',
  'uubuuuuuuuuuubuu',
  'uuUuuuuUuuuuUuuu',
  'UuuuuuUuuuuuuUuu',
  'UUUUUUUUUUUUUUUU',
  '.U...U.....U..U.',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................'
];
const TILE_SPIKE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.Z...Z...Z...Z..',
  '.Z...Z...Z...Z..',
  '.ZS..ZS..ZS..ZS.',
  '.ZS..ZS..ZS..ZS.',
  '.ZS..ZS..ZS..ZS.',
  'ZZS.ZZS.ZZS.ZZS.',
  'ZZS.ZZS.ZZS.ZZS.',
  'ZZS.ZZS.ZZS.ZZS.',
  'ZZSSZZSSZZSSZZSS',
  'SSSSSSSSSSSSSSSS'
];

// ---------- 場景物件 ----------
const GRAVE1 = [
  '....ssss....',
  '..ssssssss..',
  '..sZZssssS..',
  '..sZsssssS..',
  '..ssskkssS..',
  '..sskkkksS..',
  '..ssskkssS..',
  '..ssskkssS..',
  '..sssssssS..',
  '..sssssssS..',
  '..sssssssS..',
  '..sssssssS..',
  '.sssssssssS.',
  'SSSSSSSSSSSS'
];
const GRAVE2 = [
  '.....ZZss.....',
  '.....ssss.....',
  '.....ssss.....',
  '..ZssssssssS..',
  '..ZssssssssS..',
  '..SssssssssS..',
  '.....ssss.....',
  '.....ssss.....',
  '.....ssss.....',
  '.....ssss.....',
  '.....ssss.....',
  '.....ssss.....',
  '.....ssss.....',
  '....ssssss....',
  '...ssssssss...',
  '..NnnNssNnnN..',
  '.NnnnnnnnnnnN.',
  'NNnNnnNnnNnNnN'
];
const LANTERN = [
  '....xxxx....',
  '...xxxxxx...',
  '...xx..xx...',
  '..xx....xx..',
  '..x......x..',
  '..x......x..',
  '..x......x..',
  '..x......x..',
  '..xx....xx..',
  '...xxxxxx...',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '.....xx.....',
  '....xxxx....',
  '...xxxxxx...'
];
const FLAME_0 = [
  '...y..',
  '..yy..',
  '.yyyy.',
  '.yoyy.',
  '.oyyo.',
  '..oo..'
];
const FLAME_1 = [
  '..y...',
  '..yy..',
  '.yyy..',
  '.yyyy.',
  '.oyyo.',
  '..oo..'
];
const FENCE = [
  '................',
  '..x....x....x...',
  '.xxx..xxx..xxx..',
  '..x....x....x...',
  '..x....x....x...',
  'xxxxxxxxxxxxxxxx',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  'xxxxxxxxxxxxxxxx',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...',
  '..x....x....x...'
];

// 枯樹剪影（40×52）
function makeTreeRows() {
  const t = blank(40, 52);
  const stamp = (rows, x, y) => rows.forEach((r, j) => {
    const line = t[y + j].split('');
    for (let i = 0; i < r.length; i++) if (r[i] !== '.') line[x + i] = r[i];
    t[y + j] = line.join('');
  });
  // 樹冠塊
  stamp(['..xxxxxx..', 'xxxxxxxxxx', 'xxxxxxxxxx', '.xxxxxxxx.'], 4, 2);
  stamp(['..xxxxxxxx..', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '.xxxxxxxxxx.'], 20, 6);
  stamp(['.xxxxxxxxxx.', 'xxxxxxxxxxxx', 'xxxxxxxxxxxx', '.xxxxxxxxxx.', '..xxxxxxxx..'], 2, 12);
  stamp(['..xxxxxx..', 'xxxxxxxxxx', '.xxxxxxxx.'], 16, 18);
  // 月光鑲邊
  stamp(['MMMM'], 6, 2);
  stamp(['MMMMM'], 22, 6);
  // 枝幹
  for (let y = 6; y < 22; y++) t[y] = t[y].slice(0, 12) + 'xx' + t[y].slice(14);
  for (let y = 10; y < 26; y++) t[y] = t[y].slice(0, 24) + 'xx' + t[y].slice(26);
  // 主幹（漸寬）
  for (let y = 20; y < 52; y++) {
    const w = y > 44 ? 8 : y > 34 ? 6 : 4;
    const x0 = 17 - Math.floor(w / 2) + (y % 7 === 0 ? 1 : 0);
    t[y] = t[y].slice(0, x0) + 'x'.repeat(w) + t[y].slice(x0 + w);
  }
  return t;
}

// ---------- Reaper Boss（48×56）----------
const REAPER_FACE = [
  '..gwwwwwwwg.',
  '.gwwwwwwwww.',
  '.wggwwwggww.',
  '.wgGwwwgGww.',
  '.wwwwwwwwww.',
  '..wkwwwwww..',
  '..bwbwbwbw..',
  '...bbbbbb...'
];

function reaperBase(sway) {
  const f = blank(48, 56);
  const R = [];
  // 兜帽與長袍（30 寬核心，置於 x=9）
  const robe = blank(30, 49);
  const st = (rows, x, y) => rows.forEach((r, j) => {
    if (y + j >= robe.length) return;
    const line = robe[y + j].split('');
    for (let i = 0; i < r.length; i++) if (r[i] !== '.') line[x + i] = r[i];
    robe[y + j] = line.join('');
  });
  st(['....hh....', '...hhhh...', '..hhhhhh..', '.hhhhhhhh.'], 8, 0);
  st(['hhhhhhhhhhhh', 'hhKKKKKKKKhh', 'hKKKKKKKKKKh', 'hKKKKKKKKKKh', 'hKKKKKKKKKKh',
      'hKKKKKKKKKKh', 'hKKKKKKKKKKh', 'hKKKKKKKKKKh', 'hhKKKKKKKKhh'], 7, 4);
  // 肩膀與袍身（往下漸窄再散開）
  for (let y = 13; y < 40; y++) {
    const w = y < 18 ? 22 : y < 30 ? 18 : 20;
    const x0 = 15 - Math.floor(w / 2) + (sway && y > 30 ? 1 : 0);
    st(['h'.repeat(w)], x0, y);
  }
  // 高光邊
  for (let y = 13; y < 40; y += 3) st(['H'], 5 + (y % 6 === 1 ? 1 : 0), y);
  // 底部布條破爛（兩種擺動）
  const tat = sway
    ? ['hh..hhh..hh..hhh..hh', '.hh..hh..hh...hh....', '.hh...h...hh........', '..h.......hh........']
    : ['.hh..hh..hhh..hh..hh', '..hh..hh..hh...hh...', '...h...hh..h....hh..', '.......hh...........'];
  st(tat, 5, 40);
  // 面部
  const withRobe = place(f, robe, 9, 4);
  return place(withRobe, REAPER_FACE, 16, 9);
}

const BLADE_BIG = [
  'WWWWWWWWWWWWWWWW........................',
  '..ttttttttttttttttttttttttt.............',
  '.....tttttttttttttttttttttttttt.........',
  '..........ttttttttttttttttttttttttt.....',
  '...................ttttttttttttttttTT...',
  '..........................TTTTTTTTTT...'
];
const BLADE_R_SWING = [
  '.........tW...',
  '.......tttW...',
  '.....ttttW....',
  '....ttttW.....',
  '...ttttW......',
  '..ttttW.......',
  '..tttW........',
  '.tttW.........',
  '.tttW.........',
  'tttW..........',
  'tttW..........',
  'tttW..........',
  '.tttW.........',
  '.tttW.........',
  '..tttW........',
  '..ttttW.......',
  '...ttttW......',
  '....ttttW.....',
  '.....ttttW....',
  '.......tttW...',
  '.........tW...'
];
const BLADE_R_UP = [
  '............ttWW....',
  '..........ttttWW....',
  '........ttttWW......',
  '......ttttWW........',
  '....ttttWW..........',
  '...tttWW............',
  '..tttW..............',
  '..ttW...............',
  '.ttW................',
  '.ttW................'
];

function reaperFrame(kind, sway) {
  let f = reaperBase(sway);
  if (kind === 'float') {
    f = place(f, BLADE_BIG, 4, 0);
    const handle = Array.from({ length: 34 }, () => 'vu');
    f = place(f, handle, 40, 5);
    // 持柄的手
    f = place(f, ['ww', 'ww'], 38, 24);
  } else if (kind === 'windup') {
    f = place(f, BLADE_R_UP, 26, 0);
    const handle = Array.from({ length: 20 }, () => 'vu');
    f = place(f, handle, 36, 8);
    f = place(f, ['ww', 'ww'], 34, 20);
  } else if (kind === 'swing') {
    f = place(f, BLADE_R_SWING, 0, 22);
    const handle = ['..vu', '.vu.', 'vu..', 'vu..', 'u...'];
    f = place(f, handle, 10, 18);
    f = place(f, ['ww'], 12, 20);
  } else if (kind === 'cast') {
    // 投擲：手臂前伸，鐮刀已離手
    f = place(f, ['hhh', 'hhhhh', '..www'], 3, 24);
  }
  return f;
}

const PROJ_SCYTHE = [
  '.......tW.......',
  '.......tW.......',
  '......ttW.......',
  '.....tttW.......',
  '....tttt........',
  'WWttttttp.......',
  '..ttttppttttWW..',
  '.......pttttt...',
  '........tttt....',
  '.......Wttt.....',
  '.......Wtt......',
  '.......Wt.......',
  '................',
  '................',
  '................',
  '................'
];

// ---------- 刀氣與升級道具 ----------
const charMap = (rows, map) =>
  rows.map((r) => [...r].map((c) => map[c] ?? c).join(''));

const WAVE_0 = [
  'tW........',
  'ttW.......',
  '.ptW......',
  '.pttW.....',
  '..pttW....',
  '..pttWW...',
  '..pttWW...',
  '..pttW....',
  '.pttW.....',
  '.ptW......',
  'ttW.......',
  'tW........'
];
const WAVE_1 = charMap(WAVE_0, { W: 't', t: 'T', p: 'P' });

const ITEM_WAVE_0 = [
  '......WW......',
  '.p...WWt...p..',
  '....WWtt......',
  '...WWtt.......',
  '...Wtt....p...',
  '..WWtt........',
  '..Wtt.........',
  '..Wtt.........',
  '..WWtt....p...',
  '...Wtt........',
  '...WWtt.......',
  '.p..WWtt......',
  '.....WWt..p...',
  '......WW......'
];
const ITEM_WAVE_1 = charMap(ITEM_WAVE_0, { W: 't', t: 'W', p: 'P' });

// ---------- 亡靈追蹤火（SOUL FIRE）----------
const FIRE_0 = [
  '....g.....',
  '....gg....',
  '...ggg....',
  '...gggg...',
  '..ggGgg...',
  '..gGWGgg..',
  '.ggGWWGg..',
  '.ggGWGgg..',
  '..ggGgg...',
  '..ggggg...',
  '...ggg....',
  '..........'
];
const FIRE_1 = [
  '.....g....',
  '....gg....',
  '....ggg...',
  '...gggg...',
  '...gGgg...',
  '..gGWGgg..',
  '..gGWWGg..',
  '.ggGWGgg..',
  '..ggGggg..',
  '..ggggg...',
  '...gg.....',
  '..........'
];

const ITEM_FIRE_0 = [
  '......gg......',
  '.g...gggg..g..',
  '.....gggg.....',
  '....gGWGg.....',
  '..g.gGWWGg.g..',
  '....ggGGgg....',
  '.....gggg.....',
  '..g...gg...g..',
  '....SSSSSS....',
  '...SssssssS...',
  '....SSSSSS....',
  '.....S..S.....',
  '....SSSSSS....',
  '..............'
];
const ITEM_FIRE_1 = charMap(ITEM_FIRE_0, { W: 'G', G: 'W', g: 'g' });

// ---------- HUD ----------
const HUD_SCYTHE = [
  '.WWWWWWWWW..',
  'tttttttttt..',
  '......uu....',
  '......uu....',
  '......uu....',
  '......uu....',
  '......uu....',
  '......uu....',
  '.....uuu....',
  '............'
];
const HUD_SCYTHE2 = [
  '.WWWWWWWWW..',
  'tttttttttt..',
  'pp....uu....',
  '..pp..uu....',
  'pp....uu....',
  '......uu....',
  '......uu....',
  '......uu....',
  '.....uuu....',
  '............'
];
const HUD_FIRE = [
  '...g....',
  '..gg....',
  '..ggg...',
  '.gGWg...',
  '.gGWGg..',
  '.ggGgg..',
  '..ggg...',
  '........'
];
const HUD_SKULL = [
  '..wwww...',
  '.wwwwww..',
  '.wkwwkw..',
  '.wwwwww..',
  '..wbbw...',
  '..bwwb...',
  '...bb....',
  '.........'
];
const PAUSE_ICON = [
  '............',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '..www..www..',
  '............'
];
const ARROW = [
  '.....ww.....',
  '....www.....',
  '...wwww.....',
  '..wwwwwwwww.',
  '.wwwwwwwwww.',
  '..wwwwwwwww.',
  '...wwww.....',
  '....www.....',
  '.....ww.....'
];

// ---------- 數字字型（4×6）----------
const DIGITS = {
  '0': ['wwww', 'w..w', 'w..w', 'w..w', 'w..w', 'wwww'],
  '1': ['..w.', '.ww.', '..w.', '..w.', '..w.', '.www'],
  '2': ['wwww', '...w', 'wwww', 'w...', 'w...', 'wwww'],
  '3': ['wwww', '...w', '.www', '...w', '...w', 'wwww'],
  '4': ['w..w', 'w..w', 'wwww', '...w', '...w', '...w'],
  '5': ['wwww', 'w...', 'wwww', '...w', '...w', 'wwww'],
  '6': ['wwww', 'w...', 'wwww', 'w..w', 'w..w', 'wwww'],
  '7': ['wwww', '...w', '..w.', '..w.', '.w..', '.w..'],
  '8': ['wwww', 'w..w', 'wwww', 'w..w', 'w..w', 'wwww'],
  '9': ['wwww', 'w..w', 'wwww', '...w', '...w', 'wwww'],
  'x': ['....', 'w.w.', '.w..', 'w.w.', '....', '....']
};

// ============================================================
// 註冊入口
// ============================================================
export function registerAllSprites(scene) {
  // 主角
  framesFromRows(scene, 'mort_idle', [
    mortBase(LEGS_IDLE),
    mortBase(LEGS_IDLE, 0, 1)
  ]);
  framesFromRows(scene, 'mort_run', [
    mortBase(LEGS_RUN_A),
    mortBase(LEGS_RUN_B, 0, 1),
    mortBase(flipH(LEGS_RUN_A).map(r => r), 0, 0),
    mortBase(LEGS_RUN_B, 0, 1)
  ]);
  framesFromRows(scene, 'mort_jump', [mortBase(LEGS_JUMP)]);
  framesFromRows(scene, 'mort_fall', [mortBase(LEGS_FALL)]);
  framesFromRows(scene, 'mort_atk', [mortAttack(0), mortAttack(1), mortAttack(2)]);
  framesFromRows(scene, 'mort_hurt', [mortBase(LEGS_FALL, -1, 1)]);

  // 敵人
  framesFromRows(scene, 'ghost', [GHOST_0, GHOST_1]);
  framesFromRows(scene, 'ghoul', [GHOUL_A, GHOUL_B]);
  texFromRows(scene, 'hopper', HOPPER);

  // Boss
  framesFromRows(scene, 'reaper_float', [reaperFrame('float', false), reaperFrame('float', true)]);
  texFromRows(scene, 'reaper_windup', reaperFrame('windup', false));
  texFromRows(scene, 'reaper_swing', reaperFrame('swing', false));
  texFromRows(scene, 'reaper_cast', reaperFrame('cast', true));
  texFromRows(scene, 'proj_scythe', PROJ_SCYTHE);

  // 地形與物件
  texFromRows(scene, 'tile_grass', TILE_GRASS);
  texFromRows(scene, 'tile_dirt', TILE_DIRT);
  texFromRows(scene, 'tile_stone', TILE_STONE);
  texFromRows(scene, 'tile_plank', TILE_PLANK);
  texFromRows(scene, 'tile_spike', TILE_SPIKE);
  texFromRows(scene, 'crate', CRATE);
  texFromRows(scene, 'grave1', GRAVE1);
  texFromRows(scene, 'grave2', GRAVE2);
  texFromRows(scene, 'lantern', LANTERN);
  framesFromRows(scene, 'flame', [FLAME_0, FLAME_1]);
  texFromRows(scene, 'fence', FENCE);
  texFromRows(scene, 'tree', makeTreeRows());

  // 拾取物
  framesFromRows(scene, 'skullp', [SKULL_P0, SKULL_P1]);
  texFromRows(scene, 'heart', HEART);

  // 刀氣與升級道具
  framesFromRows(scene, 'wave', [WAVE_0, WAVE_1]);
  framesFromRows(scene, 'item_wave', [ITEM_WAVE_0, ITEM_WAVE_1]);

  // 亡靈追蹤火
  framesFromRows(scene, 'fire', [FIRE_0, FIRE_1]);
  framesFromRows(scene, 'item_fire', [ITEM_FIRE_0, ITEM_FIRE_1]);
  texFromRows(scene, 'hud_fire', HUD_FIRE);

  // HUD 與觸控
  texFromRows(scene, 'hud_scythe', HUD_SCYTHE);
  texFromRows(scene, 'hud_scythe2', HUD_SCYTHE2);
  texFromRows(scene, 'hud_skull', HUD_SKULL);
  texFromRows(scene, 'icon_pause', PAUSE_ICON);
  texFromRows(scene, 'glyph_arrow', ARROW);
  for (const [ch, rows] of Object.entries(DIGITS)) {
    texFromRows(scene, `digit_${ch}`, rows);
  }

  // ---- 程序化貼圖 ----
  // 粒子
  texFromDraw(scene, 'px2', 2, 2, (ctx) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 2, 2); });
  texFromDraw(scene, 'px3', 3, 3, (ctx) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 3, 3); });

  // 揮刀殘影（右半圓弧）
  texFromDraw(scene, 'slash', 28, 28, (ctx) => {
    ring(ctx, 14, 14, 13, 9, 'rgba(255,255,255,0.9)');
    ctx.clearRect(0, 0, 12, 28);
  });

  // 光暈
  texFromDraw(scene, 'glow_y', 48, 48, (ctx) => {
    ctx.globalAlpha = 0.10; disc(ctx, 24, 24, 23, '#ffd94c');
    ctx.globalAlpha = 0.14; disc(ctx, 24, 24, 15, '#ffd94c');
    ctx.globalAlpha = 0.18; disc(ctx, 24, 24, 8, '#fff2b0');
  });
  texFromDraw(scene, 'glow_g', 48, 48, (ctx) => {
    ctx.globalAlpha = 0.10; disc(ctx, 24, 24, 23, '#8df23c');
    ctx.globalAlpha = 0.16; disc(ctx, 24, 24, 12, '#8df23c');
  });
  texFromDraw(scene, 'glow_c', 48, 48, (ctx) => {
    ctx.globalAlpha = 0.10; disc(ctx, 24, 24, 23, '#3df2c8');
    ctx.globalAlpha = 0.16; disc(ctx, 24, 24, 12, '#9df2ff');
  });

  // 月亮
  texFromDraw(scene, 'moon', 40, 40, (ctx) => {
    disc(ctx, 20, 20, 17, PAL['l']);
    disc(ctx, 14, 14, 4, PAL['L']);
    disc(ctx, 25, 22, 3, PAL['L']);
    disc(ctx, 18, 27, 2, PAL['L']);
    ctx.globalAlpha = 0.35;
    disc(ctx, 24, 24, 17, PAL['L']);
    ctx.globalAlpha = 1;
    disc(ctx, 17, 17, 13, PAL['l']);
  });

  // 星空（固定座標，避免每次載入閃動）
  texFromDraw(scene, 'stars', 160, 90, (ctx) => {
    const pts = [
      [8, 12], [24, 40], [37, 8], [52, 62], [66, 24], [80, 50], [95, 10], [104, 70],
      [118, 30], [130, 55], [144, 14], [152, 44], [14, 66], [44, 80], [72, 76],
      [100, 84], [126, 78], [156, 68], [30, 22], [88, 36], [140, 32], [60, 5]
    ];
    pts.forEach(([x, y], i) => {
      ctx.fillStyle = i % 3 === 0 ? '#cbd7ff' : '#6f6a8a';
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    });
  });

  // 遠景：山丘＋墓碑剪影
  texFromDraw(scene, 'farhills', 240, 70, (ctx) => {
    ctx.fillStyle = '#151b2a';
    const hs = [30, 26, 22, 25, 32, 38, 34, 28, 24, 27, 33, 30];
    for (let x = 0; x < 240; x++) {
      const seg = Math.floor(x / 20);
      const t = (x % 20) / 20;
      const h = hs[seg % hs.length] * (1 - t) + hs[(seg + 1) % hs.length] * t;
      ctx.fillRect(x, 70 - Math.floor(h), 1, Math.ceil(h));
    }
    // 遠方十字與枯枝
    ctx.fillRect(30, 26, 2, 12); ctx.fillRect(26, 30, 10, 2);
    ctx.fillRect(150, 20, 2, 14); ctx.fillRect(146, 24, 10, 2);
    ctx.fillRect(200, 30, 2, 10);
  });

  // 霧帶
  texFromDraw(scene, 'mist', 120, 22, (ctx) => {
    ctx.globalAlpha = 0.5;
    [[0, 12, 40, 6], [30, 8, 50, 8], [70, 14, 46, 6], [100, 9, 20, 7]].forEach(([x, y, w, h]) => {
      ctx.fillStyle = '#494461';
      for (let yy = 0; yy < h; yy++) {
        const shrink = Math.floor(yy * 1.5);
        ctx.fillRect(x + shrink, y + yy, Math.max(2, w - shrink * 2), 1);
      }
    });
  });

  // 夜空漸層（含 dither 帶）
  texFromDraw(scene, 'sky', 60, 270, (ctx) => {
    const bands = ['#060511', '#0a0818', '#0f0b20', '#150f2a', '#1b1334', '#221740'];
    const bh = Math.ceil(270 / bands.length);
    bands.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * bh, 60, bh);
      if (i > 0) {
        for (let x = 0; x < 60; x += 2) {
          ctx.fillRect(x + (i % 2), i * bh - 1, 1, 1);
        }
      }
    });
  });

  // 觸控環
  texFromDraw(scene, 'ring_btn', 40, 40, (ctx) => {
    ring(ctx, 20, 20, 19, 16, 'rgba(242,234,216,0.9)');
    ctx.globalAlpha = 0.25;
    disc(ctx, 20, 20, 15, '#12101c');
  });
}
