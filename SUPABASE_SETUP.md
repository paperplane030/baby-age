# Supabase 整合設定指南

## 🚀 已完成的整合

您的 Quasar 專案已成功整合 Supabase，包含以下功能：

### 📁 新增的檔案：

- `src/supabase.ts` - Supabase 客戶端設定和型別定義
- `src/stores/auth-store.ts` - 使用者認證管理
- `src/stores/database-store.ts` - 資料庫操作管理
- `src/boot/supabase.ts` - 應用啟動時初始化 Supabase
- `src/components/LoginComponent.vue` - 登入元件範例
- `.env` - 環境變數設定檔

## 🔧 接下來的設定步驟：

### 1. 建立 Supabase 專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 註冊帳號並建立新專案
3. 等待專案初始化完成

### 2. 取得 API 金鑰

1. 在 Supabase 控制台中，前往 **Settings** > **API**
2. 複製以下資訊：
   - `Project URL`
   - `anon public` API 金鑰

### 3. 設定環境變數

編輯 `.env` 檔案，填入您的 Supabase 資訊：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 建立資料庫表格

在 Supabase 控制台的 **SQL Editor** 中執行以下 SQL：

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
  birth_week INTEGER, -- 出生週數 (懷孕週數)
  birth_day INTEGER, -- 出生天數 (該週的第幾天，0-6)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 建立 baby_statics 表格（寶寶成長統計）
CREATE TABLE baby_statics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_id UUID REFERENCES baby_records(id) ON DELETE CASCADE NOT NULL,
  height NUMERIC,
  weight NUMERIC,
  head_circle NUMERIC,
  created_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 設定 RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_statics ENABLE ROW LEVEL SECURITY;

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

-- baby_statics 的安全政策
CREATE POLICY "Users can view baby statics through baby records" ON baby_statics
  FOR SELECT USING (
    baby_id IN (
      SELECT id FROM baby_records WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert baby statics for own babies" ON baby_statics
  FOR INSERT WITH CHECK (
    baby_id IN (
      SELECT id FROM baby_records WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update baby statics for own babies" ON baby_statics
  FOR UPDATE USING (
    baby_id IN (
      SELECT id FROM baby_records WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete baby statics for own babies" ON baby_statics
  FOR DELETE USING (
    baby_id IN (
      SELECT id FROM baby_records WHERE user_id = auth.uid()
    )
  );

-- 建立自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE
  ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_baby_records_updated_at BEFORE UPDATE
  ON baby_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 5. 設定 Google OAuth

1. 在 Supabase 控制台中，前往 **Authentication** > **Providers**
2. 啟用 **Google** 提供者
3. 按照指示設定 Google OAuth 憑證
4. 將您的網站 URL 添加到 **Site URL** 和 **Redirect URLs**

### 6. 使用範例

在您的頁面中使用 LoginComponent：

```vue
<template>
  <q-page>
    <LoginComponent />
  </q-page>
</template>

<script setup lang="ts">
import LoginComponent from 'src/components/LoginComponent.vue';
</script>
```

## 🎯 主要功能：

### 認證功能 (auth-store)：

- ✅ Google OAuth 登入
- ✅ 自動載入使用者資料
- ✅ 登出功能
- ✅ 認證狀態管理

### 資料庫功能 (database-store)：

- ✅ 建立嬰兒記錄
- ✅ 讀取嬰兒記錄
- ✅ 更新嬰兒記錄
- ✅ 刪除嬰兒記錄
- ✅ 依據姓名搜尋
- ✅ 依據日期範圍查詢

## 🔒 安全特性：

- **Row Level Security (RLS)** - 確保使用者只能存取自己的資料
- **JWT 認證** - 安全的 API 存取
- **OAuth 登入** - 無需管理密碼

## 🚀 開始測試：

設定完成後，執行以下命令啟動開發伺服器：

```bash
npm run dev
```

您的 Supabase 整合就完成了！🎉
