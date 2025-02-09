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
          <div class="letter-sender">From. 싱싱여니</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";

// props: 부모(Main)에서 전달받은 selectedMessageId
const props = defineProps<{ selectedMessageId: number | null }>();
const emit = defineEmits(["close-letter-modal"]);

const messageDetail = ref<MessageDetail | null>(null);
const loading = ref(false);
const error = ref("");

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

// fullImageUrl: API에서 받은 imageUrl을 완전한 URL로 변환 (이미지가 없으면 기본 이미지 사용)
const fullImageUrl = computed(() => {
  console.error(messageDetail.value);
  if (messageDetail.value?.imageUrl) {
    const re = `https://3.36.169.63:443/${messageDetail.value.imageUrl.replace(/^\/+/, "")}`;
    console.error("adsfdfa", re);
    return re;
  }
  return "/test_img.jpeg"; // 기본 이미지 경로
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
  z-index: 20;
}

.close-btn {
  width: 90%;
  display: flex;
  justify-content: flex-end;
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 8px;
  :hover {
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
  margin-top: 10vh;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.letter-img {
  width: 90%;
  height: 50%;
  border-radius: 10px;
  object-fit: contain;
  background-color: lightgray;
}

.content-wrapper {
  margin-top: 50px;
  width: 90%;
  height: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
}

.content {
  font-size: clamp(1rem, 2vw, 1.5rem);
}

.letter-sender {
  margin-top: 2vh;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
}

.modal-body {
  width: 90%;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-body.error {
  color: red;
}
</style>
