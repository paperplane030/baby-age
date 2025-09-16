import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth-store';

// 在應用啟動時初始化 Supabase 認證
export default boot(async () => {
  const authStore = useAuthStore();

  // 初始化認證狀態
  try {
    console.log('初始化認證狀態');
    await authStore.initAuth();
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
});
