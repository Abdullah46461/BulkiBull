import { PHOTO_DATA_URL_MAX_LENGTH } from '@bulki-bull/shared';

const FANDOM_IMAGE_HOST = 'static.wikia.nocookie.net';

const PHOTO_COMPRESSION_STEPS = [
  { maxDimension: 1280, quality: 0.82 },
  { maxDimension: 1024, quality: 0.76 },
  { maxDimension: 960, quality: 0.72 },
  { maxDimension: 840, quality: 0.68 },
  { maxDimension: 720, quality: 0.64 },
] as const;

const needsOriginalFormat = (url: URL): boolean =>
  url.hostname === FANDOM_IMAGE_HOST &&
  url.pathname.includes('/revision/') &&
  !url.searchParams.has('format');

const isDataPhotoUrl = (photoUrl: string): boolean => photoUrl.startsWith('data:image/');

const getScaledDimensions = (
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } => {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось обработать выбранное фото.'));
    image.src = src;
  });

const renderAsJpegDataUrl = (
  image: HTMLImageElement,
  maxDimension: number,
  quality: number,
): string => {
  const { width, height } = getScaledDimensions(
    image.naturalWidth,
    image.naturalHeight,
    maxDimension,
  );
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Не удалось подготовить фото для сохранения.');
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
};

export const photoSourceToDataUrl = async (sourceUrl: string): Promise<string> => {
  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error('Не удалось прочитать выбранное фото.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);

    for (const step of PHOTO_COMPRESSION_STEPS) {
      const dataUrl = renderAsJpegDataUrl(image, step.maxDimension, step.quality);

      if (dataUrl.length <= PHOTO_DATA_URL_MAX_LENGTH) {
        return dataUrl;
      }
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  throw new Error('Фото слишком большое даже после сжатия. Выберите другое изображение.');
};

export const normalizePhotoUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) {
    return undefined;
  }

  if (isDataPhotoUrl(photoUrl)) {
    return photoUrl;
  }

  try {
    const url = new URL(photoUrl);

    // Wikia/Fandom may auto-negotiate WebP here; requesting the original asset
    // keeps the simulator on a more predictable image format.
    if (needsOriginalFormat(url)) {
      url.searchParams.set('format', 'original');
    }

    return url.toString();
  } catch {
    return photoUrl;
  }
};
