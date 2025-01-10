<template>
  <div class="intro-wrapper">
    <div class="title">행운의 편지</div>

    <DotLottieVue
      style="height: 300px; width: 300px"
      autoplay
      loop
      src="https://lottie.host/84649680-3b14-4daf-9b79-e25375c09bd7/gHuO5pgPxA.lottie"
    />
    <NuxtLink to="/intro">
      <button class="start-button">시작하기</button>
    </NuxtLink>
  </div>
</template>

<script lang="ts" setup>
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";
</script>

<style lang="scss" scoped>
body {
  margin: 0;
  padding: 0;
}

.intro-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.title {
  font-size: clamp(2.5rem, 8vw, 5.5rem);
  font-weight: bold;
  color: #bcccdc;
  margin-bottom: 1vh;
  /* -webkit-background-clip: text;
  background: url(public/wave.svg) repeat-x center;
  animation: wave 3s both linear infinite; */
}

.start-button {
  display: inline-block;
  position: relative;
  font-size: clamp(2rem, 3vw, 10rem);
  color: #e0f4ff;
}

.start-button::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 5px; /* 밑줄 두께 */
  background: #007bff; /* 밑줄 색상 */
  transition: width 0.3s ease-in-out; /* 애니메이션 속도와 효과 */
}

.start-button:hover::after {
  width: 100%;
}
</style>
