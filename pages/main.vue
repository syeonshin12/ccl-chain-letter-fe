<template>
  <div>
    <div class="tool-wrapper">
      <button class="write" @click="openLetterModal">글쓰기</button>
      <button class="dm">DM</button>
    </div>

    <letter-modal v-show="showLetterModal" />

    
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";

const openLetterModal = () => {
  showLetterModal.value = true;
};

const showLetterModal = ref(false);

const scene = new THREE.Scene();
</script>

<style>
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
