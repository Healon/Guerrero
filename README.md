# GRAVE GENT

向 Kraino 致敬的復古動作平台遊戲 demo——戴禮帽的骷髏紳士 Mort，提著鐮刀穿越墓園之夜。
**全部素材（像素圖、音效、BGM）皆由程式生成，零外部資源、零版權疑慮。**

**▶ 線上遊玩：<https://healon.github.io/Guerrero/>**（手機可「加入主畫面」全螢幕、離線可玩）

![tech](https://img.shields.io/badge/Phaser-3.87-8a4df2) ![tech](https://img.shields.io/badge/Vite-6-8df23c)

## 執行

```bash
npm install
npm run dev        # http://localhost:5199
npm run build      # 產出 dist/（可部署任何靜態主機）
```

手機測試：同網段裝置連 `http://<Mac 的 IP>:5199`（vite 已開 `host: true`），觸控按鍵會自動出現。

## 操作

| 動作 | 鍵盤 | 觸控 |
|---|---|---|
| 移動 | ←→ / A D | 左下 ← → |
| 跳躍（可變高度） | Z / Space / ↑ / W | 右下 ↑ |
| 鐮刀攻擊 | X / J / K | 右下 鐮刀鍵 |
| 暫停 | P / Esc | 右上 ⏸ |
| 靜音 | M | — |

## URL 參數（開發用）

- `?auto=1` 跳過標題直入關卡
- `?touch=1` / `?touch=0` 強制開/關虛擬按鍵
- `?debug=1` 顯示 FPS＋掛載 `window.__DBG`（warp/hurtBoss/god）
- `?physdebug=1` 顯示物理碰撞框

## 遊戲內容（單關 demo）

墓園之夜：3 種敵人（追蹤幽靈、巡邏食屍鬼、跳跳骷髏頭）、可破壞骷髏木箱、
骷髏頭貨幣、尖刺與深淵、2 個燈籠檢查點、關底 **THE REAPER** 兩階段 boss
（漂浮突進斬／飛天落斬／P2 迴旋鐮刀投擲）、STAGE CLEAR 結算。3 命制，硬派手感
（coyote time、輸入緩衝、可變跳高、受擊擊退＋無敵幀）。

**武器升級**：中段跳台頂端藏著 **SPIRIT BLADE**（青色光暈的能量鐮刃）。取得後
每次揮刀射出一道刀氣（150px 射程、可破箱），同一揮的近戰與刀氣不會對同一目標
重複計傷。升級跨死亡保留，Game Over 重開才重置。參數在 `config.js` 的 `WEAPON`。

## 專案結構

```
src/
  config.js            ← 全部手感/難度參數（調參只動這裡）
  main.js              入口與 Phaser 設定
  art/pixelart.js      pixel-string → 貼圖引擎
  art/sprites.js       全部原創像素素材定義
  audio/sfx.js         WebAudio 合成音效＋BGM 音序器
  entities/            Player / 三種敵人 / Reaper boss
  level/graveyard.js   關卡資料（地面段/平台/尖刺/敵人配置）
  scenes/              Boot / Title / Game / UI / GameOver / Clear
docs/AC.md             驗收條件與驗證方式
reports/               開發報告
```

## 調參指南

改 `src/config.js` 即可：`PLAYER.jumpVel`（跳高）、`PLAYER.runSpeed`、
`PLAYER.iframesMs`（無敵時間）、`ENEMIES.*`、`BOSS.*`（血量/階段門檻/攻速）。
覺得太難先調：`PLAYER.maxHp: 6→8`、`BOSS.hp: 16→12`。

## 已知限制（demo 範圍）

- 疊起來的木箱打掉下層時上層會懸空（復古遊戲式浮空，暫不處理）
- BGM 為 2 小節循環的極簡 chiptune，之後可擴寫
- 瀏覽器分頁切到背景時遊戲整體凍結（RAF 暫停），回到前景繼續
