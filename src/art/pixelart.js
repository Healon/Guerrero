// ============================================================
// 像素美術引擎：pixel-string → Phaser CanvasTexture
// 所有素材皆由程式生成，全原創。
// ============================================================

// 全域調色盤（單一事實源：所有 sprite 共用，維持風格一致）
export const PAL = {
  '.': null,
  'K': '#06050c', // 最深黑
  'k': '#12101c', // 墨線
  'w': '#f2ead8', // 骨白
  'W': '#ffffff', // 純白高光
  'b': '#c8bda0', // 骨陰影
  'B': '#8d8470', // 骨深影
  'h': '#1c1826', // 禮帽深
  'H': '#332c48', // 禮帽高光
  'p': '#8a4df2', // 紫（帽帶、魔力）
  'P': '#5c2fb0', // 紫深
  'c': '#2a2438', // 大衣
  'C': '#403a54', // 大衣亮
  'g': '#8df23c', // 亡靈綠（HP、boss 輝光）
  'G': '#4c9e1e', // 綠深
  'e': '#9df2dc', // 幽靈青
  'E': '#3aa88a', // 幽靈青深
  'r': '#f24c5c', // 紅
  'R': '#a02838', // 紅深
  'o': '#ff9c2e', // 橘（眼火）
  'O': '#c05e10', // 橘深
  'y': '#ffd94c', // 燈黃
  'Y': '#b08818', // 黃深
  'd': '#4a3626', // 土
  'D': '#33241a', // 土深
  'u': '#7a5a34', // 木
  'U': '#5c4126', // 木深
  'v': '#9a7848', // 木亮
  'n': '#35714f', // 墓園草
  'N': '#1f4a33', // 草深
  's': '#5a5a72', // 石
  'S': '#3d3d52', // 石深
  'Z': '#8a8aa4', // 石亮
  'm': '#6f6a8a', // 霧灰紫
  'M': '#494461', // 霧深
  'q': '#7f5ea8', // 食屍鬼皮
  'Q': '#5d4380', // 食屍鬼皮深
  't': '#c9d6e8', // 鐮刀鋼
  'T': '#8a9ab8', // 鋼深
  'x': '#242c3c', // 夜色剪影（柵欄）
  'f': '#151b2a', // 遠景剪影
  'l': '#dbe8d4', // 月亮
  'L': '#a8bfa0'  // 月亮陰影
};

/** 產生 w×h 全透明畫布字串陣列 */
export function blank(w, h) {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

/** 將 art 蓋印到 base 的 (x,y)，非 '.' 者覆寫；回傳新陣列 */
export function place(base, art, x, y) {
  const out = base.slice();
  for (let j = 0; j < art.length; j++) {
    const yy = y + j;
    if (yy < 0 || yy >= out.length) continue;
    const line = out[yy].split('');
    const row = art[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      const xx = x + i;
      if (xx >= 0 && xx < line.length) line[xx] = ch;
    }
    out[yy] = line.join('');
  }
  return out;
}

/** 水平翻轉 */
export function flipH(rows) {
  return rows.map((r) => r.split('').reverse().join(''));
}

/** 註冊單張 pixel-string 貼圖 */
export function texFromRows(scene, key, rows, pal = PAL) {
  if (scene.textures.exists(key)) return;
  const h = rows.length;
  let w = 0;
  for (const r of rows) w = Math.max(w, r.length);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
}

/** 註冊一組動畫幀（keys: base_0, base_1, ...），回傳 key 陣列 */
export function framesFromRows(scene, baseKey, framesRows, pal = PAL) {
  const keys = [];
  framesRows.forEach((rows, i) => {
    const k = `${baseKey}_${i}`;
    texFromRows(scene, k, rows, pal);
    keys.push(k);
  });
  return keys;
}

/** 以自訂 canvas 繪製函式建貼圖（給圓形、漸層等程序化素材用） */
export function texFromDraw(scene, key, w, h, drawFn) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  drawFn(tex.getContext(), w, h);
  tex.refresh();
}

/** 逐列掃描畫「實心像素圓」（避免 arc 反鋸齒糊邊） */
export function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

/** 像素圓環 */
export function ring(ctx, cx, cy, rOuter, rInner, color) {
  for (let dy = -rOuter; dy <= rOuter; dy++) {
    const dxO = Math.floor(Math.sqrt(rOuter * rOuter - dy * dy));
    const dxI = Math.abs(dy) <= rInner
      ? Math.floor(Math.sqrt(rInner * rInner - dy * dy))
      : -1;
    ctx.fillStyle = color;
    if (dxI < 0) {
      ctx.fillRect(cx - dxO, cy + dy, dxO * 2 + 1, 1);
    } else {
      ctx.fillRect(cx - dxO, cy + dy, dxO - dxI, 1);
      ctx.fillRect(cx + dxI + 1, cy + dy, dxO - dxI, 1);
    }
  }
}
