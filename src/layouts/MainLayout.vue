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
            <!-- 顯示最新的統計資料 -->
            <q-item-label v-if="getLatestStatic(baby.id)" caption class="text-info">
              最新紀錄: {{ formatStaticInfo(getLatestStatic(baby.id)) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn
                flat
                round
                dense
                icon="monitor_weight"
                size="sm"
                color="primary"
                @click.stop="openStaticDialog(baby)"
              >
                <q-tooltip>身高體重紀錄</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" size="sm" @click.stop="editBaby(baby)">
                <q-tooltip>編輯寶寶</q-tooltip>
              </q-btn>
            </div>
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

    <!-- 寶寶統計資料對話框 -->
    <q-dialog v-model="showStaticDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ selectedBabyForStatic?.baby_name }} - 身高體重紀錄</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-gutter-md">
            <div class="col">
              <q-input
                v-model.number="staticForm.height"
                label="身高 (公分)"
                type="number"
                dense
                suffix="cm"
                :rules="[(val) => val === null || val === undefined || val > 0 || '請輸入有效數值']"
              />
            </div>
            <div class="col">
              <q-input
                v-model.number="staticForm.weight"
                label="體重 (公斤)"
                type="number"
                dense
                suffix="kg"
                step="0.1"
                :rules="[(val) => val === null || val === undefined || val > 0 || '請輸入有效數值']"
              />
            </div>
          </div>
          <div class="q-mt-md">
            <q-input
              v-model.number="staticForm.headCircle"
              label="頭圍 (公分)"
              type="number"
              dense
              suffix="cm"
              step="0.1"
              :rules="[(val) => val === null || val === undefined || val > 0 || '請輸入有效數值']"
            />
          </div>

          <!-- 顯示歷史紀錄 -->
          <div v-if="currentBabyStatics.length > 0" class="q-mt-lg">
            <q-separator />
            <div class="text-subtitle2 q-mt-md q-mb-sm">最近紀錄</div>
            <q-list dense>
              <q-item
                v-for="record in currentBabyStatics.slice(0, 3)"
                :key="record.id"
                class="q-px-none"
              >
                <q-item-section>
                  <q-item-label caption>{{ formatDateTime(record.created_time) }}</q-item-label>
                  <q-item-label>
                    <span v-if="record.height">身高: {{ record.height }}cm</span>
                    <span v-if="record.weight" class="q-ml-md">體重: {{ record.weight }}kg</span>
                    <span v-if="record.head_circle" class="q-ml-md"
                      >頭圍: {{ record.head_circle }}cm</span
                    >
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="deleteStatic(record.id)"
                  >
                    <q-tooltip>刪除</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="取消" @click="closeStaticDialog" />
          <q-btn
            flat
            label="新增紀錄"
            @click="saveStatic"
            :loading="babyStaticsStore.loading"
            :disable="!hasValidStaticData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useDatabaseStore } from 'src/stores/database-store';
import { useBabyStaticsStore } from 'src/stores/baby-statics-store';
import { useQuasar } from 'quasar';
import type { BabyRecord, BabyStatic } from 'src/supabase';

// Stores
const authStore = useAuthStore();
const databaseStore = useDatabaseStore();
const babyStaticsStore = useBabyStaticsStore();
const $q = useQuasar();

// 狀態
const leftDrawerOpen = ref(false);
const showAddBabyDialog = ref(false);
const showStaticDialog = ref(false);
const selectedBabyId = ref<string | null>(null);
const editingBaby = ref<BabyRecord | null>(null);
const selectedBabyForStatic = ref<BabyRecord | null>(null);

// 表單資料
const babyForm = ref({
  name: '',
  birthDate: '',
  notes: '',
});

const staticForm = ref({
  height: null as number | null,
  weight: null as number | null,
  headCircle: null as number | null,
});

// 計算屬性
const currentBabyStatics = computed(() => {
  if (!selectedBabyForStatic.value) return [];
  return babyStaticsStore.getStaticsByBabyId(selectedBabyForStatic.value.id);
});

const hasValidStaticData = computed(() => {
  return (
    staticForm.value.height !== null ||
    staticForm.value.weight !== null ||
    staticForm.value.headCircle !== null
  );
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

// 統計資料相關方法
function getLatestStatic(babyId: string) {
  return babyStaticsStore.getLatestStaticByBabyId(babyId);
}

function formatStaticInfo(staticRecord: BabyStatic | null | undefined) {
  if (!staticRecord) return '';
  const parts = [];
  if (staticRecord.height) parts.push(`${staticRecord.height}cm`);
  if (staticRecord.weight) parts.push(`${staticRecord.weight}kg`);
  if (staticRecord.head_circle) parts.push(`頭圍${staticRecord.head_circle}cm`);
  return parts.join(', ');
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
}

function openStaticDialog(baby: BabyRecord) {
  selectedBabyForStatic.value = baby;
  showStaticDialog.value = true;
  // 載入該寶寶的統計資料
  void babyStaticsStore.loadBabyStatics(baby.id);
}

function closeStaticDialog() {
  showStaticDialog.value = false;
  selectedBabyForStatic.value = null;
  staticForm.value = {
    height: null,
    weight: null,
    headCircle: null,
  };
}

async function saveStatic() {
  if (!selectedBabyForStatic.value || !hasValidStaticData.value) {
    $q.notify({
      type: 'negative',
      message: '請至少填寫一項數據',
    });
    return;
  }

  try {
    const staticData: { baby_id: string; height?: number; weight?: number; head_circle?: number } =
      {
        baby_id: selectedBabyForStatic.value.id,
      };

    if (staticForm.value.height !== null) staticData.height = staticForm.value.height;
    if (staticForm.value.weight !== null) staticData.weight = staticForm.value.weight;
    if (staticForm.value.headCircle !== null) staticData.head_circle = staticForm.value.headCircle;

    await babyStaticsStore.createBabyStatic(staticData);

    $q.notify({
      type: 'positive',
      message: '統計資料已新增',
    });

    // 重置表單但保持對話框開啟
    staticForm.value = {
      height: null,
      weight: null,
      headCircle: null,
    };
  } catch (err) {
    console.error('Save static error:', err);
    $q.notify({
      type: 'negative',
      message: '新增失敗，請稍後再試',
    });
  }
}

async function deleteStatic(staticId: string) {
  try {
    await babyStaticsStore.deleteBabyStatic(staticId);
    $q.notify({
      type: 'positive',
      message: '紀錄已刪除',
    });
  } catch (err) {
    console.error('Delete static error:', err);
    $q.notify({
      type: 'negative',
      message: '刪除失敗，請稍後再試',
    });
  }
}

// 初始化
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await databaseStore.loadBabyRecords();
    await babyStaticsStore.loadBabyStatics();
  }
});
</script>
