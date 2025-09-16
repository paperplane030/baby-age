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
      <div class="col-12 col-md-3">
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
                  <q-item-label class="text-h6">{{ calculateCorrectedAge() }}</q-item-label>
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

      <!-- 圖表和統計 -->
      <div class="row">
        <!-- 成長曲線圖表 -->
        <div class="row q-gutter-md q-mb-lg">
          <!-- 身高圖表 -->
          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="height" class="q-mr-sm" />
                  身高變化
                </div>
                <canvas ref="heightChart" width="300" height="200"></canvas>
              </q-card-section>
            </q-card>
          </div>

          <!-- 體重圖表 -->
          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="monitor_weight" class="q-mr-sm" />
                  體重變化
                </div>
                <canvas ref="weightChart" width="300" height="200"></canvas>
              </q-card-section>
            </q-card>
          </div>

          <!-- 頭圍圖表 -->
          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">
                  <q-icon name="psychology" class="q-mr-sm" />
                  頭圍變化
                </div>
                <canvas ref="headChart" width="300" height="200"></canvas>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- 資料紀錄表格 -->
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
              <q-select
                v-model="editForm.birthDay"
                label="出生天數"
                dense
                :options="[
                  { label: '0', value: 0 },
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                  { label: '5', value: 5 },
                  { label: '6', value: 6 },
                ]"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                clearable
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
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDatabaseStore } from 'src/stores/database-store';
import { useBabyStaticsStore } from 'src/stores/baby-statics-store';
import { useQuasar } from 'quasar';
import type { BabyRecord, BabyStatic } from 'src/supabase';
import BabyStaticDialog from 'src/components/BabyStaticDialog.vue';
import { Chart, registerables, type ChartConfiguration, type Chart as ChartType } from 'chart.js';
import 'chartjs-adapter-date-fns';

// 路由和通知
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// Stores
const databaseStore = useDatabaseStore();
const babyStaticsStore = useBabyStaticsStore();

// 註冊 Chart.js 組件
Chart.register(...registerables);

// 狀態
const baby = ref<BabyRecord | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showStaticDialog = ref(false);
const showEditDialog = ref(false);

// 圖表 refs
const heightChart = ref<HTMLCanvasElement>();
const weightChart = ref<HTMLCanvasElement>();
const headChart = ref<HTMLCanvasElement>();

// 圖表實例
const heightChartInstance = ref<ChartType>();
const weightChartInstance = ref<ChartType>();
const headChartInstance = ref<ChartType>();

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

const staticsLoading = computed(() => {
  // 只有在有寶寶資料且正在載入統計資料時才顯示 loading
  return !!(baby.value && babyStaticsStore.loading && babyStatics.value.length === 0);
});

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
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 因為出生當天算第一天

  return `${diffDays} 天`;
}

function calculateCorrectedAge(): string {
  if (!baby.value || !baby.value.birth_week) {
    return calculateAge(); // 如果沒有週數資料，回傳一般年齡
  }

  const birthDate = new Date(baby.value.birth_date);
  const today = new Date();

  // 計算出生胎齡（天數）
  // 胎齡 = 出生週數*7+出生天數
  const birthWeeks = baby.value.birth_week;
  const birthDays = baby.value.birth_day || 0;
  const gestationalAgeInDays = birthWeeks * 7 + birthDays;

  // 足月基準: 40週 (280天)
  const fullTermDays = 280;

  // 計算出生後天數
  const diffTime = today.getTime() - birthDate.getTime();
  const daysAfterBirth = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 矯正年齡 = 出生胎齡 + 出生後天數
  const correctedAgeInDays = gestationalAgeInDays + daysAfterBirth;

  // 如果還沒達到足月（280天）
  if (correctedAgeInDays < fullTermDays) {
    // 未達足月時，直接顯示矯正年齡的月和天
    const months = Math.floor(correctedAgeInDays / 30);
    const days = correctedAgeInDays % 30;

    if (months > 0) {
      return `${months} 個月 ${days} 天`;
    } else {
      return `${days} 天`;
    }
  }

  // 已達到或超過足月，計算足月後的年齡
  const daysAfterFullTerm = correctedAgeInDays - fullTermDays;
  const months = Math.floor(daysAfterFullTerm / 30);
  const days = daysAfterFullTerm % 30;

  // 足月的話顯示足月幾月幾天，不足月的話僅顯示幾月幾天
  if (gestationalAgeInDays >= fullTermDays) {
    // 原本就是足月出生
    if (months > 0) {
      return `${months} 個月 ${days} 天`;
    } else {
      return `${days} 天`;
    }
  } else {
    // 早產兒，顯示矯正年齡
    if (months > 0) {
      return `足月 ${months} 個月 ${days} 天`;
    } else {
      return `足月 ${days} 天`;
    }
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

// 圖表相關函數
function createChart(
  canvas: HTMLCanvasElement,
  label: string,
  data: { x: Date; y: number }[],
  color: string,
  unit: string,
  latestDate?: string,
): ChartType {
  const dateText = latestDate
    ? `(${new Date(latestDate).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })})`
    : '';

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      datasets: [
        {
          label: label,
          data: data as any,
          borderColor: color,
          backgroundColor: color + '20',
          pointBackgroundColor: color, // 設定點的背景色為實心
          pointBorderColor: color, // 設定點的邊框色
          pointRadius: 4, // 設定點的大小
          pointHoverRadius: 6, // 滑鼠懸停時點的大小
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MM/dd',
            },
          },
          title: {
            display: true,
            text: '日期',
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: `${unit} ${dateText}`,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };

  return new Chart(canvas, config);
}

function updateCharts() {
  if (!baby.value || !babyStatics.value.length) return;

  nextTick(() => {
    // 準備圖表資料
    const sortedData = [...babyStatics.value].sort(
      (a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime(),
    );

    // 身高資料
    const heightData = sortedData
      .filter((stat) => stat.height !== null && stat.height !== undefined)
      .map((stat) => ({
        x: new Date(stat.created_time),
        y: stat.height!,
      }));

    // 體重資料
    const weightData = sortedData
      .filter((stat) => stat.weight !== null && stat.weight !== undefined)
      .map((stat) => ({
        x: new Date(stat.created_time),
        y: stat.weight!,
      }));

    // 頭圍資料
    const headData = sortedData
      .filter((stat) => stat.head_circle !== null && stat.head_circle !== undefined)
      .map((stat) => ({
        x: new Date(stat.created_time),
        y: stat.head_circle!,
      }));

    // 更新或創建身高圖表
    if (heightChart.value) {
      if (heightChartInstance.value) {
        heightChartInstance.value.destroy();
      }
      const latestHeight = heightData.length > 0 ? heightData[heightData.length - 1] : null;
      const latestHeightDate = latestHeight?.x ? latestHeight.x.toISOString() : undefined;
      heightChartInstance.value = createChart(
        heightChart.value,
        '身高',
        heightData,
        '#2196F3',
        '身高 (cm)',
        latestHeightDate,
      );
    }

    // 更新或創建體重圖表
    if (weightChart.value) {
      if (weightChartInstance.value) {
        weightChartInstance.value.destroy();
      }
      const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1] : null;
      const latestWeightDate = latestWeight?.x ? latestWeight.x.toISOString() : undefined;
      weightChartInstance.value = createChart(
        weightChart.value,
        '體重',
        weightData,
        '#4CAF50',
        '體重 (kg)',
        latestWeightDate,
      );
    }

    // 更新或創建頭圍圖表
    if (headChart.value) {
      if (headChartInstance.value) {
        headChartInstance.value.destroy();
      }
      const latestHead = headData.length > 0 ? headData[headData.length - 1] : null;
      const latestHeadDate = latestHead?.x ? latestHead.x.toISOString() : undefined;
      headChartInstance.value = createChart(
        headChart.value,
        '頭圍',
        headData,
        '#FF9800',
        '頭圍 (cm)',
        latestHeadDate,
      );
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

    // 初始化圖表
    await nextTick();
    updateCharts();
  } catch (err) {
    console.error('Load data error:', err);
    error.value = '載入資料失敗';
  } finally {
    loading.value = false;
  }
});

// 監聽統計資料變化，更新圖表
watch(
  () => babyStatics.value,
  () => {
    updateCharts();
  },
  { deep: true },
);
</script>

<style scoped>
.q-table {
  max-height: 70vh;
}
</style>
