<template>
  <div class="nickname-wrapper">
    <div class="instruction">사용할 닉네임을 입력해주세요.</div>
    <div class="input-wrapper">
      <!-- maxlength 속성을 추가하여 입력을 30자로 제한 -->
      <input
        class="input"
        type="text"
        v-model="nickname"
        maxlength="30"
        @input="onInput"
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
    <!-- '입장하기' 버튼은 성공 메시지가 있을 때 나타납니다 -->
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

// 실시간으로 입력값의 공백, 글자수 등 에러를 체크하는 함수
const onInput = () => {
  // 먼저 에러 메시지 초기화
  errorMessage.value = "";
  successMessage.value = "";

  // 글자수 30자 초과 체크 (input의 maxlength 속성으로 이미 제한됨)
  if (nickname.value.length == 30) {
    errorMessage.value = "닉네임은 30자 이내로 입력해주세요.";
  }
};

const checkNickname = async () => {
  // 입력값 체크
  if (!nickname.value) {
    errorMessage.value = "닉네임을 입력해주세요!";
    successMessage.value = "";
    return;
  }

  // 추가 유효성 검사: 공백 포함 여부 확인
  if (/\s/.test(nickname.value)) {
    errorMessage.value = "닉네임에 공백은 허용되지 않습니다.";
    successMessage.value = "";
    return;
  }

  // 추가 유효성 검사: 한글(완성형, 자음, 모음), 영어, 숫자 이외의 문자가 입력된 경우
  if (!/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/.test(nickname.value)) {
    errorMessage.value = "닉네임은 한글, 영어, 숫자만 입력 가능합니다.";
    successMessage.value = "";
    return;
  }

  // 글자수가 30자 초과인 경우 (input maxlength 속성으로 제한되지만 추가 검증)
  if (nickname.value.length > 30) {
    errorMessage.value = "닉네임은 30자 이내로 입력해주세요.";
    successMessage.value = "";
    return;
  }

  try {
    // useNicknameCheck를 통해 API 호출
    const result = await useNicknameCheck(nickname.value);

    // 정상 응답(code가 0)인 경우
    if (result && result.code === 0) {
      // result.data가 true이면 이미 사용 중, false이면 사용 가능
      if (result.data) {
        errorMessage.value = "이미 사용 중인 닉네임입니다.";
        successMessage.value = "";
      } else {
        errorMessage.value = "";
        successMessage.value = "사용 가능한 닉네임입니다!";
      }
    } else {
      errorMessage.value = "API 응답이 올바르지 않습니다.";
      successMessage.value = "";
    }
  } catch (err: any) {
    errorMessage.value = err.message || "알 수 없는 오류가 발생했습니다.";
    successMessage.value = "";
  }
};

const enter = async () => {
  try {
    const signUpResult = await useSignUp(nickname.value);
    if (signUpResult && signUpResult.code === 0) {
      localStorage.setItem("nickname", signUpResult.data);
      router.push("/main");
    } else {
      errorMessage.value = `회원가입에 실패했습니다: ${signUpResult.message}`;
    }
  } catch (err: any) {
    errorMessage.value = err.message || "회원가입 중 오류가 발생했습니다.";
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
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 600px;
}

.input {
  font-size: 1.2rem;
  padding: 1rem;
  width: 80%;
  border: 2px solid #ccc;
  border-radius: 8px;
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.check-btn {
  font-size: 1.2rem;
  padding: 1rem;
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
  color: rgb(72, 191, 85);
  font-size: 1.4rem;
  font-weight: bold;
  animation: fadeIn 0.3s ease-out;
}

.enter-btn {
  margin-top: 4rem;
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
