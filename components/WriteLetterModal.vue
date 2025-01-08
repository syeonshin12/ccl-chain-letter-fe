<template>
  <div class="modal-overlay">
    <div class="letter-wrapper">
      <div class="file-upload-wrapper">
        <label for="file-upload" class="custom-file-upload">
          사진 업로드
          <input
            v-if="!previewUrl"
            type="file"
            id="file-upload"
            @change="handleImageUpload"
            accept="image/*"
          />
        </label>
      </div>

      <div class="img-wrapper" v-if="previewUrl">
        <img :src="previewUrl" alt="Preview" class="letter-img" />
        <button class="remove-btn" @click="handleRemoveImage">X</button>
      </div>

      <div class="content-wrapper">
        <div class="content">
          안녕하세요 반갑습니다. <br />요즘 날이 많이 추운데요<br />감기
          조심하시길 바랍니다.
        </div>
        <div class="letter-sender">From. 싱싱여니</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const imageFile = ref();
const previewUrl = ref();

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement; // 타입 단언으로 HTMLInputElement로 지정
  const file = target.files?.[0]; // 파일이 있을 경우에만 접근
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const handleRemoveImage = () => {
  imageFile.value = null;
  previewUrl.value = null;
};
</script>

<style scoped lang="scss">
#file-upload {
  display: none;
}

.file-upload-wrapper {
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
  height: 50%;
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

.content-wrapper {
  margin-top: 7vh;
  width: 90%;
  height: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content {
  font-size: clamp(1rem, 2vw, 1.5rem);
}

.letter-sender {
  margin-top: 2vh;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
}
</style>
