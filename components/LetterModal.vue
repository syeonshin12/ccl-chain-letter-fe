<template>
  <div class="modal-overlay">
    <div class="letter-wrapper">
      <button class="close-btn" @click="handleCloseModal">X</button>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="modal-body">로딩중...</div>
      <!-- 오류 발생 시 -->
      <div v-else-if="error" class="modal-body error">
        {{ error }}
      </div>
      <!-- 데이터가 정상적으로 로드된 경우 -->
      <div v-else class="modal-body">
        <img class="letter-img" :src="fullImageUrl" alt="쪽지 이미지" />
        <div class="content-wrapper">
          <div class="content">
            {{ messageDetail?.content }}
          </div>

          <div class="letter-sender">From. {{ messageDetail?.nickname }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";

const props = defineProps<{ selectedMessageId: number | null }>();
const emit = defineEmits(["close-letter-modal"]);

const messageDetail = ref<MessageDetail | null>(null);
const loading = ref(false);
const error = ref("");

// selectedMessageId가 변경되면 쪽지 상세 정보를 조회
watch(
  () => props.selectedMessageId,
  async (newId) => {
    if (newId !== null) {
      loading.value = true;
      error.value = "";
      try {
        const res: GetMessageDetailResponse =
          await useFetchMessageDetail(newId);
        if (res && res.code === 0) {
          messageDetail.value = res.data;
        } else {
          error.value = res.message || "쪽지 상세 정보를 가져오지 못했습니다.";
        }
      } catch (err: any) {
        error.value = err.message || "쪽지 조회 중 오류가 발생했습니다.";
      } finally {
        loading.value = false;
      }
    }
  },
  { immediate: true }
);

// fullImageUrl: imageUrl이 존재하면 "https://ssgg.store:443/{이미지파일명}" 형태로 반환, 없으면 기본 이미지
const fullImageUrl = computed(() => {
  if (messageDetail.value?.imageUrl) {
    return `https://ssgg.store:443/${messageDetail.value.imageUrl.replace(/^\/+/, "")}`;
  }
  return "/test_img.jpeg";
});

const handleCloseModal = () => {
  emit("close-letter-modal");
};
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.close-btn {
  width: 90%;
  display: flex;
  justify-content: flex-end;
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 8px;
  &:hover {
    cursor: pointer;
  }
}

.letter-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  background-color: #fdfde7;
  width: clamp(60vw, 80%, 90vw);
  max-width: 40%;
  min-width: 300px;
  height: 80vh;
  text-align: center;
  margin: 0 auto;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.letter-img {
  width: 90%;
  height: 45%;
  border-radius: 10px;
  object-fit: contain;
  background-color: lightgray;
}

.content-wrapper {
  margin-top: 50px;
  width: 90%;
  /* height: 50%; */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
}

.content {
  font-size: clamp(1rem, 2vw, 1.5rem);
  white-space: pre-wrap; /* 추가: 줄 바꿈과 공백 유지 */
}

.letter-sender {
  margin-top: 2vh;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
}

.modal-body {
  width: 90%;
  height: 100%;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-body.error {
  color: red;
}
</style>
