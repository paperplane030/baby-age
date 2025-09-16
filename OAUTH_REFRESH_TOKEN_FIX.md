# OAuth 回調問題修正指南 - 更新版

## 🚨 問題描述

Google OAuth 登入後回調到網站時可能遇到以下問題：

1. 出現 404 錯誤
2. 只收到 `refresh_token` 而沒有 `access_token`
3. 認證狀態沒有正確更新

## ✅ 最新修正 (2025-01-16)

### 1. **只有 refresh_token 的處理**

現在的 `initAuth` 函數能正確處理只有 refresh_token 的情況：

```typescript
// 檢查 URL 是否有 OAuth 回調參數
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const hasOAuthParams =
  hashParams.has('access_token') ||
  hashParams.has('refresh_token') ||
  hashParams.has('token_type') ||
  hashParams.has('error');

if (hasOAuthParams) {
  // 清理 URL 並讓 Supabase 自動處理
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );

  // 等待 Supabase 處理回調
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// 取得當前 session (觸發 Supabase 的自動檢測)
const {
  data: { session },
} = await supabase.auth.getSession();
```

### 2. **Supabase 配置優化**

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // 適用於 SPA 應用
    storage: window.localStorage,
    debug: true, // 啟用除錯模式查看詳細日誌
  },
});
```

### 3. **改善的除錯日誌**

現在會在控制台顯示詳細的 OAuth 回調資訊：

- `OAuth callback detected: true/false`
- `Hash params: {access_token, refresh_token, token_type, etc.}`
- `Current session: {...}`

## 🔧 故障排除步驟

### 第 1 步：檢查瀏覽器控制台

打開 DevTools Console，重新進行 Google 登入，查看以下日誌：

```
初始化認證狀態
OAuth callback detected: true
Hash params: {refresh_token: "...", token_type: "bearer", ...}
Current session: {user: {...}, access_token: "..."}
```

### 第 2 步：確認 URL 清理

確認登入後 URL 已從：

```
https://paperplane030.github.io/baby-age/#refresh_token=...&token_type=bearer
```

變為：

```
https://paperplane030.github.io/baby-age/
```

### 第 3 步：檢查 localStorage

在瀏覽器 DevTools → Application → Local Storage 中確認是否有：

```
supabase.auth.token = {...}
```

## 🔧 設定檢查清單

### Supabase Dashboard

**Authentication → URL Configuration:**

- Site URL: `https://paperplane030.github.io/baby-age/`
- Redirect URLs: `https://paperplane030.github.io/baby-age/`

**Authentication → Providers → Google:**

- 確認 Client ID 和 Client Secret 正確
- 確認已啟用 Google provider

### Google Cloud Console

**OAuth 2.0 Client → Authorized redirect URIs:**

```
https://paperplane030.github.io/baby-age/
https://xxxxxxxxxxx.supabase.co/auth/v1/callback
```

### GitHub Secrets

確認以下 secrets 已正確設定：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🚀 測試步驟

1. **清除瀏覽器資料**：
   - 開啟 DevTools → Application → Storage
   - 清除 Local Storage 和 Session Storage
   - 清除 Cookies

2. **重新測試登入流程**：
   - 訪問 `https://paperplane030.github.io/baby-age/`
   - 開啟 DevTools Console
   - 點擊「使用 Google 登入」
   - 完成 Google 認證
   - 檢查控制台日誌

3. **驗證登入狀態**：
   - 應該看到使用者頭像和姓名
   - 應該能點擊「載入記錄」按鈕
   - 重新整理頁面應該保持登入狀態

## 🔍 常見問題解答

**Q: 控制台顯示 "OAuth callback detected: false"？**
A: 表示沒有檢測到 OAuth 參數，檢查重定向 URL 設定。

**Q: 有 refresh_token 但 Current session: null？**
A: 檢查 Supabase 專案 URL 和 API 金鑰是否正確。

**Q: 登入成功但重新整理後要重新登入？**
A: 檢查 localStorage 是否正常運作，或瀏覽器是否阻擋第三方 cookies。

**Q: 出現 auth 相關的 JavaScript 錯誤？**
A: 確認 GitHub Actions 部署成功，且環境變數正確注入。

## 📱 完整登入流程

1. 用戶點擊「使用 Google 登入」
2. 重定向到 Google OAuth 頁面
3. 用戶完成授權
4. Google 重定向回應用（可能只帶 refresh_token）
5. 應用檢測 OAuth 參數並清理 URL
6. Supabase 自動處理 session 建立
7. 顯示登入成功狀態並載入使用者資料

## 🎯 下次更新重點

如果問題仍然存在，下一步將：

1. 實作更詳細的錯誤處理
2. 添加 session 恢復機制
3. 改善 OAuth 流程的使用者體驗

這個修正應該能解決只有 refresh_token 的問題！🎉
