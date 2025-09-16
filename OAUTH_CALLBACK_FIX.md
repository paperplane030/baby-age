# OAuth 回調 404 問題修正指南

## 🚨 問題描述

Google OAuth 登入後回調到網站時出現 404 錯誤，雖然 URL 中有 `access_token` 參數。

## ✅ 已修正的問題

### 1. **Hash 路由模式下的 URL 參數處理**

在 `auth-store.ts` 中新增了專門處理 OAuth 回調的邏輯：

```typescript
// 處理 OAuth 回調 - 檢查 URL 中是否有認證參數
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

if (accessToken && refreshToken) {
  // 清理 URL 並手動設定 session
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search,
  );

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}
```

### 2. **重定向 URL 修正**

更新 Google OAuth 重定向 URL 為：

```typescript
redirectTo: `${window.location.origin}${window.location.pathname}#/`;
```

### 3. **Supabase 客戶端配置優化**

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // 適用於 SPA 應用
    storage: window.localStorage, // 明確指定存儲方式
  },
});
```

### 4. **前端狀態顯示改善**

在 `LoginComponent.vue` 中新增了 OAuth 回調處理的視覺反饋：

```typescript
onMounted(() => {
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('error')) {
    $q.notify({
      type: 'info',
      message: '正在處理登入...',
      position: 'top',
      timeout: 2000,
    });
  }
});
```

## 🔧 Supabase 設定檢查

確保在 Supabase Dashboard 中設定正確的重定向 URL：

### Authentication → URL Configuration:

- **Site URL**: `https://paperplane030.github.io/baby-age/`
- **Redirect URLs**:
  ```
  https://paperplane030.github.io/baby-age/
  https://paperplane030.github.io/baby-age/#/
  ```

## 🔧 Google Cloud Console 設定檢查

確保在 Google Cloud Console 中設定正確的重定向 URI：

### OAuth 2.0 Client → Authorized redirect URIs:

```
https://paperplane030.github.io/baby-age/
https://paperplane030.github.io/baby-age/#/
https://xxxxxxxxxxx.supabase.co/auth/v1/callback
```

## 🚀 測試步驟

1. **清除瀏覽器快取和 localStorage**
2. **訪問您的應用**: `https://paperplane030.github.io/baby-age/`
3. **點擊 Google 登入按鈕**
4. **完成 Google 認證**
5. **應該會自動返回應用並顯示登入狀態**

## 🔍 故障排除

### 如果仍然出現 404：

1. **檢查瀏覽器控制台**是否有 JavaScript 錯誤
2. **檢查 Network 標籤**中的請求是否正常
3. **確認 GitHub Secrets**是否正確設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 如果登入沒有反應：

1. **檢查 Supabase 環境變數**是否正確
2. **確認 Google OAuth 憑證**是否有效
3. **檢查重定向 URL**是否完全匹配

## 📱 現在的登入流程

1. 用戶點擊「使用 Google 登入」
2. 重定向到 Google OAuth 頁面
3. 用戶授權後，Google 重定向回 `https://paperplane030.github.io/baby-age/#/`
4. 應用自動檢測 URL 中的 `access_token`
5. 清理 URL 並設定用戶 session
6. 顯示登入成功狀態

這個修正應該完全解決 OAuth 回調的 404 問題！🎉
