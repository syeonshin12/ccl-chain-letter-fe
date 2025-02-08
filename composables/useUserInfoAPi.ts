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

export async function useNicknameCheck(
  nickname: string
): Promise<NicknameCheckResponse> {
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  // 한글 입력값을 NFC 형식으로 정규화
  const normalizedNickname = nickname.normalize("NFC");
  console.error(normalizedNickname);

  const data = await $fetch<NicknameCheckResponse>(
    "https://3.36.169.63:443/signUp/check",
    {
      method: "GET",
      params: { nickname: normalizedNickname },
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

  // 한글 입력값을 NFC 형식으로 정규화
  const normalizedNickname = nickname.normalize("NFC");

  const data = await $fetch<SignUpResponse>("https://3.36.169.63:443/signUp", {
    method: "POST",
    params: { nickname: normalizedNickname },
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  });

  return data;
}
