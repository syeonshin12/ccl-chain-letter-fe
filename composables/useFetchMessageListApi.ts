// 개별 쪽지 데이터 타입
export interface Message {
  id: number;
  content: string;
  imageUrl: string | null;
}

// 전체 쪽지 조회 API 응답 타입
export interface GetMessagesResponse {
  code: number;
  message: string;
  data: Message[];
}

export async function useFetchMessageList(): Promise<GetMessagesResponse> {
  const response = await $fetch<GetMessagesResponse>(
    "https://3.36.169.63:443/messages",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response;
}
