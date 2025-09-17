<template>
  <div class="login-component q-pa-md full-width">
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
    <div v-else class="row justify-center" style="gap: 16px">
      <!-- 左側：歡迎區域 -->
      <div class="col-12 col-md-7">
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
            <q-btn @click="emit('addBaby')" color="primary" icon="add" label="新增寶寶" size="lg" />
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

            <!-- 所有寶寶記錄 -->
            <div v-if="databaseStore.babyRecords.length > 0" class="q-mt-md">
              <div class="text-caption text-grey-6 q-mb-sm">我的寶寶們：</div>

              <div v-for="baby in databaseStore.babyRecords" :key="baby.id" class="q-mb-md">
                <q-card
                  flat
                  bordered
                  class="q-pa-sm cursor-pointer transition-all hover-shadow"
                  @click="navigateToBabyDetail(baby.id)"
                >
                  <div class="row items-center">
                    <div class="col">
                      <div class="text-body1 text-weight-medium">
                        {{ baby.baby_name }}
                      </div>
                      <div class="text-caption text-grey-6">
                        生日: {{ formatDate(baby.birth_date) }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-chip
                        dense
                        color="primary"
                        text-color="white"
                        icon="cake"
                        :label="calculateAge(baby.birth_date)"
                      />
                    </div>
                  </div>

                  <!-- 該寶寶的最新數據紀錄 -->
                  <div v-if="getBabyLatestStatic(baby.id)" class="q-mt-sm">
                    <div class="text-caption text-grey-6">最新數據：</div>
                    <div class="row q-gutter-xs">
                      <div v-if="getBabyLatestStatic(baby.id)?.height">
                        <q-chip dense size="sm" color="blue" text-color="white" icon="height">
                          {{ getBabyLatestStatic(baby.id)?.height }}cm
                        </q-chip>
                      </div>
                      <div v-if="getBabyLatestStatic(baby.id)?.weight">
                        <q-chip
                          dense
                          size="sm"
                          color="green"
                          text-color="white"
                          icon="monitor_weight"
                        >
                          {{ getBabyLatestStatic(baby.id)?.weight }}kg
                        </q-chip>
                      </div>
                      <div v-if="getBabyLatestStatic(baby.id)?.head_circle">
                        <q-chip dense size="sm" color="orange" text-color="white" icon="psychology">
                          {{ getBabyLatestStatic(baby.id)?.head_circle }}cm
                        </q-chip>
                      </div>
                    </div>
                  </div>
                  <div v-else class="q-mt-sm">
                    <div class="text-caption text-grey-6">尚無數據紀錄</div>
                  </div>

                  <!-- 點擊提示 -->
                  <div class="text-center q-mt-sm">
                    <q-icon name="touch_app" size="sm" color="grey-5" />
                    <span class="text-caption text-grey-5 q-ml-xs">點擊查看詳細資料</span>
                  </div>
                </q-card>
              </div>
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
import { useRouter } from 'vue-router';
import { onMounted, watch } from 'vue';

// 定義 emit
const emit = defineEmits<{
  addBaby: [];
}>();

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const databaseStore = useDatabaseStore();
const babyStaticsStore = useBabyStaticsStore();

// 獲取指定寶寶的最新數據紀錄
const getBabyLatestStatic = (babyId: string) => {
  return babyStaticsStore.getLatestStaticByBabyId(babyId);
};

// 導航到寶寶詳細頁面
const navigateToBabyDetail = async (babyId: string) => {
  try {
    await router.push(`/baby/${babyId}`);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// 計算年齡
const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} 天`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} 個月`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    return remainingMonths > 0 ? `${years} 歲 ${remainingMonths} 個月` : `${years} 歲`;
  }
};

// 載入所有寶寶的數據紀錄
const loadAllBabiesStatics = async () => {
  if (databaseStore.babyRecords.length > 0) {
    for (const baby of databaseStore.babyRecords) {
      await babyStaticsStore.loadBabyStatics(baby.id);
    }
  }
};

// 當有寶寶記錄時，載入所有寶寶的數據紀錄
watch(
  () => databaseStore.babyRecords,
  async (newRecords) => {
    if (newRecords.length > 0 && authStore.isAuthenticated) {
      await loadAllBabiesStatics();
    }
  },
  { immediate: true, deep: true },
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
</script>

<style scoped>
.login-component {
  max-width: 960px;
  margin: 0 auto;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease;
}

.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>
