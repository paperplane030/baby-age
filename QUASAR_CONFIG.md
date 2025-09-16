# Quasar 配置說明

## 🛠️ 已優化的配置項目

### 1. 修正的錯誤：

- ✅ PWA workboxMode: `'generateSW'` → `'GenerateSW'`
- ✅ BEX contentScripts 移除不需要的配置
- ✅ 移除不必要的 i18n 插件

### 2. 新增的功能配置：

#### Framework 插件：

```typescript
plugins: ['Notify', 'Loading', 'LocalStorage', 'SessionStorage'];
```

#### 全域配置：

```typescript
config: {
  notify: {
    position: 'top',
    timeout: 3000,
  },
  loading: {
    color: 'primary',
    message: '載入中...',
  },
}
```

#### 環境變數：

```typescript
env: {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
}
```

### 3. GitHub Pages 支援：

- ✅ `publicPath` 設定為生產環境時使用 `/baby-age/`
- ✅ `vueRouterMode` 設定為 `'hash'` 以支援靜態託管

### 4. 建議的下一步：

1. 測試本地開發環境：`npm run dev`
2. 測試生產建置：`npm run build`
3. 確保 Supabase 環境變數正確設定

## 🚀 使用方式

### 開發模式：

```bash
npm run dev
```

### 生產建置：

```bash
npm run build
```

### 預覽建置結果：

```bash
npx quasar serve dist/spa
```

## 📱 支援的平台

配置已設定支援以下平台：

- SPA (Single Page Application) - 主要用於 GitHub Pages
- PWA (Progressive Web App) - 可安裝的網頁應用
- SSR (Server Side Rendering) - 伺服器端渲染
- Electron - 桌面應用
- Cordova - 行動應用
- Capacitor - 跨平台應用

目前主要用於 SPA 部署到 GitHub Pages。
