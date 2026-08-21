import { describe, expect, it } from "vitest";
import { parseAcrosticSetlistDraft } from "../acrosticSetlistDraft";

describe("parseAcrosticSetlistDraft", () => {
  it("version 1のドラフトだけを復元する", () => {
    expect(
      parseAcrosticSetlistDraft(
        JSON.stringify({
          version: 1,
          input: "あずき",
          generatedInput: "あずき",
          allowReuse: false,
          selectedCandidateKeys: ["a", null, "c"],
        }),
      ),
    ).toEqual({
      version: 1,
      input: "あずき",
      generatedInput: "あずき",
      allowReuse: false,
      selectedCandidateKeys: ["a", null, "c"],
    });
  });

  it("破損データや未知のバージョンを無視する", () => {
    expect(parseAcrosticSetlistDraft("{")).toBeNull();
    expect(
      parseAcrosticSetlistDraft(
        JSON.stringify({
          version: 2,
          input: "あずき",
          generatedInput: null,
          allowReuse: false,
          selectedCandidateKeys: [],
        }),
      ),
    ).toBeNull();
  });
});
