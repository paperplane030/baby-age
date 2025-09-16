<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> 寶寶矯正年齡 </q-toolbar-title>

        <div>v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <!-- 使用者資訊區域 -->
        <div v-if="authStore.isAuthenticated" class="q-pa-md">
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <img
                  v-if="authStore.userProfile?.avatar_url"
                  :src="authStore.userProfile.avatar_url"
                  :alt="authStore.userName"
                />
                <q-icon v-else name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ authStore.userName }}</q-item-label>
              <q-item-label caption>{{ authStore.userEmail }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="logout"
                color="negative"
                @click="handleSignOut"
                :loading="authStore.loading"
              >
                <q-tooltip>登出</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-separator />
        </div>

        <!-- 寶寶紀錄區域 -->
        <q-item-label header v-if="authStore.isAuthenticated">
          <q-icon name="child_care" class="q-mr-sm" />
          寶寶紀錄
        </q-item-label>

        <!-- 新增寶寶按鈕 -->
        <q-item
          v-if="authStore.isAuthenticated"
          clickable
          v-ripple
          @click="showAddBabyDialog = true"
        >
          <q-item-section avatar>
            <q-icon name="add_circle" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>新增寶寶</q-item-label>
            <q-item-label caption>建立新的寶寶紀錄</q-item-label>
          </q-item-section>
        </q-item>

        <!-- 寶寶列表 -->
        <q-item
          v-for="baby in databaseStore.babyRecords"
          :key="baby.id"
          clickable
          v-ripple
          :active="selectedBabyId === baby.id"
          @click="selectBaby(baby.id)"
        >
          <q-item-section avatar>
            <q-icon name="child_friendly" color="accent" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ baby.baby_name }}</q-item-label>
            <q-item-label caption> 出生日期: {{ formatDate(baby.birth_date) }} </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="edit" size="sm" @click.stop="editBaby(baby)">
              <q-tooltip>編輯</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>

        <!-- 未登入狀態 -->
        <q-item v-if="!authStore.isAuthenticated">
          <q-item-section>
            <q-item-label>請先登入以使用寶寶紀錄功能</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="authStore.isAuthenticated" class="q-my-md" />

        <!-- 其他功能 -->
        <q-item-label header v-if="authStore.isAuthenticated"> 其他功能 </q-item-label>

        <q-item clickable v-ripple to="/" v-if="authStore.isAuthenticated">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>首頁</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- 新增/編輯寶寶對話框 -->
    <q-dialog v-model="showAddBabyDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ editingBaby ? '編輯寶寶' : '新增寶寶' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="babyForm.name"
            label="寶寶姓名"
            dense
            autofocus
            :rules="[(val) => (val && val.length > 0) || '請輸入寶寶姓名']"
          />
          <q-input
            v-model="babyForm.birthDate"
            label="出生日期"
            type="date"
            dense
            class="q-mt-sm"
            :rules="[(val) => val || '請選擇出生日期']"
          />
          <q-input
            v-model="babyForm.notes"
            label="備註"
            type="textarea"
            dense
            class="q-mt-sm"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="取消" @click="closeDialog" />
          <q-btn
            flat
            :label="editingBaby ? '更新' : '新增'"
            @click="saveBaby"
            :loading="databaseStore.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useDatabaseStore } from 'src/stores/database-store';
import { useQuasar } from 'quasar';
import type { BabyRecord } from 'src/supabase';

// Stores
const authStore = useAuthStore();
const databaseStore = useDatabaseStore();
const $q = useQuasar();

// 狀態
const leftDrawerOpen = ref(false);
const showAddBabyDialog = ref(false);
const selectedBabyId = ref<string | null>(null);
const editingBaby = ref<BabyRecord | null>(null);

// 表單資料
const babyForm = ref({
  name: '',
  birthDate: '',
  notes: '',
});

// 方法
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
}

// 選擇寶寶
function selectBaby(babyId: string) {
  selectedBabyId.value = babyId;
  // 可以在這裡添加額外的邏輯，比如更新頁面內容
}

// 編輯寶寶
function editBaby(baby: BabyRecord) {
  editingBaby.value = baby;
  babyForm.value = {
    name: baby.baby_name,
    birthDate: baby.birth_date,
    notes: baby.notes || '',
  };
  showAddBabyDialog.value = true;
}

// 儲存寶寶資料
async function saveBaby() {
  if (!babyForm.value.name || !babyForm.value.birthDate) {
    $q.notify({
      type: 'negative',
      message: '請填寫完整資料',
    });
    return;
  }

  try {
    if (editingBaby.value) {
      // 更新現有寶寶
      await databaseStore.updateBabyRecord(editingBaby.value.id, {
        baby_name: babyForm.value.name,
        birth_date: babyForm.value.birthDate,
        notes: babyForm.value.notes,
      });
      $q.notify({
        type: 'positive',
        message: '寶寶資料已更新',
      });
    } else {
      // 新增寶寶
      await databaseStore.createBabyRecord({
        baby_name: babyForm.value.name,
        birth_date: babyForm.value.birthDate,
        notes: babyForm.value.notes,
      });
      $q.notify({
        type: 'positive',
        message: '寶寶已新增成功',
      });
    }
    closeDialog();
  } catch (err) {
    console.error('Save baby error:', err);
    $q.notify({
      type: 'negative',
      message: '操作失敗，請稍後再試',
    });
  }
}

// 關閉對話框
function closeDialog() {
  showAddBabyDialog.value = false;
  editingBaby.value = null;
  babyForm.value = {
    name: '',
    birthDate: '',
    notes: '',
  };
}

// 登出
async function handleSignOut() {
  try {
    await authStore.signOut();
    selectedBabyId.value = null;
    $q.notify({
      type: 'positive',
      message: '已成功登出',
    });
  } catch (err) {
    console.error('Sign out error:', err);
    $q.notify({
      type: 'negative',
      message: '登出失敗',
    });
  }
}

// 初始化
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await databaseStore.loadBabyRecords();
  }
});
</script>
