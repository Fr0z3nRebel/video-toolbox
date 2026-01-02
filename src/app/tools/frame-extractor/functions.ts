import { ProcessedFile } from "../../components/ProcessedFilesDisplay";

export interface FrameExtractionOptions {
  position: "first" | "last";
  format: "png" | "jpeg";
  quality: number; // 0.0 to 1.0
}

/**
 * Extract a frame from a video at a specific position (first or last)
 */
export const extractFrameFromVideo = (
  file: File,
  options: FrameExtractionOptions
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
    video.preload = "metadata";
    video.muted = true; // Required for autoplay policies
    video.playsInline = true;

    // Handle metadata loaded - we need duration
    video.onloadedmetadata = () => {
      // Determine seek time based on position
      let seekTime: number;
      if (options.position === "first") {
        // Small offset to avoid potential black frame at 0
        seekTime = 0.01;
      } else {
        // For last frame, seek to slightly before the end
        // Using duration - 0.1 to avoid potential issues at exact end
        seekTime = Math.max(0, video.duration - 0.1);
      }

      // Seek to the target time
      video.currentTime = seekTime;
    };

    // Handle seek complete - now we can draw the frame
    video.onseeked = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to desired format
      const mimeType = options.format === "png" ? "image/png" : "image/jpeg";
      const extension = options.format;

      canvas.toBlob(
        (blob) => {
          // Clean up video source
          URL.revokeObjectURL(video.src);

          if (!blob) {
            reject(new Error("Failed to create image from video frame"));
            return;
          }

          // Generate filename
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const positionSuffix =
            options.position === "last" ? "last-frame" : "first-frame";
          const fileName = `${baseName}_${positionSuffix}.${extension}`;
          const url = URL.createObjectURL(blob);

          resolve({
            name: fileName,
            url: url,
            blob: blob,
            originalSize: file.size,
            processedSize: blob.size,
          });
        },
        mimeType,
        options.quality
      );
    };

    // Handle errors
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(
        new Error(
          `Failed to load video: ${file.name}. Format may not be supported by your browser.`
        )
      );
    };

    // Start loading the video
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Process multiple video files and extract frames from each
 */
export const extractFrames = async (
  files: File[],
  options: FrameExtractionOptions,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedFile[]> => {
  const extracted: ProcessedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);

    try {
      const result = await extractFrameFromVideo(file, options);
      extracted.push(result);
    } catch (error) {
      console.error(`Failed to extract frame from ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }

  return extracted;
};

/**
 * Get original file for comparison (reusable pattern)
 */
export const getOriginalFileForComparison = <T extends File>(
  index: number,
  originalFiles: T[],
  processedFiles: ProcessedFile[]
): T | null => {
  if (
    index >= 0 &&
    index < originalFiles.length &&
    index < processedFiles.length
  ) {
    return originalFiles[index];
  }
  return null;
};
