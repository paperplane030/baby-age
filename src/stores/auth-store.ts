import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { supabase } from 'src/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from 'src/supabase';

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const user = ref<User | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email || '');
  const userName = computed(() => userProfile.value?.full_name || userEmail.value);

  // 初始化認證狀態
  const initAuth = async () => {
    try {
      loading.value = true;

      // 檢查 URL 是否有 OAuth 回調參數
      const hash = window.location.hash;
      console.log('Full hash:', hash);

      // 特殊處理：OAuth 參數可能在 #/#access_token 格式中
      let hashString = hash;
      let hashParams = new URLSearchParams();

      if (hashString.includes('#access_token') || hashString.includes('#refresh_token')) {
        // 處理 #/#access_token=... 格式
        const oauthPart = hashString.substring(hashString.indexOf('#access_token') + 1);
        console.log('OAuth part:', oauthPart);
        hashParams = new URLSearchParams(oauthPart);
      } else {
        // 一般的 hash 參數處理
        if (hashString.startsWith('#/')) {
          hashString = hashString.substring(2);
        } else if (hashString.startsWith('#')) {
          hashString = hashString.substring(1);
        }
        hashParams = new URLSearchParams(hashString);
      }
      const hasOAuthParams =
        hashParams.has('access_token') ||
        hashParams.has('refresh_token') ||
        hashParams.has('token_type') ||
        hashParams.has('error');

      console.log('OAuth callback detected:', hasOAuthParams);
      console.log('Hash params:', Object.fromEntries(hashParams.entries()));

      if (hasOAuthParams) {
        // 手動提取 tokens
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at');
        const tokenType = hashParams.get('token_type');

        console.log('Extracted tokens:', {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          expiresAt,
          tokenType,
        });

        // 立即清理 URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );

        // 如果有 access_token，手動設定 session
        if (accessToken && refreshToken) {
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Manual session setup error:', sessionError);
            } else if (data.user) {
              console.log('Manual session setup successful:', data.user.email);
              user.value = data.user;
              await loadUserProfile();
              return; // 成功設定，提早返回
            }
          } catch (manualError) {
            console.error('Manual session setup failed:', manualError);
          }
        }

        // 如果手動設定失敗，等待 Supabase 自動處理
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 取得當前 session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('Current session after processing:', session);

      if (session?.user) {
        user.value = session.user;
        await loadUserProfile();
      }

      // 監聽認證狀態變化
      supabase.auth.onAuthStateChange(async (event, session) => {
        user.value = session?.user ?? null;

        if (session?.user) {
          await loadUserProfile();
        } else {
          userProfile.value = null;
        }
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
      error.value = err instanceof Error ? err.message : 'Authentication error';
    } finally {
      loading.value = false;
    }
  };

  // Google 登入
  const signInWithGoogle = async () => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}#/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) throw authError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign in failed';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 登出
  const signOut = async () => {
    try {
      loading.value = true;
      error.value = null;

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      user.value = null;
      userProfile.value = null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      error.value = errorMessage;
      console.error('Sign out error:', err);
    } finally {
      loading.value = false;
    }
  };

  // 載入使用者資料
  const loadUserProfile = async () => {
    if (!user.value) return;

    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.value.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, 這是正常的（使用者第一次登入）
        throw profileError;
      }

      if (data) {
        userProfile.value = data;
      } else {
        // 第一次登入，建立使用者資料
        await createUserProfile();
      }
    } catch (err) {
      console.error('Load user profile error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load user profile';
    }
  };

  // 建立使用者資料
  const createUserProfile = async () => {
    if (!user.value) return;

    try {
      const profileData = {
        id: user.value.id,
        email: user.value.email || '',
        full_name: user.value.user_metadata?.full_name || '',
        avatar_url: user.value.user_metadata?.avatar_url || '',
      };

      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) throw insertError;

      userProfile.value = data;
    } catch (err) {
      console.error('Create user profile error:', err);
      error.value = err instanceof Error ? err.message : 'Failed to create user profile';
    }
  };

  // 更新使用者資料
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user.value || !userProfile.value) return;

    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      userProfile.value = data;
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      error.value = errorMessage;
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  return {
    // 狀態
    user: readonly(user),
    userProfile: readonly(userProfile),
    loading: readonly(loading),
    error: readonly(error),

    // 計算屬性
    isAuthenticated,
    userEmail,
    userName,

    // 方法
    initAuth,
    signInWithGoogle,
    signOut,
    loadUserProfile,
    updateUserProfile,
  };
});
