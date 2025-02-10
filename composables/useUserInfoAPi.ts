// API 응답 타입 정의

// 닉네임 중복 체크 API 응답 타입
export interface NicknameCheckResponse {
  code: number;
  message: string;
  data: boolean;
}

// 회원가입 API 응답 타입 (data는 생성된 닉네임)
export interface SignUpResponse {
  code: number;
  message: string;
  data: string;
}

// 로그인 API 응답 타입 (data는 로그인 성공 여부)
export interface SignInResponse {
  code: number;
  message: string;
  data: string;
}

export async function useNicknameCheck(
  nickname: string
): Promise<NicknameCheckResponse> {
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const data = await $fetch<NicknameCheckResponse>(
    "https://ssgg.store:443/signUp/check",
    {
      method: "GET",
      params: { nickname },
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    }
  );

  return data;
}

export async function useSignUp(nickname: string): Promise<SignUpResponse> {
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const data = await $fetch<SignUpResponse>("https://ssgg.store:443/signUp", {
    method: "POST",
    params: { nickname },
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  });

  return data;
}

export async function useSignIn(nickname: string): Promise<SignInResponse> {
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const data = await $fetch<SignInResponse>("https://ssgg.store:443/login", {
    method: "POST",
    params: { nickname },
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  });

  return data;
}
