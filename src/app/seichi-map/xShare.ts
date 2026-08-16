export const buildDokoAzPostText = (locationName: string) =>
  `${locationName}をGUESS！\n#どこAZ`;

export const buildDokoAzPostUrl = (locationName: string) => {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", buildDokoAzPostText(locationName));
  return url.toString();
};
