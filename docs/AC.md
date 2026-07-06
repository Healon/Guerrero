# GRAVE GENT — 單關可玩 demo 驗收條件（AC）

> 專案：Guerrero（Kraino 風格致敬作，全原創素材）
> 技術：Phaser 3 + Vite（HTML5，鍵盤＋觸控）
> 日期：2026-07-06
> 每條 AC 皆為 Observable / Measurable / Bounded / Testable，附驗證方式。

## A. 基礎啟動

| # | 條件 | 驗證方式 |
|---|------|----------|
| A1 | `npm run dev` 可啟動，瀏覽器載入後 console 無錯誤 | preview console logs，error 級別為 0 筆 |
| A2 | 標題畫面顯示遊戲名，按 Z／Enter／點擊可進入關卡 | preview 截圖＋模擬按鍵後場景切換為 Game |
| A3 | 內部解析度 480×270 像素風（pixelArt），視窗縮放不糊 | 截圖目視＋config 檢查 |

## B. 主角操作（硬派復古手感）

| # | 條件 | 驗證方式 |
|---|------|----------|
| B1 | 左右移動：按住方向鍵 x 座標持續變化，放開即停 | preview eval 模擬 keydown，斷言 player.x 位移 > 40px/0.5s |
| B2 | 跳躍：可變高度（提早放開跳得矮），有 coyote time 與輸入緩衝 | eval 斷言短按與長按的最高點 y 差 ≥ 12px |
| B3 | 鐮刀攻擊：有揮擊動畫與有效判定窗，命中敵人扣血 | eval 在敵人旁攻擊，斷言敵人 hp 減少 |
| B4 | 受擊：扣 1 格血＋擊退＋約 0.9s 無敵閃爍 | eval 觸敵後斷言 hp-1 且短時間內不再扣血 |

## C. 戰鬥與關卡元素

| # | 條件 | 驗證方式 |
|---|------|----------|
| C1 | 三種敵人：幽靈（穿牆飄行追蹤）、食屍鬼（平台巡邏）、跳跳骷髏頭（朝玩家跳） | eval 斷言三類敵人存在且行為參數生效 |
| C2 | 骷髏木箱可被鐮刀打破，掉出骷髏頭貨幣，HUD 計數增加 | eval 破箱前後 registry skulls 增加 |
| C3 | 尖刺造成 2 傷害＋擊退；掉落深淵扣 1 命 | eval 斷言對應數值變化 |
| C4 | 中途檢查點（燈籠）：死亡後從檢查點重生 | eval 觸發檢查點→死亡→斷言重生座標 |
| C5 | 命數 3；歸零進 Game Over，可重新開始 | eval 連續死亡→斷言 GameOver 場景→重啟成功 |

## D. Boss 戰

| # | 條件 | 驗證方式 |
|---|------|----------|
| D1 | 進入 boss 區域後封門、出現 boss 血條 | eval 傳送至 boss 區，斷言 bossHp 出現於 registry |
| D2 | Reaper 至少 2 種攻擊模式；血量 ≤ 50% 進入第二階段加投擲鐮刀 | 程式碼審查＋eval 調 boss 血量觀察行為切換 |
| D3 | 擊敗 boss → STAGE CLEAR 畫面＋骷髏頭結算 | eval 將 boss 血量歸零，斷言 Clear 場景 |

## E. 觸控與體驗

| # | 條件 | 驗證方式 |
|---|------|----------|
| E1 | 觸控裝置（或 `?touch=1`）顯示虛擬按鍵：左右／跳／攻擊，佈局同截圖（左下方向、右下動作） | preview 以 ?touch=1 截圖＋模擬 pointer 操作 |
| E2 | 音效：跳躍／揮刀／命中／破箱／拾取／受傷／Boss／過關；關卡有循環 BGM；M 鍵靜音 | 程式碼審查（WebAudio 合成）＋手動聽測（Lin） |
| E3 | 幀率：本機 preview 中 actualFps ≥ 55 | eval 讀 game.loop.actualFps |
| E4 | 所有美術為程式生成之原創像素圖，無外部版權素材 | 程式碼審查：無外部圖片資源 |

## F. 武器升級：SPIRIT BLADE 刀氣（2026-07-06 加入）

| # | 條件 | 驗證方式 | 結果 |
|---|------|----------|------|
| F1 | 未升級時揮刀不產生刀氣；HUD 為基本鐮刀圖示 | eval 揮刀後斷言 waves 數 0 | ✅ |
| F2a | 拾取跳台頂的 SPIRIT BLADE → weaponLv=2、HUD 圖示變充能版、道具消失 | eval 斷言 registry 與貼圖 key | ✅ |
| F2b | 升級後每揮一刀產生一道刀氣，250px/s 飛行、150px 射程耗盡自毀 | eval 追蹤 wave 座標與存活 | ✅（20 幀飛 83px） |
| F2c | 刀氣命中敵人造成 1 傷害並消失 | eval 遠距（近戰搆不到）打食屍鬼 | ✅（hp 2→1，第 23 幀命中） |
| F2d | 防雙倍：同一揮近戰已命中的目標，刀氣穿過不重複扣血 | eval boss 落地硬直時貼臉揮刀 | ✅（恰 -1；遠距單刀氣亦 -1） |
| F3 | 刀氣可破壞木箱 | eval 遠距破箱 | ✅（箱數 -1） |
| F4 | 升級死亡重生保留；Game Over／重開新輪重置 | eval 深淵死亡＋scene restart | ✅（重生 lv2、重開 lv1） |
| F5 | 刀氣撞牆（地形／boss 閘門）消失，不穿牆 | eval 場外射向閘門 | ✅（第 11 幀撞門消失） |

## 驗證紀錄

全部 AC（A–F）以 `game.loop.step()` 逐幀模擬輸入實測，詳見 reports/graveyard-demo_20260706_summary.md。
