<template>
  <div class="modal-overlay">
    <div class="letter-wrapper">
      <button class="close-btn" @click="handleCloseModal">X</button>

      <!-- 이미지 업로드 영역 -->
      <div class="file-upload-wrapper" v-if="!previewUrl">
        <label for="file-upload" class="custom-file-upload">
          사진 업로드
          <input
            type="file"
            id="file-upload"
            @change="handleImageUpload"
            accept="image/*"
          />
        </label>
      </div>
      <div class="img-wrapper" v-else>
        <img :src="previewUrl" alt="Preview" class="letter-img" />
        <button class="remove-btn" @click="handleRemoveImage">X</button>
      </div>

      <!-- 본문 입력 영역 (maxlength 100 적용) -->
      <!-- @input 이벤트 추가: 입력 시작 시 에러 메시지 초기화 -->
      <textarea
        class="custom_textarea"
        v-model="content"
        placeholder="내용을 입력해보세요."
        maxlength="100"
        @input="clearError"
      ></textarea>

      <!-- 쪽지 전송 버튼 -->
      <button class="send-button" @click="handleSendLetter">편지 보내기</button>

      <!-- 에러/성공 메시지 -->
      <div class="error-wrapper" v-if="errorMessage || successMessage">
        <div
          :class="{ 'error-msg': errorMessage, 'success-msg': successMessage }"
        >
          {{ errorMessage || successMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";

const imageFile = ref<File | null>(null);
const previewUrl = ref("");
const content = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const emit = defineEmits(["close-write-modal"]);

// 모달이 열리면 localStorage에서 닉네임을 바로 확인
onMounted(() => {
  const storedNickname = localStorage.getItem("nickname");
  if (!storedNickname) {
    errorMessage.value = "닉네임 정보가 없습니다. 로그인 후 이용해주세요.";
  }
});

// 이미지 업로드 핸들러: 파일 크기가 5MB 이상이면 에러 처리 후 1초 후 에러 메시지 자동 제거
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    if (file.size >= 5 * 1024 * 1024) {
      errorMessage.value = "이미지는 5MB 미만으로 업로드 가능합니다.";
      setTimeout(() => {
        errorMessage.value = "";
      }, 1000);
      return;
    }
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

// 이미지 제거 핸들러
const handleRemoveImage = () => {
  imageFile.value = null;
  previewUrl.value = "";
};

// 모달 닫기 핸들러
const handleCloseModal = () => {
  emit("close-write-modal");
};

// 쪽지 전송 API 호출 핸들러
const handleSendLetter = async () => {
  // 본문 내용 유효성 검사
  if (!content.value.trim()) {
    errorMessage.value = "본문 내용을 입력해보세요.";
    return;
  }
  if (content.value.length > 100) {
    errorMessage.value = "본문은 100자 이내로 입력해주세요.";
    return;
  }

  // localStorage에 저장된 닉네임 추출 (로그인 시 저장한 값)
  const storedNickname = localStorage.getItem("nickname");
  if (!storedNickname) {
    errorMessage.value = "닉네임 정보가 없습니다. 다시 로그인 해주세요.";
    return;
  }

  // FormData 생성 (multipart/form-data)
  const formData = new FormData();
  formData.append("content", content.value);
  formData.append("nickname", storedNickname);
  if (imageFile.value) {
    formData.append("image", imageFile.value);
  }

  try {
    const response = await useSendMessage(
      content.value,
      storedNickname,
      imageFile.value || undefined
    );

    if (response.code === 0) {
      successMessage.value = "쪽지가 전송되었습니다!";
      errorMessage.value = "";
      content.value = "";
      imageFile.value = null;
      previewUrl.value = "";
      setTimeout(() => {
        emit("close-write-modal");
      }, 1000);
    } else {
      errorMessage.value = response.message || "쪽지 전송 실패";
      successMessage.value = "";
    }
  } catch (err: any) {
    errorMessage.value = err.message || "쪽지 전송 중 오류가 발생했습니다.";
    successMessage.value = "";
  }
};

// clearError: 입력 이벤트가 발생하면 에러와 성공 메시지 초기화
const clearError = () => {
  errorMessage.value = "";
  successMessage.value = "";
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
}

#file-upload {
  display: none;
}

.file-upload-wrapper {
  width: 90%;
  height: 40%;
  background-color: lightgray;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-file-upload {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.custom-file-upload:hover {
  background-color: #45a049;
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

.img-wrapper {
  position: relative;
  width: 90%;
  height: 40%;
}

.letter-img {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: contain;
}

.remove-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.custom_textarea {
  margin-top: 2vh;
  width: 90%;
  height: 40%;
  padding: 20px;
  font-size: clamp(1rem, 2vw, 1.5rem);
  background-color: rgb(223, 219, 219);
  resize: none;
  color: black;
  border-radius: 10px;
  outline: none;
}

.send-button {
  margin-top: 2vh;
  width: 90%;
  height: 8%;
  font-size: 20px;
  border-radius: 10px;
  background: lightblue;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-wrapper {
  margin-top: 1vh;
  width: 90%;
  text-align: center;
}

.error-msg {
  color: red;
  font-size: 1.4rem;
  font-weight: bold;
}

.success-msg {
  color: green;
  font-size: 1.4rem;
  font-weight: bold;
}
</style>
