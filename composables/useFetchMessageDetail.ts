// 개별 쪽지 상세 데이터 타입
export interface MessageDetail {
  id: number;
  content: string;
  imageUrl: string | null;
}

// 전체 응답 타입
export interface GetMessageDetailResponse {
  code: number;
  message: string;
  data: MessageDetail;
}

export async function useFetchMessageDetail(
  id: number
): Promise<GetMessageDetailResponse> {
  if (!id) {
    throw new Error("쪽지 식별 번호를 입력해주세요.");
  }

  const response = await $fetch<GetMessageDetailResponse>(
    `https://ssgg.store:443/messages/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response;
}
