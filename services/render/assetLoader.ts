import { VisualizerSettings } from "../../types";
import { GifController } from "../../utils/gifUtils";

export const loadAssets = async (
  visualizerSettings: VisualizerSettings
): Promise<{
  bgBitmap: ImageBitmap | null;
  logoBitmap: ImageBitmap | null;
  stickerBitmap: ImageBitmap | null;
  gifController: GifController;
  bgGifController: GifController;
}> => {
  const loadImage = async (url: string | null): Promise<ImageBitmap | null> => {
    if (!url) return null;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      return await createImageBitmap(img);
    } catch (e) {
      console.warn(`Failed to load image asset: ${url}`, e);
      return null;
    }
  };

  const [logoBitmap, stickerBitmapRaw] = await Promise.all([
    loadImage(visualizerSettings.logoImage),
    visualizerSettings.stickerImage
      ? fetch(visualizerSettings.stickerImage)
          .then((r) => r.blob())
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const bgGifController = new GifController();
  let bgBitmap: ImageBitmap | null = null;
  
  if (visualizerSettings.backgroundImage) {
    try {
      await bgGifController.load(visualizerSettings.backgroundImage);
      if (!bgGifController.isLoaded) {
        bgBitmap = await loadImage(visualizerSettings.backgroundImage);
      }
    } catch (e) {
      bgBitmap = await loadImage(visualizerSettings.backgroundImage);
    }
  }

  const gifController = new GifController();
  let stickerBitmap: ImageBitmap | null = null;

  if (visualizerSettings.stickerImage && stickerBitmapRaw) {
    try {
      await gifController.load(visualizerSettings.stickerImage);
      if (!gifController.isLoaded) {
        stickerBitmap = await createImageBitmap(stickerBitmapRaw);
      }
    } catch (e) {}
  }

  return { bgBitmap, logoBitmap, stickerBitmap, gifController, bgGifController };
};
