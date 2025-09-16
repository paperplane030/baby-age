import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { supabase } from 'src/supabase';
import type { BabyStatic } from 'src/supabase';
import { useAuthStore } from './auth-store';

export const useBabyStaticsStore = defineStore('babyStatics', () => {
  // 狀態
  const babyStatics = ref<BabyStatic[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 取得認證 store
  const authStore = useAuthStore();

  // 計算屬性
  const getStaticsByBabyId = computed(() => {
    return (babyId: string) =>
      babyStatics.value
        .filter((stat) => stat.baby_id === babyId)
        .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
  });

  const getLatestStaticByBabyId = computed(() => {
    return (babyId: string) => {
      const stats = getStaticsByBabyId.value(babyId);
      return stats.length > 0 ? stats[0] : null;
    };
  });

  // 載入特定寶寶的統計資料
  const loadBabyStatics = async (babyId?: string) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      let query = supabase
        .from('baby_statics')
        .select('*')
        .order('created_time', { ascending: false });

      if (babyId) {
        query = query.eq('baby_id', babyId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (babyId) {
        // 如果指定了 babyId，只更新該寶寶的資料
        babyStatics.value = babyStatics.value.filter((stat) => stat.baby_id !== babyId);
        if (data) {
          babyStatics.value.push(...data);
        }
      } else {
        // 載入所有資料
        babyStatics.value = data || [];
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load baby statics';
      error.value = errorMessage;
      console.error('Load baby statics error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 新增寶寶統計資料
  const createBabyStatic = async (staticData: {
    baby_id: string;
    height?: number;
    weight?: number;
    head_circle?: number;
  }) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: insertError } = await supabase
        .from('baby_statics')
        .insert([staticData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        babyStatics.value.unshift(data);
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create baby static';
      error.value = errorMessage;
      console.error('Create baby static error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 更新寶寶統計資料
  const updateBabyStatic = async (
    id: string,
    updates: {
      height?: number;
      weight?: number;
      head_circle?: number;
    },
  ) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from('baby_statics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        const index = babyStatics.value.findIndex((stat) => stat.id === id);
        if (index !== -1) {
          babyStatics.value[index] = data;
        }
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update baby static';
      error.value = errorMessage;
      console.error('Update baby static error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 刪除寶寶統計資料
  const deleteBabyStatic = async (id: string) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase.from('baby_statics').delete().eq('id', id);

      if (deleteError) throw deleteError;

      babyStatics.value = babyStatics.value.filter((stat) => stat.id !== id);

      return { data: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete baby static';
      error.value = errorMessage;
      console.error('Delete baby static error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 清空所有資料
  const clearBabyStatics = () => {
    babyStatics.value = [];
    error.value = null;
  };

  return {
    // 狀態
    babyStatics: readonly(babyStatics),
    loading: readonly(loading),
    error: readonly(error),

    // 計算屬性
    getStaticsByBabyId,
    getLatestStaticByBabyId,

    // 方法
    loadBabyStatics,
    createBabyStatic,
    updateBabyStatic,
    deleteBabyStatic,
    clearBabyStatics,
  };
});
