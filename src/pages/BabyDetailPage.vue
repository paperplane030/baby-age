<template>
  <q-page class="q-pa-md">
    <!-- 頁面標題和返回按鈕 -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center">
        <q-btn flat round dense icon="arrow_back" @click="$router.push('/')" class="q-mr-md" />
        <div class="text-h4">{{ baby?.baby_name || '寶寶詳細資料' }}</div>
      </div>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="flex flex-center q-pa-xl">
      <q-banner class="text-negative">
        {{ error }}
      </q-banner>
    </div>

    <!-- 主要內容 -->
    <div v-else-if="baby" class="row q-gutter-lg">
      <!-- 左側：基本資料 -->
      <div class="col-12 col-md-4">
        <q-card class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="child_friendly" class="q-mr-sm" />
              基本資料
            </div>

            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label overline>寶寶姓名</q-item-label>
                  <q-item-label class="text-h6">{{ baby.baby_name }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label overline>出生日期</q-item-label>
                  <q-item-label>{{ formatDate(baby.birth_date) }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="baby.birth_week">
                <q-item-section>
                  <q-item-label overline>出生週數</q-item-label>
                  <q-item-label>{{ baby.birth_week }} 週</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="baby.birth_day !== null && baby.birth_day !== undefined">
                <q-item-section>
                  <q-item-label overline>出生天數</q-item-label>
                  <q-item-label>{{ baby.birth_day }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label overline>目前年齡</q-item-label>
                  <q-item-label>{{ calculateAge() }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label overline>矯正年齡</q-item-label>
                  <q-item-label>{{ calculateCorrectedAge() }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="baby.notes">
                <q-item-section>
                  <q-item-label overline>備註</q-item-label>
                  <q-item-label>{{ baby.notes }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <!-- 操作按鈕 -->
            <div class="q-mt-md">
              <q-btn
                color="primary"
                icon="edit"
                label="編輯資料"
                @click="editBaby"
                class="q-mr-sm"
              />
              <q-btn color="primary" icon="add" label="新增資料" @click="showStaticDialog = true" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 右側：成長統計 -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="trending_up" class="q-mr-sm" />
              資料紀錄
            </div>

            <!-- 統計表格 -->
            <q-table
              :rows="babyStatics"
              :columns="columns"
              row-key="id"
              :loading="staticsLoading"
              :rows-per-page-options="[10, 20, 50]"
              :no-data-label="'暫無資料紀錄'"
              class="q-mt-md"
            >
              <!-- 自定義行的樣式和內容 -->
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="confirmDeleteStatic(props.row.id)"
                  >
                    <q-tooltip>刪除</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template v-slot:body-cell-created_time="props">
                <q-td :props="props">
                  {{ formatDateTime(props.value) }}
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 新增統計對話框 -->
    <BabyStaticDialog v-model="showStaticDialog" :baby="baby" @saved="onStaticSaved" />

    <!-- 編輯寶寶對話框 -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">編輯寶寶資料</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="editForm.name"
            label="寶寶姓名"
            dense
            class="q-mb-sm"
            autofocus
            :rules="[(val) => !!val || '請輸入寶寶姓名']"
          />

          <q-input
            v-model="editForm.birthDate"
            label="出生日期"
            type="date"
            dense
            class="q-mb-sm"
            :rules="[(val) => !!val || '請選擇出生日期']"
          />

          <div class="row q-gutter-sm q-mb-sm">
            <div class="col">
              <q-input
                v-model.number="editForm.birthWeek"
                label="出生週數"
                type="number"
                dense
                min="20"
                max="42"
                hint="20-42週"
              />
            </div>
            <div class="col">
              <q-input
                v-model.number="editForm.birthDay"
                label="出生天數"
                type="number"
                dense
                min="0"
                max="6"
                hint="0-6的數字"
              />
            </div>
          </div>

          <q-input
            v-model="editForm.notes"
            label="備註"
            type="textarea"
            dense
            class="q-mt-sm"
            rows="3"
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="取消" @click="closeEditDialog" />
          <q-btn flat label="更新" @click="saveEdit" :loading="databaseStore.loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDatabaseStore } from 'src/stores/database-store';
import { useBabyStaticsStore } from 'src/stores/baby-statics-store';
import { useQuasar } from 'quasar';
import type { BabyRecord, BabyStatic } from 'src/supabase';
import BabyStaticDialog from 'src/components/BabyStaticDialog.vue';

// 路由和通知
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// Stores
const databaseStore = useDatabaseStore();
const babyStaticsStore = useBabyStaticsStore();

// 狀態
const baby = ref<BabyRecord | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showStaticDialog = ref(false);
const showEditDialog = ref(false);

// 統計表單
const staticForm = ref({
  height: null as number | null,
  weight: null as number | null,
  headCircle: null as number | null,
});

// 編輯表單
const editForm = ref({
  name: '',
  birthDate: '',
  birthWeek: null as number | null,
  birthDay: null as number | null,
  notes: '',
});

// 計算屬性
const babyId = computed(() => route.params.id as string);
const babyStatics = computed(() => {
  if (!baby.value) return [];
  return babyStaticsStore.getStaticsByBabyId(baby.value.id);
});

const staticsLoading = computed(() => babyStaticsStore.loading);

const hasValidStaticData = computed(() => {
  return (
    staticForm.value.height !== null ||
    staticForm.value.weight !== null ||
    staticForm.value.headCircle !== null
  );
});

// 表格欄位定義
const columns = [
  {
    name: 'created_time',
    label: '記錄時間',
    field: 'created_time',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'height',
    label: '身高 (cm)',
    field: 'height',
    align: 'center' as const,
    format: (val: number | null) => (val ? `${val} cm` : '-'),
  },
  {
    name: 'weight',
    label: '體重 (kg)',
    field: 'weight',
    align: 'center' as const,
    format: (val: number | null) => (val ? `${val} kg` : '-'),
  },
  {
    name: 'head_circle',
    label: '頭圍 (cm)',
    field: 'head_circle',
    align: 'center' as const,
    format: (val: number | null) => (val ? `${val} cm` : '-'),
  },
  {
    name: 'actions',
    label: '操作',
    field: 'actions',
    align: 'center' as const,
  },
];

// 方法
function loadBabyData() {
  const foundBaby = databaseStore.babyRecords.find((b) => b.id === babyId.value);
  if (foundBaby) {
    baby.value = foundBaby;
    loading.value = false;
  } else {
    error.value = '找不到寶寶資料';
    loading.value = false;
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-TW');
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW');
}

function calculateAge(): string {
  if (!baby.value) return '';

  const birthDate = new Date(baby.value.birth_date);
  const today = new Date();

  const diffTime = today.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  if (months > 0) {
    return `${months} 個月 ${days} 天`;
  } else {
    return `${days} 天`;
  }
}

function calculateCorrectedAge(): string {
  if (!baby.value || !baby.value.birth_week) {
    return calculateAge(); // 如果沒有週數資料，回傳一般年齡
  }

  // 計算矯正年齡：從預產期 (40週) 開始計算
  const fullTermWeeks = 40;
  const preTermWeeks = baby.value.birth_week;
  const prematureWeeks = fullTermWeeks - preTermWeeks;

  const birthDate = new Date(baby.value.birth_date);
  const correctedBirthDate = new Date(
    birthDate.getTime() + prematureWeeks * 7 * 24 * 60 * 60 * 1000,
  );
  const today = new Date();

  if (correctedBirthDate > today) {
    return '尚未到預產期';
  }

  const diffTime = today.getTime() - correctedBirthDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  if (months > 0) {
    return `${months} 個月 ${days} 天 (矯正)`;
  } else {
    return `${days} 天 (矯正)`;
  }
}

function editBaby() {
  if (!baby.value) return;

  // 填入目前的寶寶資料到編輯表單
  editForm.value = {
    name: baby.value.baby_name,
    birthDate: baby.value.birth_date,
    birthWeek: baby.value.birth_week || null,
    birthDay: baby.value.birth_day || null,
    notes: baby.value.notes || '',
  };

  showEditDialog.value = true;
}

async function saveStatic() {
  if (!baby.value || !hasValidStaticData.value) {
    $q.notify({
      type: 'negative',
      message: '請至少填寫一項數據',
    });
    return;
  }

  try {
    const staticData: { baby_id: string; height?: number; weight?: number; head_circle?: number } =
      {
        baby_id: baby.value.id,
      };

    if (staticForm.value.height !== null) staticData.height = staticForm.value.height;
    if (staticForm.value.weight !== null) staticData.weight = staticForm.value.weight;
    if (staticForm.value.headCircle !== null) staticData.head_circle = staticForm.value.headCircle;

    await babyStaticsStore.createBabyStatic(staticData);

    $q.notify({
      type: 'positive',
      message: '統計資料已新增',
    });

    closeAddStaticDialog();
  } catch (err) {
    console.error('Save static error:', err);
    $q.notify({
      type: 'negative',
      message: '新增失敗，請稍後再試',
    });
  }
}

function closeAddStaticDialog() {
  showStaticDialog.value = false;
  staticForm.value = {
    height: null,
    weight: null,
    headCircle: null,
  };
}

function onStaticSaved() {
  showStaticDialog.value = false;
}

async function saveEdit() {
  if (!baby.value || !editForm.value.name || !editForm.value.birthDate) {
    $q.notify({
      type: 'negative',
      message: '請填寫完整資料',
    });
    return;
  }

  try {
    const updateData: Record<string, unknown> = {
      baby_name: editForm.value.name,
      birth_date: editForm.value.birthDate,
      notes: editForm.value.notes,
    };

    if (editForm.value.birthWeek !== null) {
      updateData.birth_week = editForm.value.birthWeek;
    }
    if (editForm.value.birthDay !== null) {
      updateData.birth_day = editForm.value.birthDay;
    }

    await databaseStore.updateBabyRecord(
      baby.value.id,
      updateData as Partial<Omit<BabyRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    );

    // 重新載入寶寶資料
    await databaseStore.loadBabyRecords();
    loadBabyData();

    $q.notify({
      type: 'positive',
      message: '寶寶資料已更新',
    });

    closeEditDialog();
  } catch (err) {
    console.error('Update baby error:', err);
    $q.notify({
      type: 'negative',
      message: '更新失敗，請稍後再試',
    });
  }
}

function closeEditDialog() {
  showEditDialog.value = false;
  editForm.value = {
    name: '',
    birthDate: '',
    birthWeek: null,
    birthDay: null,
    notes: '',
  };
}

function confirmDeleteStatic(staticId: string) {
  $q.dialog({
    title: '確認刪除',
    message: '確定要刪除這筆統計記錄嗎？',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await babyStaticsStore.deleteBabyStatic(staticId);
      $q.notify({
        type: 'positive',
        message: '記錄已刪除',
      });
    } catch (err) {
      console.error('Delete static error:', err);
      $q.notify({
        type: 'negative',
        message: '刪除失敗，請稍後再試',
      });
    }
  });
}

// 初始化
onMounted(async () => {
  try {
    loading.value = true;

    // 如果沒有載入寶寶記錄，先載入
    if (databaseStore.babyRecords.length === 0) {
      await databaseStore.loadBabyRecords();
    }

    // 載入寶寶資料
    loadBabyData();

    // 載入統計資料
    if (baby.value) {
      await babyStaticsStore.loadBabyStatics(baby.value.id);
    }
  } catch (err) {
    console.error('Load data error:', err);
    error.value = '載入資料失敗';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.q-table {
  max-height: 70vh;
}
</style>
