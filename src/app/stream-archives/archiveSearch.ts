const HIRAGANA_TO_KATAKANA_OFFSET = 0x60;

export const normalizeArchiveSearchContent = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) + HIRAGANA_TO_KATAKANA_OFFSET),
    );

export const normalizeArchiveSearchText = (value: string) =>
  normalizeArchiveSearchContent(value).trim();

export const normalizeArchiveSeriesKey = (value: string) =>
  normalizeArchiveSearchText(value).replace(/[\s\-_.,，、:：!！?？#＃]/g, "");

const getOriginalIndexForNormalizedOffset = (
  value: string,
  normalizedOffset: number,
) => {
  if (normalizedOffset <= 0) {
    return 0;
  }

  for (let index = 1; index <= value.length; index += 1) {
    if (
      normalizeArchiveSearchContent(value.slice(0, index)).length >=
      normalizedOffset
    ) {
      return index;
    }
  }

  return value.length;
};

export const findArchiveSearchHighlightRange = (
  value: string,
  query: string,
) => {
  const normalizedQuery = normalizeArchiveSearchText(query);

  if (!normalizedQuery) {
    return null;
  }

  const normalizedValue = normalizeArchiveSearchContent(value);
  const normalizedStart = normalizedValue.indexOf(normalizedQuery);

  if (normalizedStart === -1) {
    return null;
  }

  const normalizedEnd = normalizedStart + normalizedQuery.length;

  return {
    start: getOriginalIndexForNormalizedOffset(value, normalizedStart),
    end: getOriginalIndexForNormalizedOffset(value, normalizedEnd),
  };
};
