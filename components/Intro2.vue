<template>
  <div class="intro-wrapper">
    <DotLottieVue
      renderer="canvas"
      class="intro-img"
      autoplay
      loop
      src="/row.lottie"
    />
    <div class="intro-content">
      <span class="text" v-html="displayedText"></span>
    </div>
    <button @click="emitNext" class="next-btn">탐험을 시작하시겠습니까?</button>
  </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";
import { ref, onMounted } from "vue";

const emits = defineEmits(["next"]);

// 타이핑 효과에 사용할 텍스트
const content =
  "이곳은 해류가 모든 것을 연결하는 세계.\n당신은 어떤 이야기를 보내고, 어떤 이야기를 발견하게 될까요?";
const displayedText = ref(""); // 현재 화면에 표시되는 텍스트
let i = 0;
let intervalId: number | null = null;

// 타이핑 로직
const typing = () => {
  if (i < content.length) {
    const currentChar = content[i++];
    displayedText.value += currentChar === "\n" ? "<br/>" : currentChar;
  } else if (intervalId) {
    clearInterval(intervalId); // 타이핑이 끝나면 인터벌 종료
    intervalId = null;
  }
};

function emitNext() {
  emits("next");
}

// 컴포넌트가 마운트되면 타이핑 효과 시작
onMounted(() => {
  intervalId = window.setInterval(typing, 100); // 200ms 간격으로 타이핑 실행
});
</script>

<style scoped lang="scss">
.intro-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 30px;
  margin-top: 2%;
}

.intro-img {
  width: 30vw;
  height: 30vw;
  max-width: 400px;
  max-height: 400px;
  min-width: 200px;
  min-height: 200px;
}

.intro-content {
  background-color: lightgray;
  border-radius: 10px;
  width: 90%;
  /* height: 200px; */
  max-width: 700px;
  padding: 20px;
  font-size: calc(0.9rem + 0.3vw);
  line-height: 1.5;
  text-align: justify;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.text {
  white-space: pre-wrap; // \n을 줄 바꿈으로 처리
  font-family: monospace; // 타이핑 느낌을 살리기 위한 고정폭 폰트
}

.next-btn {
  font-size: 20px;
}
</style>
