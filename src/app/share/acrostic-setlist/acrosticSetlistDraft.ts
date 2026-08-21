export const ACROSTIC_SETLIST_DRAFT_KEY = "azki-song-db:acrostic-setlist:v1";

export type AcrosticSetlistDraft = {
  version: 1;
  input: string;
  generatedInput: string | null;
  allowReuse: boolean;
  selectedCandidateKeys: (string | null)[];
};

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

export const parseAcrosticSetlistDraft = (
  raw: string | null,
): AcrosticSetlistDraft | null => {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<AcrosticSetlistDraft>;
    if (
      value.version !== 1 ||
      typeof value.input !== "string" ||
      !isNullableString(value.generatedInput) ||
      typeof value.allowReuse !== "boolean" ||
      !Array.isArray(value.selectedCandidateKeys) ||
      !value.selectedCandidateKeys.every(isNullableString)
    ) {
      return null;
    }

    return {
      version: 1,
      input: value.input,
      generatedInput: value.generatedInput,
      allowReuse: value.allowReuse,
      selectedCandidateKeys: value.selectedCandidateKeys.slice(0, 50),
    };
  } catch {
    return null;
  }
};

export const readAcrosticSetlistDraft = (): AcrosticSetlistDraft | null => {
  try {
    return parseAcrosticSetlistDraft(
      window.sessionStorage.getItem(ACROSTIC_SETLIST_DRAFT_KEY),
    );
  } catch {
    return null;
  }
};

export const writeAcrosticSetlistDraft = (draft: AcrosticSetlistDraft) => {
  try {
    window.sessionStorage.setItem(
      ACROSTIC_SETLIST_DRAFT_KEY,
      JSON.stringify(draft),
    );
  } catch {
    // sessionStorage may be unavailable in private browsing contexts.
  }
};
