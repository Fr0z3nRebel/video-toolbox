import GIF from "gif.js";
import { ProcessedFile } from "../../components/ProcessedFilesDisplay";

export type DitheringAlgorithm =
  | "FloydSteinberg"
  | "FalseFloydSteinberg"
  | "Stucki"
  | "Atkinson"
  | false;

export interface GifConversionOptions {
  fps: number; // 1-30, default: 10
  quality: number; // 1 (best) to 20 (worst), default: 10
  scale: number; // 0.1-1.0, default: 0.5
  startTime: number; // seconds, default: 0
  maxDuration: number; // seconds, default: 10
  dithering: DitheringAlgorithm; // Dithering algorithm
  loop: number; // 0 = infinite, -1 = no loop
  workers: number; // 2-8, default: 4
}

export interface ConversionProgress {
  stage: "loading" | "extracting" | "encoding" | "complete";
  progress: number; // 0-100
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
}

export interface GifPreset {
  name: string;
  description: string;
  options: Partial<GifConversionOptions>;
}

export const GIF_PRESETS: GifPreset[] = [
  {
    name: "Quick Preview",
    description: "Fast, smaller file size",
    options: { fps: 8, quality: 15, scale: 0.3 },
  },
  {
    name: "Balanced",
    description: "Good quality, reasonable size",
    options: { fps: 10, quality: 10, scale: 0.5 },
  },
  {
    name: "High Quality",
    description: "Best quality, larger file",
    options: { fps: 15, quality: 5, scale: 0.75 },
  },
];

export const DEFAULT_OPTIONS: GifConversionOptions = {
  fps: 10,
  quality: 10,
  scale: 0.5,
  startTime: 0,
  maxDuration: 10,
  dithering: "FloydSteinberg",
  loop: 0,
  workers: 4,
};

/**
 * Get video metadata (duration, dimensions)
 */
export const getVideoMetadata = (
  file: File
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Failed to load video metadata: ${file.name}`));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate output dimensions based on options
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  scale: number
): { width: number; height: number } => {
  let width = Math.round(originalWidth * scale);
  let height = Math.round(originalHeight * scale);

  // Ensure minimum dimensions
  width = Math.max(width, 10);
  height = Math.max(height, 10);

  // Ensure even dimensions (required by some encoders)
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;

  return { width, height };
};

/**
 * Seek video to specific time
 */
const seekToTime = (video: HTMLVideoElement, time: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Seek timeout"));
    }, 5000);

    const handleSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener("seeked", handleSeeked);
      resolve();
    };

    video.addEventListener("seeked", handleSeeked);
    video.currentTime = time;
  });
};

/**
 * Convert a video file to an animated GIF
 */
export const convertVideoToGif = (
  file: File,
  options: GifConversionOptions,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ProcessedFile> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    // Set up video element
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        onProgress?.({
          stage: "loading",
          progress: 100,
          message: "Video loaded",
        });

        // Calculate dimensions
        const { width, height } = calculateDimensions(
          video.videoWidth,
          video.videoHeight,
          options.scale
        );
        canvas.width = width;
        canvas.height = height;

        // Calculate timing
        const startTime = options.startTime || 0;
        const maxEndTime = video.duration;
        const endTime = Math.min(startTime + options.maxDuration, maxEndTime);
        const duration = endTime - startTime;
        const frameInterval = 1 / options.fps;
        const totalFrames = Math.max(1, Math.floor(duration * options.fps));

        // Initialize GIF encoder
        const gif = new GIF({
          workers: options.workers,
          quality: options.quality,
          width: width,
          height: height,
          workerScript: "/gif.worker.js",
          dither: options.dithering,
          repeat: options.loop,
        });

        // Extract and add frames
        onProgress?.({
          stage: "extracting",
          progress: 0,
          currentFrame: 0,
          totalFrames,
          message: "Extracting frames...",
        });

        for (let i = 0; i < totalFrames; i++) {
          const time = startTime + i * frameInterval;

          // Clamp time to video duration
          const seekTime = Math.min(time, video.duration - 0.01);
          await seekToTime(video, seekTime);

          ctx.drawImage(video, 0, 0, width, height);

          gif.addFrame(ctx, {
            copy: true,
            delay: Math.round(frameInterval * 1000), // Convert to ms
          });

          onProgress?.({
            stage: "extracting",
            progress: Math.round(((i + 1) / totalFrames) * 100),
            currentFrame: i + 1,
            totalFrames,
            message: `Extracting frame ${i + 1} of ${totalFrames}`,
          });
        }

        // Encode GIF
        onProgress?.({
          stage: "encoding",
          progress: 0,
          message: "Encoding GIF...",
        });

        gif.on("progress", (p: number) => {
          onProgress?.({
            stage: "encoding",
            progress: Math.round(p * 100),
            message: `Encoding: ${Math.round(p * 100)}%`,
          });
        });

        gif.on("finished", (blob: Blob) => {
          URL.revokeObjectURL(video.src);

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const fileName = `${baseName}.gif`;
          const url = URL.createObjectURL(blob);

          onProgress?.({
            stage: "complete",
            progress: 100,
            message: "Conversion complete!",
          });

          resolve({
            name: fileName,
            url: url,
            blob: blob,
            originalSize: file.size,
            processedSize: blob.size,
          });
        });

        gif.render();
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(
        new Error(
          `Failed to load video: ${file.name}. Format may not be supported by your browser.`
        )
      );
    };

    onProgress?.({ stage: "loading", progress: 0, message: "Loading video..." });
    video.src = URL.createObjectURL(file);
  });
};
