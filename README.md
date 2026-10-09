# 活色聲香｜TK流行歌唱社

## 已公開部署

- [觀眾投票頁](https://vivid-voices-tk.joyang940309.chatgpt.site)
- [投票管理](https://vivid-voices-tk.joyang940309.chatgpt.site/admin)
- [演出管理](https://vivid-voices-tk.joyang940309.chatgpt.site/admin/performance)

公開版原始碼位於 `cloud-site/`，使用 Sites、Cloudflare D1 共用票數及 R2 照片；根目錄保留本機 Node.js 版本。更新 GitHub 不會自動更新 Sites，需按 Sites 發布流程重新部署。

Google 登入使用已提供的 Client ID。請在 Google Cloud 的該網頁用戶端「已授權的 JavaScript 來源」加入 `https://vivid-voices-tk.joyang940309.chatgpt.site`（沒有 `/admin` 等路徑）並儲存。尚未授權此來源時，Google 登入可能顯示來源不符。正式登入仍需由實際 Gmail 帳號驗證，並確認 Google Audience 設定允許活動觀眾使用。

響應式水彩甜點投票網站。草莓、檸檬、肉桂各六小組，共六輪。

## 啟動與網址

使用 Node.js 24 或以上版本，執行 `npm ci`，再執行 `npm start`。

- 觀眾頁：`http://localhost:3000/`，只提供投票與 Gmail 登入，成績程式保留但暫時隱藏。
- 投票管理：`http://localhost:3000/admin`，需管理密碼登入。
- 演出管理：`http://localhost:3000/admin/performance`，需管理密碼登入。

觀眾頁不顯示管理入口，舊 `/#admin` 也不會開啟管理頁。管理網址不是秘密憑證；知道網址者仍須通過伺服器的管理密碼驗證，才能取得管理資料與操作功能。觀眾與管理者使用各自的登入 cookie，不會互相覆蓋。

本機 `npm start` 會讀取未上傳 GitHub 的 `.env`，可在其中設定 `ADMIN_PASSWORD` 和 `GOOGLE_CLIENT_ID`。未設定管理密碼時，啟動畫面顯示本次隨機密碼。正式部署在主機設定 `ADMIN_PASSWORD`、`NODE_ENV=production`、`GOOGLE_CLIENT_ID`、`DATA_DIR` 為持久化磁碟路徑；`PORT` 預設 3000，正式版需 HTTPS。

## Gmail 登入設定

依 [Google 官方設定說明](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)：

1. 開啟 [Google Auth Platform](https://console.cloud.google.com/auth/clients)，建立或選擇專案。
2. 在 Branding 設定應用程式名稱「活色聲香」、支援信箱及所需網站／隱私說明資訊。Audience 選擇 External；測試階段加入測試帳號，正式活動前依平台要求發布可供觀眾登入的設定。
3. 建立 OAuth 用戶端，應用程式類型選「網頁應用程式」。
4.「已授權的 JavaScript 來源」加入 `http://localhost` 和 `http://localhost:3000`。部署後再加入實際 HTTPS 網站來源，例如 `https://your-domain.example`，不要加 `/admin` 等路徑。
5. 取得結尾為 `.apps.googleusercontent.com` 的 Client ID，在主機環境變數設定 `GOOGLE_CLIENT_ID` 後重新啟動。此整合不需要 Client Secret。

Google Client ID 尚未設定時，登入視窗會顯示「主辦方尚未啟用 Google 登入」，不會提供假登入或僅輸入 Email 的替代入口。

觀眾透過 Google 登入，只接受已驗證的 `@gmail.com` 帳號。伺服器使用 Google 官方套件驗證簽章、有效期、Client ID 與發行者，並驗證一次性 nonce。帳號固定識別碼 `sub` 的雜湊作為投票身分，每帳號每輪一票，換裝置或重新登入仍不能重投；不以可變的姓名或 Email 地址作唯一依據。只取得基本姓名、Email 與識別碼，不讀取 Gmail 郵件。

此方式限制每個帳號，不能證明每個自然人只持有一個 Gmail。若活動需要嚴格限參加者一票，可另加入主辦方核定帳號名單。

## 活動操作

1. 在獨立管理頁登入，填寫 18 小組隊名、歌曲、成員與照片。照片限 PNG/JPEG/WebP、2MB。
2. 各大組用上下按鈕調整演出順序；同順位的三組自動配為同一輪。
3. 開放指定輪次，同時只開放一輪；其他正在開放的輪次會關閉。
4. 觀眾 Gmail 登入後確認投票，每個帳號每輪只能投一次。
5. 按「關閉並統計」。只有勝者票數計入大組，第二、三名不計。平手時先關票，再由主辦方選定平手小組中的勝者。無票不能結算。
6. 六輪完成後，在投票管理按「結算總冠軍」顯示最終勝利大組與三組有效總票數；累計平手時列出並列總冠軍。

投票開始後不能調整順序，已開放或結算的輪次不能修改小組資料。結算不能重複加分。票數與總冠軍僅管理者可見。每十秒更新。

## 總冠軍與重設活動

全部六輪結算後，在投票管理按「結算總冠軍」，只累計每輪勝者的票數，顯示三組有效總票數與冠軍。最高分相同時顯示並列總冠軍。觀眾無法查看此結果。

重新開始時，在投票管理下方按「重設活動」，選擇保留小組資料（預設）或全部重新設定，輸入「重設投票」，再按「保存紀錄並重設」。系統先保存當次紀錄，再清除票數、各輪勝者及總冠軍，使六輪回到準備中；可在「已保存的活動紀錄」下載 JSON 備份。本機備份在忽略上傳的 `data/archives/`；公開版備份在管理者專用雲端儲存。備份目前沒有自動還原按鈕。網站發布不會執行重設。

## 既有資料

舊版隊伍、輪次與票數會保留，舊姓名／投票碼登入和產生碼功能已停用。新的 Gmail 身分無法自動對應舊投票碼；若舊版已正式投票，切換前需由主辦方評估名單對應，避免同一人以兩種身分投同一輪。不會自行清空既有票數。

## GitHub 與公開部署

儲存庫：[jo940309/vivid-voices](https://github.com/jo940309/vivid-voices)。GitHub Pages 僅提供靜態網頁，這套系統需支援 Docker、HTTPS 與持久化磁碟的主機。使用附帶 Dockerfile，掛載 `/app/data`，設定上述環境變數，部署單一執行個體。不要讓重部署清空資料庫，也不要使用各自獨立 SQLite 的多執行個體。

請勿把 `data/`、管理密碼或使用者資料上傳 GitHub。資料庫包含姓名、Email 和投票紀錄，活動結束後依主辦方保存需求處理；使用 SQLite 一致性備份方式，勿只複製使用中的主資料庫而漏掉 WAL。

## 驗證與美術

`npm test` 驗證 Gmail 身分條件、偽造／過期／錯誤來源拒絕、nonce 重播、前後台權限與 cookie 分離、重新登入不能重投、只有勝者計分與平手。Google 外部驗證服務在測試中以模擬回應隔離；真實 Google 帳號登入仍需配置 Client ID 後做整合驗證。

`public/assets/desserts.png` 使用內建 ImageGen 製作：三組等距的草莓蛋糕、檸檬塔、肉桂捲，水彩與色鉛筆手帳風格，奶油白底、棕色輪廓、無文字。Google Fonts 無法載入時使用系統字型。


