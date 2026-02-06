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
