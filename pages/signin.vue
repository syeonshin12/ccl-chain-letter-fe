<template>
  <div class="nickname-wrapper">
    <div class="instruction">닉네임을 입력해주세요.</div>
    <div class="input-wrapper">
      <input
        class="input"
        type="text"
        v-model="nickname"
        @input="clearError"
        @keyup.enter="enter"
        placeholder="닉네임을 입력하세요"
      />
    </div>
    <div class="error-wrapper">
      <div
        :class="{ 'error-msg': errorMessage, 'success-msg': successMessage }"
      >
        {{ errorMessage || successMessage }}
      </div>
    </div>
    <div>
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

const clearError = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const enter = async () => {
  if (!nickname.value) {
    errorMessage.value = "닉네임을 입력해주세요!";
    successMessage.value = "";
    return;
  }

  // 공백 포함 여부 체크
  if (/\s/.test(nickname.value)) {
    errorMessage.value = "닉네임에 공백은 허용되지 않습니다.";
    successMessage.value = "";
    return;
  }

  // 허용 문자 검사: 한글(가-힣), 자모(ㄱ-ㅎ, ㅏ-ㅣ), 영어(a-z, A-Z), 숫자(0-9)만 허용

  if (!/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/.test(nickname.value)) {
    errorMessage.value = "닉네임은 한글, 영어, 숫자만 입력 가능합니다.";
    successMessage.value = "";
    return;
  }

  try {
    const result = await useSignIn(nickname.value);

    if (
      result &&
      result.code === 0 &&
      typeof result.data === "string" &&
      result.data.trim().length > 0
    ) {
      errorMessage.value = "";
      successMessage.value = "환영합니다!";
      // 로그인 성공 시 localStorage에 닉네임 저장
      localStorage.setItem("nickname", result.data);
      localStorage.setItem("firstVisit", "false");
      // 로그인 성공 후 1초 후에 메인 페이지로 이동
      setTimeout(() => router.push("/main"), 1000);
    }
  } catch (err: any) {
    errorMessage.value = "존재하지 않는 닉네임입니다.";
    successMessage.value = "";
  }
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
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

.input {
  font-size: 1.2rem;
  padding: 1rem;
  width: 100%;
  border: 2px solid #ccc;
  border-radius: 8px;
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.input:focus {
  border-color: #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
}

.error-wrapper {
  margin-top: 0.5rem;
  width: 100%;
  max-width: 500px;
  text-align: left;
}

.error-msg {
  color: rgb(255, 77, 73);
  font-size: 1.4rem;
  font-weight: bold;
  animation: fadeIn 0.3s ease-out;
}

.success-msg {
  color: rgb(72, 191, 85);
  font-size: 1.4rem;
  font-weight: bold;
  animation: fadeIn 0.3s ease-out;
}

.enter-btn {
  margin-top: 2rem;
  font-size: 1.8rem;
  color: #444;
  text-decoration: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.enter-btn:hover {
  text-decoration: underline;
  color: #0056b3;
}

.enter-btn:active {
  color: #003f8a;
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
