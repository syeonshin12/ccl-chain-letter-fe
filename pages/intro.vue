<template>
  <div class="intro-container">
    <transition name="fade" mode="out-in">
      <component :is="currentSceneComponent" @next="nextScene" />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Intro1 from "/components/Intro1.vue";
import Intro2 from "/components/Intro2.vue";
import Intro3 from "/components/Intro3.vue";

// 상태 관리
const currentScene = ref(1);

// 동적 컴포넌트 계산
const currentSceneComponent = computed(() => {
  if (currentScene.value === 1) return Intro1;
  if (currentScene.value === 2) return Intro2;
  if (currentScene.value === 3) return Intro3;
});

// 씬 전환 메서드
const nextScene = () => {
  if (currentScene.value < 3) {
    currentScene.value += 1;
  }
};
</script>

<style scoped>
/* 트랜지션 스타일 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
