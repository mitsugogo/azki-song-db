const ISO_DURATION_PATTERN =
  /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

export const parseVideoDurationSeconds = (value: string) => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const isoMatch = normalized.match(ISO_DURATION_PATTERN);
  if (isoMatch) {
    const hours = Number(isoMatch[1] ?? 0);
    const minutes = Number(isoMatch[2] ?? 0);
    const seconds = Number(isoMatch[3] ?? 0);
    const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds;

    return totalSeconds > 0 ? totalSeconds : null;
  }

  const timeParts = normalized.split(":");
  if (timeParts.length < 2 || timeParts.length > 3) {
    return null;
  }

  if (!timeParts.every((part) => /^\d+$/.test(part))) {
    return null;
  }

  const numbers = timeParts.map(Number);
  const [hours, minutes, seconds] =
    numbers.length === 3 ? numbers : [0, numbers[0], numbers[1]];

  if (minutes >= 60 || seconds >= 60) {
    return null;
  }

  const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
};
