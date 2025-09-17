<template>
  <div class="login-component q-pa-md">
    <div v-if="!authStore.isAuthenticated" class="text-center">
      <h5>歡迎使用寶寶年齡追蹤器</h5>
      <p class="text-grey-6">請使用 Google 帳號登入以開始使用</p>

      <q-btn
        @click="handleGoogleLogin"
        :loading="authStore.loading"
        color="primary"
        icon="login"
        label="使用 Google 登入"
        class="q-mt-md"
        :disable="authStore.loading"
      />

      <div v-if="authStore.error" class="q-mt-md">
        <q-banner class="text-negative">
          {{ authStore.error }}
        </q-banner>
      </div>
    </div>

    <!-- 登入後的左右排版 -->
    <div v-else class="row q-gutter-lg">
      <!-- 左側：歡迎區域 -->
      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-avatar size="80px" class="q-mb-md">
              <img
                :src="authStore.userProfile?.avatar_url || '/icons/favicon-96x96.png'"
                alt="用戶頭像"
              />
            </q-avatar>
            <h6 class="q-my-md">歡迎回來，{{ authStore.userName }}！</h6>
            <p class="text-grey-6">{{ authStore.userEmail }}</p>
          </q-card-section>
        </q-card>
      </div>

      <!-- 右側：寶寶記錄區域 -->
      <div class="col-12 col-md-7">
        <!-- 如果沒有寶寶，顯示新增寶寶按鈕 -->
        <q-card v-if="databaseStore.recordCount === 0" flat bordered>
          <q-card-section class="text-center">
            <q-icon name="child_care" size="60px" color="primary" class="q-mb-md" />
            <div class="text-h6">還沒有寶寶紀錄</div>
            <div class="text-subtitle2 text-grey-6 q-mb-md">開始建立您的第一個寶寶檔案吧！</div>
            <q-btn
              @click="$emit('addBaby')"
              color="primary"
              icon="add"
              label="新增寶寶"
              size="lg"
            />
          </q-card-section>
        </q-card>

        <!-- 如果有寶寶，顯示記錄統計 -->
        <q-card v-else flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="child_friendly" class="q-mr-sm" />
              我的寶寶記錄
            </div>
            <div class="text-subtitle2 text-grey-6">
              共有 {{ databaseStore.recordCount }} 筆寶寶紀錄
            </div>

            <!-- 最新寶寶記錄 -->
            <div v-if="databaseStore.latestRecord" class="q-mt-md">
              <div class="text-caption text-grey-6">最新寶寶：</div>
              <div class="text-body1 q-mb-sm">
                {{ databaseStore.latestRecord.baby_name }}
                ({{ formatDate(databaseStore.latestRecord.birth_date) }})
              </div>
            </div>

            <!-- 最新數據紀錄 -->
            <div v-if="latestBabyStatic" class="q-mt-md">
              <div class="text-caption text-grey-6">最新數據紀錄：</div>
              <div class="row q-gutter-sm text-body2">
                <div v-if="latestBabyStatic.height" class="col">
                  <q-chip dense color="blue" text-color="white" icon="height">
                    身高: {{ latestBabyStatic.height }}cm
                  </q-chip>
                </div>
                <div v-if="latestBabyStatic.weight" class="col">
                  <q-chip dense color="green" text-color="white" icon="monitor_weight">
                    體重: {{ latestBabyStatic.weight }}kg
                  </q-chip>
                </div>
                <div v-if="latestBabyStatic.head_circle" class="col">
                  <q-chip dense color="orange" text-color="white" icon="psychology">
                    頭圍: {{ latestBabyStatic.head_circle }}cm
                  </q-chip>
                </div>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">
                記錄時間: {{ formatDateTime(latestBabyStatic.created_time) }}
              </div>
            </div>
            <div v-else-if="databaseStore.latestRecord" class="q-mt-md">
              <div class="text-caption text-grey-6">尚無數據紀錄</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { useDatabaseStore } from 'src/stores/database-store';
import { useBabyStaticsStore } from 'src/stores/baby-statics-store';
import { useQuasar } from 'quasar';
import { onMounted, computed, watch } from 'vue';

const $q = useQuasar();
const authStore = useAuthStore();
const databaseStore = useDatabaseStore();
const babyStaticsStore = useBabyStaticsStore();

// 計算最新的數據紀錄
const latestBabyStatic = computed(() => {
  if (!databaseStore.latestRecord) return null;

  // 獲取最新寶寶的最新數據紀錄
  const latestBabyId = databaseStore.latestRecord.id;
  return babyStaticsStore.getLatestStaticByBabyId(latestBabyId);
});

// 當有最新寶寶記錄時，載入其數據紀錄
watch(
  () => databaseStore.latestRecord,
  async (newRecord) => {
    if (newRecord && authStore.isAuthenticated) {
      await babyStaticsStore.loadBabyStatics(newRecord.id);
    }
  },
  { immediate: true },
);

// 組件掛載時檢查 URL 是否有認證參數
onMounted(() => {
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('error')) {
    // 顯示處理中的訊息
    $q.notify({
      type: 'info',
      message: '正在處理登入...',
      position: 'top',
      timeout: 3000,
    });
  }
});

// Google 登入處理
const handleGoogleLogin = async () => {
  const { error } = await authStore.signInWithGoogle();

  if (error) {
    $q.notify({
      type: 'negative',
      message: `登入失敗: ${error}`,
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'positive',
      message: '正在重導向到 Google 登入頁面...',
      position: 'top',
    });
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-TW');
};

// 格式化日期時間
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW');
};
</script>

<style scoped>
.login-component {
  max-width: 400px;
  margin: 0 auto;
}
</style>
