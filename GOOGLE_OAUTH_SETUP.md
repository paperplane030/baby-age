# Google 登入設定指南 - GitHub Pages 版

## 🎉 已完成的程式碼修改

✅ **路由模式修正**: 改為 `hash` 模式以支援 GitHub Pages
✅ **環境變數修正**: 正確傳遞 Supabase 設定
✅ **OAuth 重定向**: 更新為支援子路徑的重定向 URL
✅ **代碼推送**: 所有變更已推送到 GitHub

## 📋 接下來需要手動設定的步驟

### 第 1 步：設定 GitHub Secrets

1. 前往 GitHub 倉庫：`https://github.com/paperplane030/baby-age`
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret** 並新增以下兩個 secrets：

**Secret 1:**

- Name: `VITE_SUPABASE_URL`
- Value: 您的 Supabase 專案 URL (例如: `https://xxxxxxxxxxx.supabase.co`)

**Secret 2:**

- Name: `VITE_SUPABASE_ANON_KEY`
- Value: 您的 Supabase anon key

### 第 2 步：啟用 GitHub Pages

1. 在同一個倉庫中，前往 **Settings** → **Pages**
2. 在 **Source** 下拉選單中選擇 **GitHub Actions**
3. 保存設定

### 第 3 步：建立 Supabase 專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 註冊帳號並建立新專案
3. 等待專案初始化完成
4. 前往 **Settings** → **API** 取得 URL 和 anon key

### 第 4 步：建立資料庫表格

在 Supabase 的 **SQL Editor** 中執行以下 SQL：

```sql
-- 建立 user_profiles 表格
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立 baby_records 表格
CREATE TABLE baby_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  baby_name VARCHAR NOT NULL,
  birth_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 啟用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_records ENABLE ROW LEVEL SECURITY;

-- 建立安全政策
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own baby records" ON baby_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baby records" ON baby_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baby records" ON baby_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own baby records" ON baby_records
  FOR DELETE USING (auth.uid() = user_id);
```

### 第 5 步：設定 Google OAuth

#### 5.1 建立 Google Cloud Console 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google+ API** 或 **Google Identity Services**

#### 5.2 設定 OAuth 同意畫面

1. 前往 **APIs & Services** → **OAuth consent screen**
2. 選擇 **External** 用戶類型
3. 填寫應用程式資訊：
   - App name: `Baby Age Tracker`
   - User support email: 您的 email
   - Developer contact information: 您的 email

#### 5.3 建立 OAuth 2.0 憑證

1. 前往 **APIs & Services** → **Credentials**
2. 點擊 **Create Credentials** → **OAuth 2.0 Client IDs**
3. Application type 選擇 **Web application**
4. 設定重定向 URI：
   ```
   https://paperplane030.github.io/baby-age/
   https://xxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   (替換 `xxxxxxxxxxx` 為您的 Supabase 專案 ID)

### 第 6 步：在 Supabase 中設定 Google OAuth

1. 在 Supabase Dashboard 中，前往 **Authentication** → **Providers**
2. 啟用 **Google** provider
3. 填入 Google OAuth 憑證：
   - Client ID: 從 Google Cloud Console 取得
   - Client Secret: 從 Google Cloud Console 取得

### 第 7 步：設定 Supabase URL 配置

1. 前往 **Authentication** → **URL Configuration**
2. 設定以下 URL：
   - **Site URL**: `https://paperplane030.github.io/baby-age/`
   - **Redirect URLs**: `https://paperplane030.github.io/baby-age/`

### 第 8 步：測試部署

1. 推送任何變更到 `main` 分支觸發部署
2. 等待 GitHub Actions 完成建置
3. 前往 `https://paperplane030.github.io/baby-age/` 測試 Google 登入

## 🚀 部署後的網址

```
https://paperplane030.github.io/baby-age/
```

## 🔍 故障排除

### 常見問題：

**Q: 點擊 Google 登入沒有反應？**
A: 檢查瀏覽器控制台是否有錯誤，確認 Supabase secrets 是否正確設定。

**Q: Google 登入後跳轉錯誤？**
A: 確認 Google Cloud Console 和 Supabase 中的重定向 URL 設定正確。

**Q: 顯示 "Missing Supabase environment variables" 錯誤？**
A: 確認 GitHub Secrets 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正確設定。

**Q: 登入後無法存取資料？**
A: 確認資料庫表格和 RLS 政策是否正確建立。

## 📞 需要協助？

如果遇到任何問題，請檢查：

1. GitHub Actions 執行狀態
2. 瀏覽器控制台錯誤訊息
3. Supabase Dashboard 中的認證日誌

完成所有步驟後，您的應用就能在 GitHub Pages 上完美使用 Google 登入功能了！🎉
