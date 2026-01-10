import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ProcessedFile } from "../../components/ProcessedFilesDisplay";

export type AudioFormat = "mp3" | "wav";
export type AudioQuality = "low" | "medium" | "high";

export interface AudioExtractionOptions {
  format: AudioFormat;
  quality: AudioQuality;
}

export interface AudioExtractionProgress {
  stage: "loading" | "extracting" | "encoding" | "complete";
  progress: number; // 0-100
  message?: string;
}

/**
 * Get video metadata (duration)
 */
export const getVideoMetadata = (
  file: File
): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
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
// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading = false;
let ffmpegLoadPromise: Promise<void> | null = null;

/**
 * Get or initialize FFmpeg instance using static imports
 */
const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (ffmpegLoading && ffmpegLoadPromise) {
    await ffmpegLoadPromise;
    return ffmpegInstance!;
  }

  ffmpegLoading = true;
  ffmpegLoadPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();
      
      // Check for SharedArrayBuffer support (required for FFmpeg.wasm)
      if (typeof SharedArrayBuffer === "undefined") {
        throw new Error(
          "SharedArrayBuffer is not available. Please ensure you're accessing the site via localhost (not IP address) and that the server has Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers set."
        );
      }

      // Load FFmpeg core using static string literals (required for Turbopack)
      // Use UMD build and completely static string literals - no concatenation
      // Turbopack cannot analyze dynamic paths, so we must use full string literals
      await ffmpeg.load({
        coreURL: await toBlobURL(
          "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
          "application/wasm"
        ),
      });

      ffmpegInstance = ffmpeg;
      ffmpegLoading = false;
    } catch (loadError) {
      ffmpegLoading = false;
      ffmpegLoadPromise = null;
      console.error("FFmpeg load error:", loadError);
      throw new Error(
        `Failed to load FFmpeg: ${loadError instanceof Error ? loadError.message : String(loadError)}`
      );
    }
  })();

  await ffmpegLoadPromise;
  return ffmpegInstance!;
};

/**
 * Extract audio from a video file using FFmpeg.wasm
 */
export const extractAudioFromVideo = async (
  file: File,
  options: AudioExtractionOptions,
  onProgress?: (progress: AudioExtractionProgress) => void
): Promise<ProcessedFile> => {
  try {
    onProgress?.({
      stage: "loading",
      progress: 0,
      message: "Initializing FFmpeg...",
    });

    // Get or initialize FFmpeg instance
    const ffmpeg = await getFFmpeg();

    onProgress?.({
      stage: "loading",
      progress: 20,
      message: "Loading video file...",
    });

    // Write input file to FFmpeg's virtual filesystem
    const inputFileName = "input." + (file.name.split(".").pop() || "mp4");
    const outputFileName = `output.${options.format}`;
    
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    onProgress?.({
      stage: "extracting",
      progress: 40,
      message: "Extracting audio...",
    });

    // Set up progress monitoring
    ffmpeg.on("progress", ({ progress: ffmpegProgress }) => {
      const progressValue = 40 + Math.floor(ffmpegProgress * 0.5); // 40-90%
      onProgress?.({
        stage: "extracting",
        progress: progressValue,
        message: `Extracting audio... ${Math.floor(ffmpegProgress * 100)}%`,
      });
    });

    // Set up logging to capture FFmpeg output
    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg:", message);
    });

    // Build FFmpeg command based on format and quality
    const args: string[] = ["-i", inputFileName];

    if (options.format === "mp3") {
      // MP3 encoding with quality settings
      const bitrate = options.quality === "low" ? "128k" : options.quality === "medium" ? "192k" : "320k";
      args.push(
        "-vn", // No video
        "-acodec", "libmp3lame", // MP3 codec
        "-b:a", bitrate, // Audio bitrate
        "-y" // Overwrite output file
      );
    } else {
      // WAV encoding (uncompressed)
      args.push(
        "-vn", // No video
        "-acodec", "pcm_s16le", // PCM 16-bit little-endian
        "-y" // Overwrite output file
      );
    }

    args.push(outputFileName);

    // Run FFmpeg command
    try {
      await ffmpeg.exec(args);
    } catch (execError) {
      console.error("FFmpeg exec error:", execError);
      throw new Error(
        `FFmpeg failed: ${execError instanceof Error ? execError.message : String(execError)}`
      );
    }

    onProgress?.({
      stage: "encoding",
      progress: 90,
      message: "Finalizing...",
    });

    // Read output file from FFmpeg's virtual filesystem
    const data = await ffmpeg.readFile(outputFileName);
    // Convert FileData to Blob - handle different data types
    const dataAny = data as unknown;
    let blob: Blob;
    
    if (dataAny instanceof Uint8Array) {
      // Create a new Uint8Array with a proper ArrayBuffer
      const buffer = new ArrayBuffer(dataAny.length);
      const view = new Uint8Array(buffer);
      view.set(dataAny);
      blob = new Blob([buffer], {
        type: options.format === "mp3" ? "audio/mpeg" : "audio/wav",
      });
    } else if (dataAny instanceof ArrayBuffer) {
      blob = new Blob([dataAny], {
        type: options.format === "mp3" ? "audio/mpeg" : "audio/wav",
      });
    } else {
      // Fallback: convert to Uint8Array first
      const uint8Array = new Uint8Array(dataAny as ArrayLike<number>);
      const buffer = new ArrayBuffer(uint8Array.length);
      const view = new Uint8Array(buffer);
      view.set(uint8Array);
      blob = new Blob([buffer], {
        type: options.format === "mp3" ? "audio/mpeg" : "audio/wav",
      });
    }

    // Clean up files from FFmpeg's virtual filesystem
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    // Generate filename
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const extension = options.format;
    const fileName = `${baseName}.${extension}`;
    const url = URL.createObjectURL(blob);

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Extraction complete!",
    });

    return {
      name: fileName,
      url: url,
      blob: blob,
      originalSize: file.size,
      processedSize: blob.size,
    };
  } catch (error) {
    console.error("Audio extraction error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Failed to extract audio from video";
    throw new Error(errorMessage);
  }
};
