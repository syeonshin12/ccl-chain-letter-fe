// API 응답 타입 정의
export interface NicknameCheckResponse {
  code: number;
  message: string;
  data: boolean;
}

export async function useNicknameCheck(
  nickname: string
): Promise<NicknameCheckResponse> {
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const data = await $fetch<NicknameCheckResponse>(
    "https://3.36.169.63:443/signUp/check",
    {
      method: "GET",
      params: { nickname },
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return data;
}
