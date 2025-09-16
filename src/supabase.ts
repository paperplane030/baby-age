import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 建立 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // 回到 implicit 流程
    storage: window.localStorage,
    debug: true, // 啟用除錯模式
  },
});

// 型別定義
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BabyRecord {
  id: string;
  user_id: string;
  baby_name: string;
  birth_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 資料庫型別（自動生成）
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      baby_records: {
        Row: BabyRecord;
        Insert: Omit<BabyRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BabyRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
