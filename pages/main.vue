<template>
  <div class="main-wrapper">
    <div class="tool-wrapper">
      <button class="write" @click="openWriteLetterModal">글쓰기</button>
      <button class="dm">DM</button>
    </div>

    <write-letter-modal v-show="showWriteLetterModal" />
    <letter-modal v-show="showLetterModal" />
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";

const showLetterModal = ref(false);
const showWriteLetterModal = ref(false);

const openWriteLetterModal = () => {
  showWriteLetterModal.value = true;
};

const openLetterModal = () => {
  showLetterModal.value = true;
};

const scene = new THREE.Scene();
</script>

<style scoped>
.tool-wrapper {
  position: absolute;
  top: 30px;
  right: 40px;
  display: flex;
  font-size: 20px;
}
.write {
  margin-right: 10px;
}
</style>
