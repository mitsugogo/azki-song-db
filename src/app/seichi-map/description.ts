const timestampPattern = /(?:^|\s)\d{1,2}:\d{2}(?::\d{2})?(?:[ \t]*[~〜～]+)?/;

export function removeYouTubeLinksFromDescription(
  value: string,
  youtubeUrls: readonly string[],
) {
  return value
    .split(/\r?\n/)
    .map((line) => {
      let nextLine = line;
      let removedYouTubeLink = false;
      for (const url of youtubeUrls) {
        if (!nextLine.includes(url)) continue;
        nextLine = nextLine.replace(url, "").replace(timestampPattern, "");
        removedYouTubeLink = true;
      }
      if (removedYouTubeLink && /^[~〜～\s]*$/.test(nextLine)) return "";
      return nextLine.trim();
    })
    .filter((line) => line.length > 0)
    .join("\n");
}
