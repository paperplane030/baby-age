# GitHub Pages 部署指南

## 🚀 自動部署已設定完成

您的專案已經配置好自動部署到 GitHub Pages。每當您推送到 `main` 分支時，GitHub Actions 會自動建置並部署您的應用。

## 📋 接下來需要手動設定的步驟：

### 1. 啟用 GitHub Pages

1. 前往您的 GitHub 倉庫：`https://github.com/paperplane030/baby-age`
2. 點擊 **Settings** 標籤
3. 在左側導航中找到 **Pages**
4. 在 **Source** 下拉選單中選擇 **GitHub Actions**
5. 保存設定

### 2. 設定 Supabase 環境變數（重要！）

由於 Supabase 需要 API 金鑰，您需要在 GitHub 中設定 Secrets：

1. 在您的 GitHub 倉庫中，前往 **Settings** > **Secrets and variables** > **Actions**
2. 點擊 **New repository secret**
3. 新增以下兩個 secrets：
   - 名稱：`VITE_SUPABASE_URL`，值：您的 Supabase 專案 URL
   - 名稱：`VITE_SUPABASE_ANON_KEY`，值：您的 Supabase anon key

### 3. 觸發首次部署

推送任何變更到 `main` 分支，或者：

1. 前往 **Actions** 標籤
2. 選擇 "Deploy to GitHub Pages" workflow
3. 點擊 **Run workflow**

## 🔗 部署後的網址

部署完成後，您的應用將會在以下網址可用：

```
https://paperplane030.github.io/baby-age/
```

## 📁 已配置的檔案：

- `.github/workflows/deploy.yml` - GitHub Actions 自動部署腳本
- `quasar.config.ts` - 更新了 publicPath 以支援 GitHub Pages
- `public/.nojekyll` - 防止 Jekyll 處理靜態檔案

## 🔧 配置特點：

- **自動部署**：推送到 main 分支時自動觸發
- **環境變數支援**：在建置時注入 Supabase 配置
- **路由支援**：使用 hash 模式以支援 GitHub Pages
- **相對路徑**：正確設定 publicPath 為 `/baby-age/`

## 📊 監控部署

1. 前往 **Actions** 標籤查看部署狀態
2. 每次推送後，等待 workflow 完成
3. 綠色勾號表示部署成功

## 🚨 常見問題：

**Q: 部署失敗了怎麼辦？**
A: 檢查 Actions 標籤中的錯誤訊息，通常是因為缺少 Supabase secrets。

**Q: 網站顯示 404？**
A: 確保已在 Settings > Pages 中啟用 GitHub Actions 作為來源。

**Q: Supabase 功能無法使用？**
A: 檢查是否已正確設定 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` secrets。

## 🎉 下一步

設定完成後，您的 Quasar + Supabase 應用就會自動部署到 GitHub Pages 了！
