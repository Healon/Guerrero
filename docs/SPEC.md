# SPEC.md — GRAVE GENT 架構規格與不可違反契約

> 讀者：後續接手的 AI 模型與開發者。本檔是架構的單一事實源。
> 「契約」節（§2–§6、§10、§11）為硬規則；其餘為現況描述。
> 更新規則：改了架構就同步改本檔；只調參數不用動本檔。

## §1 架構總覽

場景流轉：
```
Boot（生成全部貼圖+動畫）
 └→ Title ──Z/tap──→ Game ＋ UI（並行，UI 由 Game.create 啟動）
                       │ 命歸零 → Over（overlay，Game 暫停）─Z→ Game.restart
                       │ 擊殺 boss → Clear（overlay）─Z→ Title
                       └ P/Esc → Game 暫停，UI 顯示 PAUSED 並負責 resume
```
模組相依方向（單向，禁止反向 import）：
config ← 所有人；art/pixelart ← art/sprites ← BootScene；
entities ← GameScene；level/graveyard ← GameScene；audio/sfx ← 各處。
GameScene 是唯一的「指揮」：實體生成、碰撞註冊、投射物迴圈、流程控制都在它。

## §2 Registry 契約表（跨場景狀態的唯一通道）

| key | 型別 | 初始化 | 寫入者 | 讀取者 | 生命週期 |
|---|---|---|---|---|---|
| hp | int | Game.init=maxHp | Player.takeDamage、checkpoint、heart、respawn | UIScene | 每輪重置 |
| maxHp | int | Game.init | — | UIScene、heal 邏輯 | 常數（除非做血上限升級） |
| lives | int | Game.init=3 | onPlayerDied | UIScene | 每輪重置 |
| skulls | int | Game.init=0 | collect、boss 獎勵 | UIScene、Clear | 每輪重置 |
| bossHp/bossMax | int/null | Game.init=null | startBossFight、Reaper | UIScene（null=隱藏血條） | boss 戰期間 |
| paused | bool | Game.init=false | Game(P鍵)、UIScene | UIScene 遮罩 | 即時 |
| weaponLv | 1\|2 | Game.init=1 | collect('wave')→2 | Player(出刀氣?)、UIScene 圖示 | 跨死亡保留、每輪重置 |
| soulFire | bool | Game.init=false | collect('fire')→true | Player(出火?)、UIScene 圖示 | 跨死亡保留、每輪重置 |
| vpad | {left,right,jump,attack} | Game 或 UIScene 建立 | UIScene 觸控按鍵 | Game.update 合成 controls | 同一物件跨場景共用（mutate，不 set） |

**契約**：新增跨場景狀態一律走 registry＋在 Game.init 明確初始化（決定「每輪重置」還是「保留」的語義）；UIScene 靠 `registry.events('changedata')` 被動更新，勿讓 UI 主動輪詢。

## §3 碰撞與判定矩陣

Collider（實體阻擋）：
- player × terrain、planks（單向：僅 checkCollision.up）、crates、gateGroup
- groundEnemies（食屍鬼/跳跳頭）× terrain、planks、crates
- pickups × terrain、planks、crates

Overlap（判定不阻擋）：
- player.hitbox（揮刀判定窗）× airEnemies/groundEnemies → hitByScythe；× crates → breakCrate
- player × 敵人（接觸傷害）、spikes、pickups、lanternZones、bossTrigger、projs（boss 迴旋鐮刀）
- waves（刀氣）× 敵人（hitByScythe）、crates（破箱）、terrain、gateGroup（碰牆即滅）
- fires（追蹤火）× 敵人（hitByFire）——**僅此而已**
- boss 戰時動態註冊：player×boss、hitbox×boss、boss×waves、boss×fires

**刻意的否定項（不是漏寫，勿「補上」）**：
- 幽靈（Ghost）不與地形碰撞（穿牆是特性）
- fires 不碰 terrain/crates/gate（亡靈火穿牆；角色分工＝刀氣破箱走直線、火追活物）
- projs（boss 鐮刀）不碰地形；不因命中玩家而消失（靠無敵幀節流，dodge 導向設計）
- pickups 不受 waves/fires 影響

**新投射物的矩陣宣告義務**：每種新投射物必在本表加一行，明文宣告與
地形／玩家／敵人的每種互動（碰＝什麼效果；不碰＝為什麼）。上列否定項是
各投射物的**個別設計選擇**，不是全域規則——boss 鐮刀命中玩家不消失是
dodge 導向的刻意例外。一般敵方彈道建議預設：**命中玩家即銷毀、碰地即銷毀**；
敵彈參考基準：速度 120–200、壽命 ≤2500ms、同場 ≤3 枚／隻。

## §4 傷害去重契約（本專案最重要的隱形機制）

- 近戰與刀氣共用 `player.swingId`（每次揮刀 +1）；敵人/boss 以 `lastSwing` 記錄。
  同一揮中「近戰已命中的目標，刀氣穿過不再計傷」——防貼臉雙倍。
- 追蹤火用獨立 `fireId`（GameScene.fireSeq 從 1e9 起跳，與 swingId 值域錯開）；
  敵人/boss 以 **獨立欄位 `lastFire`** 記錄。
- **禁止合併 lastSwing / lastFire**。事故實證（2026-07-06）：若火共用 lastSwing，
  「近戰命中→火命中→刀氣抵達」順序會讓火蓋掉近戰紀錄、刀氣重複計傷
  （boss 貼臉單揮 -3 而非 -2）。分離後實測恰 -2。
- **新增任何武器/傷害來源：開自己的去重欄位＋自己的 id 序列（新值域）**，
  並在 AC 補「貼臉單揮傷害總和」斷言。
- 回傳語義：`hitByScythe`/`hitByFire` 回 true＝實際造成傷害（投射物應銷毀）、
  false＝被去重（投射物穿過繼續飛）。
- **方向性**：本節契約只管「玩家攻擊敵人」方向。反方向（敵人／敵彈打玩家）
  **不開去重欄位**——玩家側的防重複扣血＝`takeDamage` 內建無敵幀
  （`PLAYER.iframesMs`），所有敵方傷害共用這一個入口即可。

## §5 實體生命週期規約（上限掃描 checklist）

新增任何「會生成的東西」（投射物/粒子/殘影/掉落物/敵人）前逐項回答：
1. 壽命上限？（毫秒或條件）2. 同場數量上限？（推導：生成頻率×壽命）
3. 附屬物（glow、trail、text）誰銷毀？（銷毀主體時一併，如 destroyFire 銷毀 glowImg）
4. 場景 restart 後會殘留嗎？（Phaser 自動清 GameObject，但**不清**：自訂事件監聽、
   全域 InputManager 狀態、setInterval、window 全域）
5. 命中後消失還是穿透？（寫進 §3 矩陣）

現況上限（參考）：刀氣 ≤3（冷卻 340ms×壽命 800ms）、追蹤火 ≤6（×1800ms）、
火殘影 ≤ 火數×3、粒子 emitter 爆後 900ms 自毀、掉落物 9s 自毀、敵人固定 11 無重生。

## §6 時間鐵則

- 關鍵邏輯（狀態機推進、傷害窗、重生流程、boss 階段）只用 `scene.time.now` /
  `delayedCall`（Clock，走遊戲虛擬時間）。
- tween 只做純視覺（淡出文字、飄動）。**Phaser 3.87 的 tween 走牆鐘時間**：
  分頁凍結或 `game.loop.step()` 逐幀測試下 tween 幾乎不前進。
  事故實證：boss 進場曾掛在 tween onComplete → 永遠卡 intro；已改 Clock 驅動。
- 物理 `fixedStep: true`（main.js）勿移除——手機睡眠喚醒的大 delta 會穿地形。

## §7 美術系統規格

- 全素材程式生成（版權要求：**禁止引入外部圖片/音源**，這是專案身分）。
- pixel-string：字元陣列，每字元查 `pixelart.js` 的 **PAL**（唯一色盤，
  新色先加 PAL 再用；散落 hex 色碼進 sprites＝違規）。`'.'`＝透明。
- 工具：`place(base, art, x, y)` 疊圖（非'.'覆寫）、`flipH`、`charMap(rows, map)`
  換色做第二幀、`blank(w,h)`、程序化用 `texFromDraw`＋`disc`/`ring`（避免 arc 糊邊）。
- 幀命名：`framesFromRows(scene,'name',[F0,F1])` → 貼圖 `name_0`,`name_1`；
  動畫在 BootScene `mk('name_anim','name',[0,1],fps)`。
- 主角幀畫布固定 36×28（身體核心 16 寬置於 x=10），物理 body 10×20 與畫布尺寸解耦。

## §8 音效規格

- `sfx.js` 的 `tone({type,f0,f1,dur,vol,delay,bus})`（振盪器）與
  `noise({f,f1,dur,vol,q,type})`（濾波噪音）合成；新音效＝在 `sfx` 物件加方法。
- BGM 是 lookahead 音序器（setInterval 55ms＋ctx.currentTime 排程）；
  `startBgm('level'|'boss')` 會先 stopBgm（單例保證）；Game shutdown 必 stopBgm。
- iOS 音訊政策：首次手勢 unlockAudio（main.js 已掛，勿移除）。

## §9 關卡資料格式（graveyard.js）

座標系：`t`＝磚 x（0 起）；`k`＝距世界底部的磚數。換算 `tx(t)=t*16+8`（磚中心）、
`ky(k)=270-k*16`（表面頂 y）。世界 210 磚寬（3360px）、高 270px。

| 欄位 | 格式 | 語義 |
|---|---|---|
| grounds | [x0,x1,h] | 地面段（h＝厚度磚數）；段間空隙＝深淵（掉落扣命） |
| ledges | [x0,x1,k] | 實心石台 |
| planks | [x0,x1,k] | 單向木板（僅從上方可站） |
| spikes | [x0,x1,k] | 傷害區（k＝地面 h+1）；**寬度 ≤2 磚**（跳距容錯） |
| crates | {t,k} | 骷髏木箱（k＝所站表面高度；堆疊＝k+1） |
| skulls | {t,k} | 場景貨幣 |
| powerups | {t,k,kind} | 武器升級（kind: 'wave'\|'fire'）；放置後必跑可達性實跳 |
| enemies | 三種型態：飛行型 {t:'ghost',x,y}（y 絕對座標）；巡邏型 {t:'ghoul'\|'hopper',x,r:[x0,x1]}（r＝巡邏磚範圍）；站定型（新種類）{t:'<name>',x}（磚座標，y 由該處地面高度推導、免 r） | 站定型進 groundEnemies（受重力＋地形 collider），update 只寫攻擊邏輯 |
| lanterns | [t,…] | 檢查點 |
| boss | {triggerT,gateT,spawnT,arenaEndT} | gate 與 trigger 至少隔 5 磚 |

可達性硬數字：跳高 53px≈3.3 磚；跳距（助跑滿跳）~65px≈4 磚；
平台階差舒適值 ≤2 磚（32px）；道具離站立面 ≤2 磚可小跳取得。
**改 grounds/planks/ledges 後必以模擬按鍵實跳驗證新路線**（協議見 PLAYBOOKS）。

## §10 場景重啟衛生（對抗審查三修的規約化）

`scene.restart()` 沿用同一 Scene 實例，Phaser 只自動清 GameObject。必守：
1. 自訂事件監聽：`this.events.off('x')` 後再 `.on('x',…)`（GameScene 的 mort-died 模式）。
2. 禁止在 Scene.create 呼叫 `input.addPointer`（每次重啟累積全域 pointer 池）；
   多點觸控數在 main.js `input.activePointers` 統一設定。
3. 持有的實體引用在其銷毀時歸 null（`onBossDefeated` 先 `this.boss=null`）。
4. **camera bounds 與重生點成對**：boss 戰鎖鏡頭進競技場時必須同時設
   `bossCheckpoint`（競技場內）；死亡重生依 `bossStarted&&boss.alive` 選擇重生點。
   事故實證：重生點在封門外＝玩家隱形＋回不去（軟鎖）。

## §11 部署管線

- `npm run build` ＝ `vite build && node scripts/stamp-sw.mjs`：
  把時間戳蓋進 dist/sw.js 的 `__GG_BUILD__`。**佔位符與 stamp 步驟都不可移除**——
  SW cache 名靠它輪替，否則歷代 hashed 資產永留使用者手機（Cache Storage 膨脹到爆配額）。
- SW 註冊條件（index.html）：https 且非 localhost——本機開發/preview 永遠無 SW 快取干擾。
- push main → GitHub Actions（.github/workflows/deploy.yml）→ Pages。
  驗證：`gh run list -R Healon/Guerrero -L 1` 綠＋線上 curl 200。
- GitHub Pages CDN 對靜態檔有 ~10 分鐘邊緣快取；驗最新 sw 用 `?nc=時間戳` cache-buster。
