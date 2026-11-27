/** 訪問ログ API（/api/seichi-map/visited）の呼び出し。フォーム保存とワンタップ記録で共有する */

export type SaveSeichiMapVisitInput = {
  /** 指定すると更新（PUT）、省略すると新規（POST） */
  id?: string;
  locationId: string;
  locationName: string;
  /** YYYY-MM-DD */
  visitedDate: string;
  note: string;
  url: string;
};

export type SaveSeichiMapVisitMessages = {
  saveFailed: string;
  updateFailed: string;
};

export type SaveSeichiMapVisitResult<TItem, TUnlocked> = {
  item?: TItem;
  unlockedAchievements?: TUnlocked[];
};

const readErrorMessage = async (response: Response) => {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  return payload.error;
};

export async function saveSeichiMapVisit<TItem, TUnlocked = unknown>(
  input: SaveSeichiMapVisitInput,
  messages: SaveSeichiMapVisitMessages,
): Promise<SaveSeichiMapVisitResult<TItem, TUnlocked>> {
  const response = await fetch("/api/seichi-map/visited", {
    method: input.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(input.id ? { id: input.id } : {}),
      locationId: input.locationId,
      locationName: input.locationName,
      visitedAt: `${input.visitedDate}T00:00:00.000Z`,
      note: input.note,
      url: input.url,
    }),
  });

  if (!response.ok) {
    throw new Error(
      (await readErrorMessage(response)) ||
        (input.id ? messages.updateFailed : messages.saveFailed),
    );
  }

  return (await response.json().catch(() => ({}))) as SaveSeichiMapVisitResult<
    TItem,
    TUnlocked
  >;
}

export async function deleteSeichiMapVisit(
  id: string,
  failedMessage: string,
): Promise<void> {
  const response = await fetch(
    `/api/seichi-map/visited?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || failedMessage);
  }
}
