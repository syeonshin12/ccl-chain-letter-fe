<template>
  <div class="nickname-wrapper">
    <div class="question">처음 오셨나요?</div>
    <div class="answer-wrapper">
      <button class="yes-btn card" @click="handleYesBtn">
        네. 처음입니다.
      </button>
      <button class="no-btn card" @click="handleNoBtn">
        아뇨.<br />이미 닉네임이 있습니다.
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();

const handleYesBtn = () => {
  router.push("/signup");
};

const handleNoBtn = () => {
  router.push("/signin");
};
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
  font-size: 30px;
  font-weight: bold;
}

.answer-wrapper {
  display: flex;
  gap: 30px;
}

button {
  width: 250px;
  height: 400px;
  border-radius: 20px;
  padding: 10px;
  /* 기본 transition 추가 */
  transition: transform 0.2s ease;
}

/* 개별 버튼 스타일 */
.yes-btn {
  background-color: lightblue;
  font-size: 20px;
}

.no-btn {
  background-color: lightgray;
  font-size: 20px;
}

/* 마우스 호버 시 카드가 움직이는 효과 (확대 효과) */
.card:hover {
  transform: scale(1.03);
}
</style>
