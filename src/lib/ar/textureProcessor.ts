/**
 * FitVision Volumetric AR Engine — Texture Processing & Asset Isolation Pipeline
 * 
 * Implements:
 * 1. Offscreen HTML5 Canvas 512px downscaling safeguard
 * 2. Client-side background removal via @imgly/background-removal
 * 3. In-memory texture and blob caching
 * 4. Resilient local fallback cutouts (/assets/tshirt.png, /assets/hoodie.png, /assets/sunglasses.png)
 * 5. Automatic smart chroma/luminance alpha mask fallback for zero-stalls
 */

import * as THREE from "three";

export interface ProcessedTextureResult {
  texture: THREE.Texture;
  url: string;
  isTransparentCutout: boolean;
  fromCache: boolean;
}

// In-Memory Texture Cache
const textureCache = new Map<string, ProcessedTextureResult>();

// Hardcoded Local Fallback Asset Map
export const FALLBACK_ASSETS = {
  TSHIRT: "/assets/tshirt.png",
  HOODIE: "/assets/hoodie.png",
  SUNGLASSES: "/assets/sunglasses.png",
} as const;

/**
 * Returns matching fallback asset based on product name and category
 */
export function getFallbackAsset(name: string, category: string): string {
  const lowerName = name.toLowerCase();
  if (category === "headwear" || lowerName.includes("glass") || lowerName.includes("aviator")) {
    return FALLBACK_ASSETS.SUNGLASSES;
  }
  if (lowerName.includes("hoodie") || lowerName.includes("jacket") || lowerName.includes("coat")) {
    return FALLBACK_ASSETS.HOODIE;
  }
  return FALLBACK_ASSETS.TSHIRT;
}

/**
 * Loads an HTMLImageElement with crossOrigin = 'anonymous'
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image at ${url}: ${err}`));
    img.src = url;
  });
}

/**
 * Performance safeguard: Pre-downscale raw catalog JPEGs via an offscreen HTML5 Canvas
 * to a maximum dimension of 512px before running segmentation.
 */
export async function downscaleToOffscreenCanvas(
  source: HTMLImageElement | string,
  maxDimension = 512
): Promise<HTMLCanvasElement> {
  const img = typeof source === "string" ? await loadImageElement(source) : source;

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxDimension || originalHeight > maxDimension) {
    if (originalWidth >= originalHeight) {
      targetWidth = maxDimension;
      targetHeight = Math.round((originalHeight / originalWidth) * maxDimension);
    } else {
      targetHeight = maxDimension;
      targetWidth = Math.round((originalWidth / originalHeight) * maxDimension);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not acquire 2D canvas context");

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  return canvas;
}

/**
 * Fast client-side smart canvas background remover (luminance/white knockout fallback)
 * Used when WASM/ONNX models take too long or are blocked
 */
export function applyCanvasLuminanceCutout(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Inspect border corners to sample background color
  const sampleR = (data[0] + data[(canvas.width - 1) * 4]) / 2;
  const sampleG = (data[1] + data[(canvas.width - 1) * 4 + 1]) / 2;
  const sampleB = (data[2] + data[(canvas.width - 1) * 4 + 2]) / 2;

  const isLightBg = (sampleR + sampleG + sampleB) / 3 > 200;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isLightBg) {
      // White/light studio background removal
      if (r > 225 && g > 225 && b > 225) {
        data[i + 3] = 0;
      } else if (r > 205 && g > 205 && b > 205) {
        const factor = (255 - Math.max(r, g, b)) / 50;
        data[i + 3] = Math.round(data[i + 3] * Math.max(0, factor));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Creates a Three.js Texture from an Image, Canvas, or URL with sRGB color space
 */
export function createThreeTexture(
  source: HTMLCanvasElement | HTMLImageElement
): THREE.Texture {
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Main Asset Isolation Pipeline
 * Processes a catalog image URL into a transparent Three.js texture with fallback resilience
 */
export async function processGarmentTexture(
  imageUrl: string,
  productName: string,
  category: "top" | "bottom" | "headwear",
  options?: {
    useSegmentation?: boolean;
    timeoutMs?: number;
  }
): Promise<ProcessedTextureResult> {
  // 1. Check in-memory cache
  if (textureCache.has(imageUrl)) {
    const cached = textureCache.get(imageUrl)!;
    return { ...cached, fromCache: true };
  }

  const useSegmentation = options?.useSegmentation ?? true;
  const timeoutMs = options?.timeoutMs ?? 12000;

  try {
    // 2. Pre-downscale raw image via HTML5 Canvas (max 512px)
    const downscaledCanvas = await downscaleToOffscreenCanvas(imageUrl, 512);

    let finalCanvas = downscaledCanvas;
    let isCutout = false;
    let finalUrl = imageUrl;

    if (useSegmentation) {
      try {
        // Dynamically import @imgly/background-removal to allow client-only execution
        const { removeBackground } = await import("@imgly/background-removal");

        // Segmentation with timeout race to guarantee 0 stall
        const segmentationPromise = removeBackground(downscaledCanvas, {
          output: { format: "image/png", quality: 0.9 },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Background removal timed out")), timeoutMs)
        );

        const resultBlob = await Promise.race([segmentationPromise, timeoutPromise]);
        finalUrl = URL.createObjectURL(resultBlob);

        const cutoutImg = await loadImageElement(finalUrl);
        const cutoutCanvas = document.createElement("canvas");
        cutoutCanvas.width = cutoutImg.width;
        cutoutCanvas.height = cutoutImg.height;
        const cCtx = cutoutCanvas.getContext("2d");
        if (cCtx) {
          cCtx.drawImage(cutoutImg, 0, 0);
          finalCanvas = cutoutCanvas;
          isCutout = true;
        }
      } catch (segErr) {
        console.warn(
          "[FitVision AR] @imgly segmentation fallback triggered. Applying canvas luminance matte:",
          segErr
        );
        finalCanvas = applyCanvasLuminanceCutout(downscaledCanvas);
        finalUrl = finalCanvas.toDataURL("image/png");
        isCutout = true;
      }
    } else {
      finalCanvas = applyCanvasLuminanceCutout(downscaledCanvas);
      finalUrl = finalCanvas.toDataURL("image/png");
      isCutout = true;
    }

    const texture = createThreeTexture(finalCanvas);
    const result: ProcessedTextureResult = {
      texture,
      url: finalUrl,
      isTransparentCutout: isCutout,
      fromCache: false,
    };

    textureCache.set(imageUrl, result);
    return result;
  } catch (globalErr) {
    console.error(
      `[FitVision AR] Pipeline failed for ${productName}. Falling back to hardcoded asset:`,
      globalErr
    );

    // 3. Fallback to hardcoded local transparent cutout asset
    const fallbackPath = getFallbackAsset(productName, category);
    try {
      const fallbackImg = await loadImageElement(fallbackPath);
      const canvas = document.createElement("canvas");
      canvas.width = fallbackImg.width;
      canvas.height = fallbackImg.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(fallbackImg, 0, 0);

      const texture = createThreeTexture(canvas);
      const fallbackResult: ProcessedTextureResult = {
        texture,
        url: fallbackPath,
        isTransparentCutout: true,
        fromCache: false,
      };
      textureCache.set(imageUrl, fallbackResult);
      return fallbackResult;
    } catch (fallbackErr) {
      // In case even fallback loading fails, create a procedural colored polygon canvas
      const proceduralCanvas = document.createElement("canvas");
      proceduralCanvas.width = 512;
      proceduralCanvas.height = 512;
      const pCtx = proceduralCanvas.getContext("2d");
      if (pCtx) {
        pCtx.fillStyle = "#2563EB";
        pCtx.fillRect(100, 100, 312, 312);
      }
      const texture = createThreeTexture(proceduralCanvas);
      return {
        texture,
        url: "",
        isTransparentCutout: false,
        fromCache: false,
      };
    }
  }
}

/**
 * Preloads fallback assets into cache
 */
export async function preloadFallbackAssets(): Promise<void> {
  try {
    await Promise.all([
      processGarmentTexture(FALLBACK_ASSETS.TSHIRT, "T-Shirt", "top", { useSegmentation: false }),
      processGarmentTexture(FALLBACK_ASSETS.HOODIE, "Hoodie", "top", { useSegmentation: false }),
      processGarmentTexture(FALLBACK_ASSETS.SUNGLASSES, "Sunglasses", "headwear", { useSegmentation: false }),
    ]);
  } catch {
    // Non-fatal preloading
  }
}
