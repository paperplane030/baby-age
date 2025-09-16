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

    <div v-else class="text-center">
      <q-avatar size="80px" class="q-mb-md">
        <img
          :src="authStore.userProfile?.avatar_url || '/icons/favicon-96x96.png'"
          alt="用戶頭像"
        />
      </q-avatar>

      <h6 class="q-my-md">歡迎回來，{{ authStore.userName }}！</h6>
      <p class="text-grey-6">{{ authStore.userEmail }}</p>

      <div class="q-mt-lg">
        <q-btn
          @click="handleSignOut"
          :loading="authStore.loading"
          color="negative"
          outline
          icon="logout"
          label="登出"
          :disable="authStore.loading"
        />
      </div>

      <!-- 簡單的嬰兒記錄狀態顯示 -->
      <q-card class="q-mt-lg" flat bordered>
        <q-card-section>
          <div class="text-h6">我的記錄</div>
          <div class="text-subtitle2 text-grey-6">
            共有 {{ databaseStore.recordCount }} 筆嬰兒記錄
          </div>
          <div v-if="databaseStore.latestRecord" class="q-mt-sm">
            <div class="text-caption">最新記錄：</div>
            <div class="text-body2">
              {{ databaseStore.latestRecord.baby_name }}
              ({{ formatDate(databaseStore.latestRecord.birth_date) }})
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn
            @click="loadRecords"
            :loading="databaseStore.loading"
            color="primary"
            flat
            label="載入記錄"
            icon="refresh"
          />
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { useDatabaseStore } from 'src/stores/database-store';
import { useQuasar } from 'quasar';
import { onMounted } from 'vue';

const $q = useQuasar();
const authStore = useAuthStore();
const databaseStore = useDatabaseStore();

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

// 登出處理
const handleSignOut = async () => {
  await authStore.signOut();
  databaseStore.clearData();

  $q.notify({
    type: 'info',
    message: '已成功登出',
    position: 'top',
  });
};

// 載入記錄
const loadRecords = async () => {
  const result = await databaseStore.loadBabyRecords();

  if (result?.error) {
    $q.notify({
      type: 'negative',
      message: `載入記錄失敗: ${result.error}`,
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'positive',
      message: '記錄載入成功',
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
  max-width: 400px;
  margin: 0 auto;
}
</style>
