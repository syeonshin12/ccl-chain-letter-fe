<template>
  <div class="modal-overlay">
    <div class="letter-wrapper">
      <button class="close-btn" @click="handleCloseModal">X</button>
      <!-- 만약에 이미지가 없으면 기본 이미지를 주자 -->
      <img class="letter-img" src="/public/test_img.jpeg" alt="" />
      <div class="content-wrapper">
        <div class="content">
          안녕하세요 반갑습니다. <br />요즘 날이 많이 추운데요<br />감기
          조심하시길 바랍니다.
        </div>
        <div class="letter-sender">From. 싱싱여니</div>
      </div>
      <button class="send-button" @click="handleSendDM">편지 보내기</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(["close-letter-modal"]);

const handleCloseModal = () => {
  emit("close-letter-modal");
};

const handleSendDM = () => {};
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed; /* 화면 고정 */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); /* 반투명 배경 */
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

.letter-img {
  border-radius: 10px;
  width: 90%;
  height: 50%;
  object-fit: contain;
  background-color: lightgray;
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

.send-button {
  margin-top: 2vh;
  width: 90%;
  height: 8%;
  font-size: 20px;
  border-radius: 10px;
  background: lightblue;
}
</style>
