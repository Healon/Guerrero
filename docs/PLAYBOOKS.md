# PLAYBOOKS.md — 改版劇本＋測試協議

> 讀者：後續接手的 AI 模型。每種常見改動照對應劇本走，步驟不可跳。
> 所有劇本共同的收尾：AC 記錄 → 最小回歸清單 → build → commit → push。

## 劇本 1：調難度／手感

1. 只動 `src/config.js`。任何其他檔案出現數值調整＝走錯路。
2. 參數速查：
   - 手感：`PLAYER.runSpeed`（速度）、`jumpVel`（跳高，-350≈53px；改它必重驗 §9 可達性）、`coyoteMs/bufferMs`（容錯）、`iframesMs`（受擊無敵）
   - 玩家強度：`maxHp`、`lives`、`attackCooldownMs`
   - 敵人：`ENEMIES.<種類>.{hp,speed,dmg,aggroR}`
   - Boss：`BOSS.{hp,phase2At,hoverMs,swoopSpeed,recoverMs}`（recoverMs＝輸出窗口，加大變簡單）
   - 武器：`WEAPON.{waveSpeed,waveMaxDist}`、`SOULFIRE.{speed,steer,acquireR,lifeMs,launchVx,launchVy,arcGravity,armMs}`
     （**lifeMs×speed 必須 ≥ acquireR 的實際到達需求**，否則「追一半熄滅」——已踩過；
     動線＝前上拋物線出手→armMs 後索敵→無目標過弧頂轉平飛到 lifeMs 盡頭）
3. 驗證：改移動/跳躍 → 跑回歸 B1/B2；改傷害 → F2d＋G4b；改關卡幾何相關 → 實跳。

## 劇本 2：加新敵人

1. `src/art/sprites.js`：pixel-string 幀（照 SPEC §7；色碼先進 PAL）＋ `framesFromRows` 註冊。
2. `src/scenes/BootScene.js`：`mk('<name>_anim', '<name>', [0,1], fps)`。
3. `src/entities/enemies.js`：繼承 `BaseEnemy`（自動獲得 hp/lastSwing/lastFire/hitByScythe/hitByFire/die）。只需寫 constructor（body 尺寸、巡邏參數）＋ `update(time, player)`。
4. `src/config.js`：`ENEMIES.<name> = {hp, speed, dmg, dropChance, …}`。
5. `src/level/graveyard.js`：`enemies` 陣列加放置（含巡邏範圍 r）。
6. `src/scenes/GameScene.js` `buildEnemies()`：加分支；**入對群組**——飛行穿牆的進 `airEnemies`（勿加地形 collider）、走地的進 `groundEnemies`。
7. 若會發射投射物：新建 physics group＋照 SPEC §5 上限掃描（壽命/數量/銷毀）＋依 SPEC §3「新投射物的矩陣宣告義務」明文宣告每種互動（建議預設：命中玩家即銷毀、碰地即銷毀）；玩家中彈走 `player.takeDamage(dmg, fromX)`——**玩家側不開去重欄位**（無敵幀即防重複，SPEC §4 方向性）。
8. 型態先例：站定型敵人（砲台類）進 `groundEnemies`（受重力＋地形 collider），constructor 免巡邏參數、update 只寫偵測與攻擊；關卡資料用站定型格式（SPEC §9）。
9. AC：新增小節（存在/行為/可被近戰+刀氣+火各殺一次/掉落；有敵彈則加「命中扣血＋銷毀時機」斷言）；回歸清單全跑。

## 劇本 3：加新武器／升級

1. **獨立 registry key**（布林或等級），`GameScene.init()` 初始化——不要疊在 weaponLv 上（拾取順序必須自由）。
2. **新去重欄位＋新 id 值域**（SPEC §4）：例如第三武器用 `boltId`（從 2e9 起）＋敵人 `lastBolt` 欄位＋ `hitByBolt()`（內文呼叫 `applyHit`/`applyBossHit`）。
3. 觸發點：`Player.startAttack` 的 delayedCall 內加 `if (registry.get('<key>')) scene.spawn<X>(this)`。
4. 投射物：照 `spawnWave`（直線）或 `spawnSoulFire`（追蹤）pattern；上限掃描；overlap 註冊（含 `startBossFight` 內的 boss×新投射物）。
5. 道具：`LEVEL.powerups` 加 `{t,k,kind}`；`buildPickupsAndCrates` 的 powerup 迴圈加貼圖分支；`collect()` 加 kind 分支（文字+爆+閃光照現有 pattern）。
6. HUD：`UIScene` 加小圖示＋`onData` case＋`refreshAll`。
7. AC 必含四條：未拾取不觸發／拾取後觸發／**貼臉單揮傷害總和恰為 N**（防雙倍矩陣）／跨死亡保留+新輪重置。
8. 平衡註記：全升級疊加的總輸出寫進報告，boss 血量是否補償由 Lin 決定。

## 劇本 4：加新關卡

1. 複製 `src/level/graveyard.js` 為 `level/<name>.js`，照 SPEC §9 格式填資料。
2. 場景：優先參數化 GameScene（init 收 level 資料）而非複製場景類；貼圖換皮（tile 紋理/背景層）走 sprites.js 加新 tile。
3. **Boss 契約**：`boss.gateT` 封門＋鏡頭鎖定＋`bossCheckpoint`（競技場內）三件事必須同時設定（SPEC §10.4）。
4. 可達性：每個平台/道具/尖刺間距照 §9 硬數字檢查，然後**模擬按鍵實跳全程**（本檔測試協議）。
5. 過關銜接：Clear 場景導向下一關或 Title；lives/skulls 跨關語義先問 Lin。

## 劇本 5：修 bug

1. 先用測試協議**重現**（逐幀模擬），拿到失敗斷言——不可只憑描述開改。
2. 根因分析寫進 commit body；「症狀修補」（在錯誤處加 if 擋）需標註 TODO 真因。
3. 修後：原重現腳本轉綠＋最小回歸清單＋報告追記（reports/ 慣例：症狀/根因/修法/驗證）。
4. 常見假 bug（先排除再開工）：preview 分頁 RAF 凍結（畫面全暗/角色懸空≠壞）、
   tween 在逐幀測試下不動（≠邏輯壞，見 SPEC §6）、CDN 十分鐘舊快取（≠沒部署上去）。

---

## 測試協議（loop.step 逐幀模擬）

背景：preview 分頁的 RAF 會被瀏覽器暫停，遊戲凍結。**用手動驅動遊戲迴圈**做決定性測試——這也是本專案所有 AC 的驗證方式。

### Driver（貼進 preview_eval 或瀏覽器 console）

```js
const g = window.__GG;                       // main.js 暴露的 game 實例
window.__T = performance.now();
window.__step = (n = 1) => { for (let i = 0; i < n; i++) { window.__T += 16.67; g.loop.step(window.__T); } };
window.__key = (c, d = true) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { keyCode: c, which: c, bubbles: true }));
window.__swing = () => { window.__key(88, true); window.__step(2); window.__key(88, false); };
// keyCode：LEFT 37 RIGHT 39 UP 38 Z 90 X 88 SPACE 32 P 80 T 84
```

- 頁面剛導航後場景可能還沒啟動：先 `__step(20~30)` 再取 `g.scene.getScene('Game')`。
- 用 `http://localhost:5199/?debug=1&auto=1` 直入關卡＋掛 `window.__DBG`
  （`warp(t)`、`hurtBoss(n)`、`god()`）。
- 觸控模擬用 MouseEvent（`mousedown`/`mouseup` 於 canvas 客座標）——
  **Phaser 不吃合成 pointerdown**。
- 60 幀＝1 秒。時序斷言全部用幀數推算，不用 setTimeout。

### 常用斷言片段

```js
sc.player.body.blocked.down            // 落地
sc.registry.get('hp'|'skulls'|'bossHp'|'weaponLv'|'soulFire')
sc.waves.countActive(true)             // 場上刀氣數；fires 同理
sc.boss?.state                         // 'hover'|'swoopTele'|...|'recover'
g.scene.isActive('Clear'|'Over'|'Title')
sc.physics.world.colliders.getActive().length   // 碰撞器清單
```

Boss 可控測試法:`b.state='recover'; b.stateUntil=sc.time.now+999999; b.body.reset(x,200)`
把 boss 固定在落地硬直（可打窗口），再做傷害矩陣斷言。

### Staging 陷阱清單（每一條都真實踩過，共踩五次）

1. **別把測試角色 reset 在深淵上空**。坑位（磚）：18-20、39-41、59-60、79-82、101-103、125-127、149-151、171-173。放錯＝角色墜落中，揮刀無效/座標亂飄，誤判成 bug。
2. **道具/磚中心 x＝t×16+8**，不是 t×16（差 8px 會讓拾取變 3px 邊緣重疊，機率性失敗）。
3. **高速墜落會穿過拾取判定**（幀間位移>重疊窗）。測拾取用「道具正上方 30px 慢速落下」。
4. boss 戰開打後鏡頭鎖競技場（bounds x≥2864）——之後 warp 回前段擺拍，截圖仍是競技場。
5. 逐幀模擬下 FPS 顯示值無意義（用 wall-time per step 評效能）；tween 幾乎不動（正常）。

### 最小回歸清單（任何改動交付前全跑）

| 項 | 內容 | 斷言 |
|---|---|---|
| R1 | 右移 0.5s | Δx ≈ 54px |
| R2 | 短跳 vs 長跳 | 高差 ≥12px |
| R3 | 尖刺 | 踩入扣 2＋上彈；起跳可無傷跨越 |
| R4 | F2d 刀氣防雙倍 | 僅刀氣時 boss 貼臉單揮恰 -1 |
| R5 | G4b 火焰去重分離 | 雙升級 boss 貼臉單揮恰 -2（非 -3） |
| R6 | boss 戰死亡重生 | 玩家與 boss 都在鏡頭可見範圍 |
| R7 | console | error 級 0 筆 |
