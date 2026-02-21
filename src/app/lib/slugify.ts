export default function slugify(s: string): string {
  if (!s) return "";
  return (
    s
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      // 許可文字以外を削除（Unicode の文字と数字、スペース、ハイフンを許可）
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

// 日本語や組み合わせからユニークな英数字を生成する
export function slugifyV2(s: string): string {
  if (!s) return "";
  const slug = slugify(s);
  // 非 ASCII（a-z0-9- 以外）の文字を base36 で置換して英数字のみの slug を生成
  const asciiSlug = Array.from(slug)
    .map((ch) => {
      if (/[a-z0-9-]/.test(ch)) return ch;
      return ch.charCodeAt(0).toString(36);
    })
    .join("");

  const hash = Array.from(slug).reduce((hash, char) => {
    hash = (hash * 31 + char.charCodeAt(0)) % 1e9;
    return hash;
  }, 7);

  return asciiSlug ? `${asciiSlug}-${hash.toString(36)}` : hash.toString(36);
}
