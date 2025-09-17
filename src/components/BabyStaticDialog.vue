<template>
  <!-- 全域統計資料對話框 -->
  <q-dialog v-model="isVisible" @hide="handleClose">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">{{ baby?.baby_name }} - 新增數據紀錄</div>
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
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="取消" @click="handleClose" />
        <q-btn
          flat
          label="新增紀錄"
          @click="saveStatic"
          :loading="loading"
          :disable="!hasValidStaticData"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useBabyStaticsStore } from 'src/stores/baby-statics-store';
import { useAuthStore } from 'src/stores/auth-store';
import { useQuasar } from 'quasar';
import type { BabyRecord } from 'src/supabase';

// Props
interface Props {
  modelValue: boolean;
  baby: BabyRecord | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  baby: null,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

// Stores
const babyStaticsStore = useBabyStaticsStore();
const authStore = useAuthStore();
const $q = useQuasar();

// 內部狀態
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const loading = computed(() => babyStaticsStore.loading);

// 表單資料
const staticForm = ref({
  height: null as number | null,
  weight: null as number | null,
  headCircle: null as number | null,
});

// 計算屬性
const hasValidStaticData = computed(() => {
  return (
    staticForm.value.height !== null ||
    staticForm.value.weight !== null ||
    staticForm.value.headCircle !== null
  );
});

// 方法
async function saveStatic() {
  if (!props.baby || !hasValidStaticData.value) {
    $q.notify({
      type: 'negative',
      message: '請至少填寫一項數據',
    });
    return;
  }

  try {
    // 驗證 baby_id 是否有效
    if (!props.baby.id) {
      throw new Error('Baby ID is missing');
    }

    const staticData: { baby_id: string; height?: number; weight?: number; head_circle?: number } =
      {
        baby_id: props.baby.id,
      };

    if (staticForm.value.height !== null) staticData.height = staticForm.value.height;
    if (staticForm.value.weight !== null) staticData.weight = staticForm.value.weight;
    if (staticForm.value.headCircle !== null) staticData.head_circle = staticForm.value.headCircle;

    console.log('Saving static data:', staticData);
    console.log('Current user ID:', authStore.user?.id);
    console.log('Baby user_id:', props.baby.user_id);

    const result = await babyStaticsStore.createBabyStatic(staticData);

    if (result.error) {
      console.error('Create baby static error:', result.error);
      throw new Error(result.error);
    }

    $q.notify({
      type: 'positive',
      message: '數據紀錄已新增',
    });

    // 重置表單並關閉對話框
    resetForm();
    emit('saved');
    isVisible.value = false;
  } catch (err) {
    console.error('Save static error:', err);
    $q.notify({
      type: 'negative',
      message: `新增失敗：${err instanceof Error ? err.message : '請稍後再試'}`,
    });
  }
}

function handleClose() {
  resetForm();
  isVisible.value = false;
}

function resetForm() {
  staticForm.value = {
    height: null,
    weight: null,
    headCircle: null,
  };
}

// 監聽對話框開啟，重置表單
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      resetForm();
    }
  },
);
</script>
