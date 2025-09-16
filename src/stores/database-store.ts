import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { supabase } from 'src/supabase';
import type { BabyRecord } from 'src/supabase';
import { useAuthStore } from './auth-store';

export const useDatabaseStore = defineStore('database', () => {
  // 狀態
  const babyRecords = ref<BabyRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 取得認證 store
  const authStore = useAuthStore();

  // 計算屬性
  const recordCount = computed(() => babyRecords.value.length);
  const latestRecord = computed(() =>
    babyRecords.value.length > 0
      ? babyRecords.value.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : null,
  );

  // 載入所有嬰兒記錄
  const loadBabyRecords = async () => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('baby_records')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      babyRecords.value = data || [];
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load baby records';
      error.value = errorMessage;
      console.error('Load baby records error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 建立新的嬰兒記錄
  const createBabyRecord = async (
    recordData: Omit<BabyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const newRecord = {
        ...recordData,
        user_id: authStore.user.id,
      };

      const { data, error: insertError } = await supabase
        .from('baby_records')
        .insert(newRecord)
        .select()
        .single();

      if (insertError) throw insertError;

      // 添加到本地狀態
      babyRecords.value.unshift(data);

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create baby record';
      error.value = errorMessage;
      console.error('Create baby record error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 更新嬰兒記錄
  const updateBabyRecord = async (
    id: string,
    updates: Partial<Omit<BabyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
  ) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from('baby_records')
        .update(updates)
        .eq('id', id)
        .eq('user_id', authStore.user.id) // 確保只能更新自己的記錄
        .select()
        .single();

      if (updateError) throw updateError;

      // 更新本地狀態
      const index = babyRecords.value.findIndex((record) => record.id === id);
      if (index !== -1) {
        babyRecords.value[index] = data;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update baby record';
      error.value = errorMessage;
      console.error('Update baby record error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 刪除嬰兒記錄
  const deleteBabyRecord = async (id: string) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase
        .from('baby_records')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id); // 確保只能刪除自己的記錄

      if (deleteError) throw deleteError;

      // 從本地狀態移除
      babyRecords.value = babyRecords.value.filter((record) => record.id !== id);

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete baby record';
      error.value = errorMessage;
      console.error('Delete baby record error:', err);
      return { error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 依據嬰兒名稱搜尋記錄
  const searchRecordsByBabyName = async (babyName: string) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: searchError } = await supabase
        .from('baby_records')
        .select('*')
        .eq('user_id', authStore.user.id)
        .ilike('baby_name', `%${babyName}%`)
        .order('created_at', { ascending: false });

      if (searchError) throw searchError;

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search baby records';
      error.value = errorMessage;
      console.error('Search baby records error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 取得特定時間範圍的記錄
  const getRecordsByDateRange = async (startDate: string, endDate: string) => {
    if (!authStore.user) {
      error.value = 'User not authenticated';
      return { data: null, error: 'User not authenticated' };
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('baby_records')
        .select('*')
        .eq('user_id', authStore.user.id)
        .gte('birth_date', startDate)
        .lte('birth_date', endDate)
        .order('birth_date', { ascending: true });

      if (fetchError) throw fetchError;

      return { data: data || [], error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get records by date range';
      error.value = errorMessage;
      console.error('Get records by date range error:', err);
      return { data: null, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  // 清除本地資料
  const clearData = () => {
    babyRecords.value = [];
    error.value = null;
  };

  return {
    // 狀態
    babyRecords: readonly(babyRecords),
    loading: readonly(loading),
    error: readonly(error),

    // 計算屬性
    recordCount,
    latestRecord,

    // 方法
    loadBabyRecords,
    createBabyRecord,
    updateBabyRecord,
    deleteBabyRecord,
    searchRecordsByBabyName,
    getRecordsByDateRange,
    clearData,
  };
});
