# GRAVE GENT — 專案工作規範（給所有後續模型：Opus／Sonnet／任何）

> 這是路由中心。動手前先讀完本檔（70 行），再依任務讀 docs/SPEC.md（架構契約）
> 與 docs/PLAYBOOKS.md（改版劇本＋測試協議）。docs/AC.md 是驗收台帳。
> 本檔由 Lin 於 2026-07-06 授權建立；修改本檔需 Lin 當次對話明確授權。

## 技術棧與指令

- Phaser 3.87 + Vite 6，零外部素材（像素圖/音效全程式生成）
- `npm run dev` → http://localhost:5199 ・ `npm run build` → dist/（含 SW 版號蓋章）
- **push main = 自動部署** GitHub Pages → https://healon.github.io/Guerrero/

## 十條鐵則（違反任一條 = 改動不可交付）

1. **調參只動 `src/config.js`**。手感/難度數值散落他處即為錯。
2. **關鍵遊戲邏輯只用 `scene.time`（Clock）驅動**；tween 僅限純視覺。Phaser 3.87 的 tween 走牆鐘時間，分頁凍結/逐幀測試下不前進（實證見 SPEC §6）。
3. **傷害去重欄位不可合併**：近戰/刀氣＝swingId+lastSwing；追蹤火＝fireId+lastFire。新武器必開自己的新欄位（SPEC §4 有事故實證）。
4. **任何新生成物必過上限掃描**：有壽命或數量上限、附屬物（glow/trail）銷毀責任明確、場景重啟可清（SPEC §5 checklist）。
5. **場景重啟衛生**：自訂事件監聽先 off 再 on；不得在 Scene.create 呼叫 addPointer；boss 類銷毀後引用歸 null（SPEC §10，對抗審查三修案例）。
6. **camera bounds 與重生點成對檢查**：改其中一個必驗另一個（曾造成 boss 戰重生死鎖）。
7. **美術走 pixel-string 系統**：色碼只進 `src/art/pixelart.js` 的 PAL；新 sprite 照 SPEC §7 流程（sprites.js 定義→registerAllSprites→BootScene anim）。
8. **關卡改動必驗可達性**：跳高 53px≈3.3 磚、跳距 ~65px、尖刺寬 ≤2 磚；座標系 t/k 與換算見 SPEC §9。
9. **每次改動跑最小回歸清單**（PLAYBOOKS 末節）＋console error＝0，用 loop.step 逐幀模擬驗證，不靠目視。
10. **部署鏈勿破壞**：public/sw.js 的 `__GG_BUILD__` 佔位符、SW 只在非 localhost https 註冊、`npm run build` 必須含 stamp-sw 步驟。

## 標準變更流程

1. 讀 SPEC 相關節 → 2. 對應 PLAYBOOKS 劇本照步驟做 → 3. loop.step 模擬驗證（協議與陷阱清單在 PLAYBOOKS）→ 4. 結果記入 docs/AC.md（新節或追記）→ 5. 跑最小回歸清單 → 6. `npm run build` 綠 → 7. Conventional Commit（feat/fix/docs…，附 Co-Authored-By）→ 8. push（即部署）→ 9. `gh run list` 確認綠＋線上 curl 200。

Git 紀律：不 force push；工作樹不乾淨先報告；commit 前 `git status` 確認無意外檔案（`.claude/settings.local.json` 已 gitignore，不得入版控）。

## 檔案地圖

| 路徑 | 職責 |
|---|---|
| src/config.js | 全部可調參數（唯一調參點） |
| src/main.js | Phaser 設定、場景註冊、音訊解鎖 |
| src/art/pixelart.js | pixel-string 引擎＋PAL 色盤（單一色彩事實源） |
| src/art/sprites.js | 全部素材定義與註冊 |
| src/audio/sfx.js | WebAudio 合成音效＋BGM 音序器 |
| src/entities/ | Player／enemies（三種雜兵）／Reaper（boss） |
| src/level/graveyard.js | 第一關全部資料（地形/敵人/道具，t/k 座標系） |
| src/scenes/ | Boot／Title／Game（主邏輯）／UI（HUD+觸控）／Overlay（Over+Clear） |
| scripts/ | gen-icons（PWA 圖示）／stamp-sw（快取版號蓋章） |
| docs/ | SPEC（契約）／PLAYBOOKS（劇本+測試）／AC（驗收台帳） |
| reports/ | 各輪開發報告（歷史脈絡在此） |

## 慣例

- 對話回report用繁體中文；程式碼、commit、變數名英文；遊戲內文字英文（復古風格）
- 測試 URL 參數：`?auto=1` 跳過標題、`?debug=1` 掛 __DBG（warp/hurtBoss/god）、`?touch=1/0` 強制觸控、`?physdebug=1` 碰撞框
- 高風險改動（部署鏈、跨檔重構、刪內容）先提計畫等 Lin 確認；小改動列假設直接做
