export interface MessageData {
  id: number;
  content: string;
  imageUrl?: string;
}

export interface SendMessageResponse {
  code: number;
  message: string;
  data: MessageData;
}

export async function useSendMessage(
  content: string,
  nickname: string,
  image?: File
): Promise<SendMessageResponse> {
  // 필수 값 체크
  if (!content) {
    throw new Error("본문 내용을 입력해주세요.");
  }
  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  // FormData 생성
  const formData = new FormData();
  formData.append("content", content);
  formData.append("nickname", nickname);
  if (image) {
    formData.append("image", image);
  }

  // POST /messages API 호출
  const response = await $fetch<SendMessageResponse>(
    "https://3.36.169.63:443/messages",
    {
      method: "POST",
      body: formData,
      // multipart/form-data의 경우 Content-Type은 자동 설정됩니다.
    }
  );

  return response;
}
