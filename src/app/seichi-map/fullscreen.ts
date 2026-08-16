type FullscreenDocument = Pick<Document, "fullscreenElement">;

type FullscreenController = Pick<
  Document,
  "exitFullscreen" | "fullscreenElement"
>;

export const toggleElementFullscreen = async (
  element: HTMLElement,
  fullscreenDocument: FullscreenController = document,
) => {
  if (fullscreenDocument.fullscreenElement === element) {
    await fullscreenDocument.exitFullscreen();
    return;
  }

  await element.requestFullscreen();
};

export const getGoogleMapFullscreenPortalTarget = (
  mapElement: HTMLElement | null,
  fullscreenDocument: FullscreenDocument = document,
) => {
  const fullscreenElement = fullscreenDocument.fullscreenElement;
  if (
    fullscreenElement instanceof HTMLElement &&
    mapElement &&
    (fullscreenElement.contains(mapElement) ||
      mapElement.contains(fullscreenElement))
  ) {
    return fullscreenElement;
  }

  const fullscreenControl = mapElement?.querySelector(
    '.gm-fullscreen-control[aria-pressed="true"]',
  );
  if (!fullscreenControl) return null;

  return (
    mapElement?.querySelector<HTMLElement>(".gm-style")?.parentElement ?? null
  );
};
