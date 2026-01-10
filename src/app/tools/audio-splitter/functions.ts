import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ProcessedFile } from "../../components/ProcessedFilesDisplay";

export interface AudioSplitProgress {
  stage: "loading" | "splitting" | "complete";
  progress: number; // 0-100
  message?: string;
  currentSegment?: number;
  totalSegments?: number;
}

/**
 * Get audio metadata (duration)
 */
export const getAudioMetadata = (
  file: File
): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.muted = true;

    audio.onloadedmetadata = () => {
      resolve({
        duration: audio.duration,
      });
      URL.revokeObjectURL(audio.src);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error(`Failed to load audio metadata: ${file.name}`));
    };

    audio.src = URL.createObjectURL(file);
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
 * Split audio file into segments of specified length
 */
export const splitAudio = async (
  file: File,
  segmentLength: number,
  onProgress?: (progress: AudioSplitProgress) => void
): Promise<ProcessedFile[]> => {
  try {
    onProgress?.({
      stage: "loading",
      progress: 0,
      message: "Initializing FFmpeg...",
    });

    // Get audio duration
    const metadata = await getAudioMetadata(file);
    const duration = metadata.duration;

    if (segmentLength <= 0) {
      throw new Error("Segment length must be greater than 0");
    }

    if (segmentLength > duration) {
      throw new Error("Segment length cannot be greater than audio duration");
    }

    // Calculate number of segments
    const totalSegments = Math.ceil(duration / segmentLength);

    // Get or initialize FFmpeg instance
    const ffmpeg = await getFFmpeg();

    onProgress?.({
      stage: "loading",
      progress: 10,
      message: "Loading audio file...",
    });

    // Write input file to FFmpeg's virtual filesystem
    const inputFileName = "input." + (file.name.split(".").pop() || "mp3");
    const fileExtension = file.name.split(".").pop() || "mp3";
    
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    onProgress?.({
      stage: "splitting",
      progress: 20,
      message: "Splitting audio into segments...",
      currentSegment: 0,
      totalSegments,
    });

    // Set up logging to capture FFmpeg output
    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg:", message);
    });

    const processedFiles: ProcessedFile[] = [];
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    // Process each segment
    for (let i = 0; i < totalSegments; i++) {
      const startTime = i * segmentLength;
      const outputFileName = `output-segment-${String(i + 1).padStart(3, "0")}.${fileExtension}`;

      onProgress?.({
        stage: "splitting",
        progress: 20 + Math.floor((i / totalSegments) * 70),
        message: `Processing segment ${i + 1} of ${totalSegments}...`,
        currentSegment: i + 1,
        totalSegments,
      });

      // Build FFmpeg command for this segment
      // Use -acodec copy to avoid re-encoding (faster)
      const args: string[] = [
        "-i", inputFileName,
        "-ss", startTime.toString(),
        "-t", segmentLength.toString(),
        "-acodec", "copy", // Copy codec to avoid re-encoding
        "-y", // Overwrite output file
        outputFileName,
      ];

      // Run FFmpeg command for this segment
      try {
        await ffmpeg.exec(args);
      } catch (execError) {
        console.error(`FFmpeg exec error for segment ${i + 1}:`, execError);
        throw new Error(
          `FFmpeg failed for segment ${i + 1}: ${execError instanceof Error ? execError.message : String(execError)}`
        );
      }

      // Read output file from FFmpeg's virtual filesystem
      const data = await ffmpeg.readFile(outputFileName);
      
      // Convert FileData to Blob - handle different data types
      const dataAny = data as unknown;
      let blob: Blob;
      
      // Determine MIME type based on extension
      const mimeType = fileExtension === "mp3" 
        ? "audio/mpeg" 
        : fileExtension === "wav" 
        ? "audio/wav" 
        : "audio/mpeg";
      
      if (dataAny instanceof Uint8Array) {
        // Create a new Uint8Array with a proper ArrayBuffer
        const buffer = new ArrayBuffer(dataAny.length);
        const view = new Uint8Array(buffer);
        view.set(dataAny);
        blob = new Blob([buffer], { type: mimeType });
      } else if (dataAny instanceof ArrayBuffer) {
        blob = new Blob([dataAny], { type: mimeType });
      } else {
        // Fallback: convert to Uint8Array first
        const uint8Array = new Uint8Array(dataAny as ArrayLike<number>);
        const buffer = new ArrayBuffer(uint8Array.length);
        const view = new Uint8Array(buffer);
        view.set(uint8Array);
        blob = new Blob([buffer], { type: mimeType });
      }

      // Generate filename
      const segmentFileName = `${baseName}-segment-${String(i + 1).padStart(3, "0")}.${fileExtension}`;
      const url = URL.createObjectURL(blob);

      processedFiles.push({
        name: segmentFileName,
        url: url,
        blob: blob,
        originalSize: file.size,
        processedSize: blob.size,
      });

      // Clean up segment file from FFmpeg's virtual filesystem
      await ffmpeg.deleteFile(outputFileName);
    }

    // Clean up input file from FFmpeg's virtual filesystem
    await ffmpeg.deleteFile(inputFileName);

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Splitting complete!",
      currentSegment: totalSegments,
      totalSegments,
    });

    return processedFiles;
  } catch (error) {
    console.error("Audio splitting error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Failed to split audio file";
    throw new Error(errorMessage);
  }
};
