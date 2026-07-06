# GRAVE GENT 單關 demo — 完工報告

> 追記 2026-07-06（第四輪，上線後修 bug）：Boss 戰重生鏡頭死鎖。
> 症狀：boss 戰中途死亡重生後看不到主角與 boss、且被封門擋在競技場外。
> 根因：boss 觸發時鏡頭 bounds 鎖進競技場（gate 右側），但死亡重生仍用
> 關卡中段燈籠 checkpoint（x=2696），該點在封閉 gate（x=2864）外，落在
> 鏡頭可見範圍 [2864,3344] 左外側 → 看不到人且回不去（死鎖）。
> 修法：startBossFight 設 bossCheckpoint＝競技場入口（gate+4 磚）；死亡重生
> 若 boss 戰進行中改用此點，並清場上迴旋鐮刀、把 boss 拉回中央 hover 給喘息、
> 鏡頭 centerOn 重生點。實測：重生後主角(2936)與 boss(3205)皆在可見範圍；
> 回歸一般 checkpoint 重生(回燈籠 2696)不受影響、boss 戰重生後可續戰至 Clear。
> 註：此為邏輯 bug，非「上限崩潰面掃描」涵蓋範圍；教訓＝鏡頭 bounds 與重生點
> 必須成對檢查，任一改動要同步驗證另一個。經 Lin 確認 boss 重生機制維持現況
> （回入口、Boss 保留血量），不再更動規則。

> 追記 2026-07-06（第三輪）：部署上線。
> **https://healon.github.io/Guerrero/** ・repo https://github.com/Healon/Guerrero（公開）
> GitHub Pages（Actions workflow 自動部署，push main 即上線）＋PWA 全套
> （manifest／icons／版本化 SW／直向遮罩）。上限掃描發現並修掉「SW 快取隨
> 部署次數無限膨脹」問題：build 蓋版號進 cache 名、activate 整組清舊版。
> 驗證：build 綠、prod preview smoke 過（fixedStep=true）、CI 首跑 success、
> 線上四資源 200、SW 版號隨部署輪替。`.claude/settings.local.json` 於 push
> 前移出版控並 gitignore。真機四項（可玩/有聲/加入主畫面/離線）由 Lin 驗收。

> 追記 2026-07-06（第二輪）：新增武器升級系統 SPIRIT BLADE（刀氣）。
> 拾取點在跳台頂（t=118）；揮刀射出 250px/s、150px 射程刀氣；沿用 swingId
> 去重防「近戰＋刀氣」雙倍傷害；死亡保留、新輪重置；HUD 圖示切換充能版。
> AC F1–F5 全數逐幀實測通過（見 docs/AC.md F 節）。測試中曾兩度誤判，
> 皆為測試擺位問題非遊戲 bug：站位踩尖刺吃硬直、把玩家放在閘門外側射牆。

- 日期：2026-07-06
- 範圍：Kraino 風格致敬作、Phaser 3 + Vite、單關墓園 demo、全原創程式生成素材、硬派手感
- 決策依據：Lin 四項選擇（Phaser 3／單關 demo／原創像素圖／貼近原作硬派）

## 交付物

| 項目 | 位置 |
|---|---|
| 遊戲本體 | `src/`（14 檔，約 2,600 行）＋ `index.html` |
| 驗收條件 | `docs/AC.md` |
| 執行說明 | `README.md` |
| 啟動 | `npm run dev` → http://localhost:5199 |

## AC 驗證結果（模擬輸入逐幀實測，非目視）

| AC | 結果 | 證據 |
|---|---|---|
| A1 console 零錯誤 | ✅ | preview console error 級別 0 筆（全程） |
| A2 標題→開始 | ✅ | Title 場景先啟動；Z 後 scenes=[Game,UI] |
| A3 480×270 pixelArt | ✅ | 截圖確認像素銳利 |
| B1 左右移動 | ✅ | 0.5s 位移 54px（=108px/s 設定值） |
| B2 可變跳高＋coyote＋緩衝 | ✅ | 短按跳 21px vs 長按 50px（差 30px） |
| B3 鐮刀判定 | ✅ | 食屍鬼 hp 2→1（單揮單段，swingId 防多段） |
| B4 受擊 | ✅ | hp 6→5、擊退成立、無敵幀內持續重疊不再扣血 |
| C1 三種敵人 | ✅ | 幽靈追蹤收距至 71px；食屍鬼範圍巡邏；跳跳骷髏朝玩家跳（vy<-100） |
| C2 破箱＋貨幣 | ✅ | 木箱數 -1、拾取後 skulls +2 |
| C3 尖刺／深淵 | ✅ | 尖刺 hp 6→4＋上彈；深淵 lives-1 且回檢查點重生 |
| C4 檢查點 | ✅ | 燈籠激活＋補滿血；死後重生於 x=1224（燈籠位置） |
| C5 命歸零 | ✅ | Game Over 場景啟動；Z 重開後 lives=3 |
| D1 boss 觸發 | ✅ | 封門碰撞體生成、鏡頭鎖競技場（x=2864）、血條 16/16 |
| D2 boss 行為 | ✅ | P1 觀測到 swoop＋slam 全循環；hp≤8 進 P2、出現 throwCast＋迴旋鐮刀實體 |
| D3 擊殺過關 | ✅ | 死亡演出→STAGE CLEAR 場景、Game 暫停 |
| E1 觸控 | ✅ | ?touch=1 四鍵渲染；真實 mouse 事件按住右移 56px、放開停、跳躍鍵起跳 |
| E2 音效/BGM | ⚠️ 程式碼完成 | WebAudio 合成 15 種音效＋2 模式 BGM；聽感需 Lin 本機確認（preview 無音訊輸出） |
| E3 效能 | ✅ | 0.29ms/幀（update+phys理+render 實測），60fps 餘裕 50 倍以上 |
| E4 素材原創 | ✅ | 全部程式生成（pixel-string／程序化 canvas），無外部資源 |

## 開發中發現並修正的問題

1. **燈籠 overlap 在 player 建立前註冊**（object1=undefined，物理迴圈崩潰）→ 移至 player 建立後註冊。
2. **Phaser 3.87 tween 走牆鐘時間**：分頁凍結／手動步進下 tween 幾乎不動。Boss 進場原靠 tween onComplete 推進狀態→改為 Clock 時間戳驅動。**原則：關鍵遊戲邏輯不掛在 tween 回調上，tween 只做純視覺。**
3. 觸控箭頭方向畫反、boss 血條與暫停鍵重疊、月亮視差飄移、枯樹對比不足→均已修。

## 測試方法備忘（之後 session 可重用）

Preview 分頁在背景時 RAF 暫停，遊戲凍結≠bug。自動化驗證用：
```js
window.__T = performance.now();
window.__step = n => { for (let i=0;i<n;i++){ window.__T+=16.67; __GG.loop.step(window.__T); } };
```
配合 KeyboardEvent/MouseEvent 派發即可逐幀決定性模擬（本報告全部 AC 依此實測）。

## 未做（demo 範圍外）

多關卡、商店（骷髏頭目前僅累計）、副武器、手把支援、存檔、行動端 PWA 打包。
疊箱破壞下層時上層懸空（復古式浮空，屬已知取捨）。

## Git

已 `git init`（main），全部檔案為 untracked。依全域規則不主動 commit——
首次 commit 由 Lin 執行：`git add -A && git commit -m "feat: GRAVE GENT graveyard demo"`。

## 對抗審查（fresh-context agent，讀碼一輪，總評：可放行）

9 條發現，處置如下（修正後均以 preview 逐幀回歸驗證通過）：

| 嚴重度 | 發現 | 處置 |
|---|---|---|
| HIGH | UIScene 每次重啟 `addPointer(3)`，全域 pointer 池無限增生 | ✅ 已修：移除該行，統一由 main.js `activePointers: 4` 管理；回歸實測重啟兩輪 pointer 數 5→5 |
| HIGH | boss 銷毀後 `this.boss` 未歸 null，update 每幀觸摸已銷毀物件 | ✅ 已修：`onBossDefeated` 先歸 null；回歸實測擊殺後 `boss === null` |
| MED | `scene.restart()` 不清自訂事件，`mort-died` 監聽累積 | ✅ 已修：註冊前先 `off`；回歸實測重啟兩輪維持 1 |
| MED | boss `slamFall` 是唯一無時間保險絲的狀態（日後加地形碰撞會軟鎖） | ✅ 已修：加 2.5s 強制落地 |
| MED | 死亡飛行中屍體仍可拾取／觸發檢查點 | ✅ 已修：`collect`/`activateCheckpoint` 加 `player.dead` 守門 |
| LOW | 迴旋鐮刀不因命中而消失，可隨無敵幀循環重複傷害 | 設計選擇保留（與接觸傷害同規則，boomerang 本就是持續威脅） |
| LOW | 每幀配置 controls 物件字面量 | 技術債記錄，demo 規模無感 |
| LOW | 逐磚 Image 而非 tilemap（~700 物件） | 技術債記錄，關卡擴張時再改 tilemap |
| LOW | 兩種檢查點 y 差 2px | ✅ 已修：統一 |
