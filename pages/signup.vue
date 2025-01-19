<template>
  <div class="nickname-wrapper">
    <div class="instruction">사용할 닉네임을 입력해주세요.</div>
    <div class="input-wrapper">
      <input
        class="input"
        type="text"
        v-model="nickname"
        @input="clearError"
        placeholder="닉네임을 입력하세요"
      />
      <button @click="checkNickname" class="check-btn">중복 확인</button>
    </div>
    <div class="error-wrapper">
      <div
        :class="{ 'error-msg': errorMessage, 'success-msg': successMessage }"
      >
        {{ errorMessage || successMessage }}
      </div>
    </div>
    <!-- '입장하기' 버튼이 성공 메시지와 함께 나타나도록 -->
    <div v-if="successMessage">
      <button class="enter-btn" @click="enter">입장하기</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

const nickname = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const checkNickname = () => {
  if (!nickname.value) {
    errorMessage.value = "닉네임을 입력해주세요!";
    successMessage.value = "";
    return;
  }

  const isDuplicate = ["user1", "user2", "admin"].includes(nickname.value);

  if (isDuplicate) {
    errorMessage.value = "이미 사용 중인 닉네임입니다.";
    successMessage.value = "";
  } else {
    errorMessage.value = "";
    successMessage.value = "사용 가능한 닉네임입니다!";
  }
};

const clearError = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const enter = () => {
  // 닉네임 회원가입 및 로그인 로직
  router.push("/main");
};
</script>

<style>
.nickname-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 30vh;
  width: 100%;
}

.instruction {
  font-size: calc(1rem + 1vw);
  font-weight: 700;
  color: #444;
  margin-bottom: 1.5rem;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 600px;
}

.input {
  font-size: 1.2rem; /* 글자 크기 키우기 */
  padding: 1rem; /* 입력창 패딩을 키워서 크기 확장 */
  width: 80%; /* 입력창 넓이 증가 */
  border: 2px solid #ccc;
  border-radius: 8px;
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.check-btn {
  font-size: 1.2rem; /* 버튼 글자 크기 키우기 */
  padding: 1rem; /* 버튼 패딩 키우기 */
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

.input:focus {
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
}

.check-btn:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.check-btn:active {
  background-color: #003f8a;
  transform: translateY(1px);
}

.error-wrapper {
  margin-top: 0.5rem;
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.error-msg {
  color: rgb(255, 77, 73);
  font-size: 1.4rem;
  font-weight: bold;
  animation: fadeIn 0.3s ease-out;
}

.success-msg {
  color: rgb(72, 191, 85); /* 초록색 성공 메시지 */
  font-size: 1.4rem;
  font-weight: bold;
  animation: fadeIn 0.3s ease-out;
}

.enter-btn {
  margin-top: 5rem;
  font-size: 1.8rem;
  color: #444;
  text-decoration: none; /* 기본 텍스트 밑줄 제거 */
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.enter-btn:hover {
  text-decoration: underline; /* Hover 상태에서 밑줄 추가 */
  color: #0056b3; /* Hover 시 글자 색깔 변경 */
}

.enter-btn:active {
  color: #003f8a; /* 클릭 시 글자 색깔 더 어두워짐 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
