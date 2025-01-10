<template>
  <div class="modal-overlay">
    <div class="letter-wrapper">
      <button class="close-btn" @click="handleCloseModal">X</button>
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

      <textarea
        class="custom_textarea"
        placeholder="내용을 입력해보세요."
        maxlength="100"
      ></textarea>

      <button class="send-button" @click="handleSendLetter">편지 보내기</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const imageFile = ref();
const previewUrl = ref();
const emit = defineEmits(["close-write-modal"]);

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement; // 타입 단언으로 HTMLInputElement로 지정
  const file = target.files?.[0]; // 파일이 있을 경우에만 접근
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleCloseModal = () => {
  emit("close-write-modal");
};

const handleRemoveImage = () => {
  imageFile.value = null;
  previewUrl.value = null;
};

const handleSendLetter = () => {};
</script>

<style scoped lang="scss">
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
  border-radius: 10px; /* 부드러운 모서리 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 약간의 그림자 */
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
  position: absolute; /* 이미지 위에 위치 */
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

.letter-sender {
  margin-top: 2vh;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
}

.send-button {
  margin-top: 2vh;
  width: 90%;
  height: 8%;
  font-size: 20px;
  border-radius: 10px;
  background: lightblue;
}
</style>
