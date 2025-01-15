<template>
  <div class="nickname-wrapper">
    <div class="question">처음 오셨나요?</div>
    <div class="answer-wrapper">
      <button class="yes-btn" @click="handleYesBtn">네. 처음입니다.</button>
      <button class="no-btn" @click="handleNoBtn">
        아뇨.<br />이미 닉네임이 있습니다.
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const handleYesBtn = () => {};

const handleNoBtn = () => {};
</script>

<style lang="scss" scoped>
.nickname-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50px;
  margin-top: 10%;
}

.question {
  font-size: 25px;
  font-weight: bold;
}

.answer-wrapper {
  display: flex;
  gap: 30px;
}

button {
  width: 200px;
  height: 400px;
  border-radius: 20px;
}

.yes-btn {
  background-color: lightblue;
}

.no-btn {
  background-color: lightgray;
}
</style>
