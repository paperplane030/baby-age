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

      // 取得當前 session
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
          redirectTo: `${window.location.origin}${window.location.pathname}`,
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
