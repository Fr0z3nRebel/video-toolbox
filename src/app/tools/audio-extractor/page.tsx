"use client";

import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone, {
  FileWithPreview,
} from "../../components/FileUploadZone";
import ProcessedFilesDisplay, {
  ProcessedFile,
} from "../../components/ProcessedFilesDisplay";
import { formatFileSize } from "../../components/utils/browserUtils";
import {
  extractAudioFromVideo,
  getVideoMetadata,
  AudioExtractionOptions,
  AudioFormat,
  AudioQuality,
  AudioExtractionProgress,
} from "./functions";

const DEFAULT_OPTIONS: AudioExtractionOptions = {
  format: "mp3",
  quality: "medium",
};

export default function AudioExtractor() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [options, setOptions] = useState<AudioExtractionOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<AudioExtractionProgress | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load video metadata when file changes
  useEffect(() => {
    if (files.length > 0) {
      getVideoMetadata(files[0])
        .then((metadata) => {
          setVideoMetadata(metadata);
        })
        .catch((err) => {
          console.error("Failed to load video metadata:", err);
          setVideoMetadata(null);
        });
    } else {
      setVideoMetadata(null);
    }
  }, [files]);

  // Handle extraction
  const handleExtract = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const result = await extractAudioFromVideo(files[0], options, setProgress);
      setProcessedFiles([result]);
    } catch (err) {
      console.error("Error extracting audio:", err);
      setError(
        err instanceof Error ? err.message : "Failed to extract audio from video"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file change - only keep first file
  const handleFilesChange = (newFiles: FileWithPreview[]) => {
    setFiles(newFiles.slice(0, 1));
    setProcessedFiles([]);
    setError(null);
  };

  const optionsControl = (
    <div className="space-y-4">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format:
        </label>
        <select
          value={options.format}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              format: e.target.value as AudioFormat,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          disabled={isProcessing}
        >
          <option value="mp3">MP3 (Compressed)</option>
          <option value="wav">WAV (Uncompressed)</option>
        </select>
      </div>

      {/* Quality Selection (only for MP3) */}
      {options.format === "mp3" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality:
          </label>
          <select
            value={options.quality}
            onChange={(e) =>
              setOptions((prev) => ({
                ...prev,
                quality: e.target.value as AudioQuality,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isProcessing}
          >
            <option value="low">Low (128 kbps) - Smaller file</option>
            <option value="medium">Medium (192 kbps) - Balanced</option>
            <option value="high">High (320 kbps) - Best quality</option>
          </select>
        </div>
      )}

      {/* Video Duration Info */}
      {videoMetadata && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Video duration:</span>{" "}
            {videoMetadata.duration.toFixed(1)}s
          </p>
        </div>
      )}
    </div>
  );

  const progressDisplay = progress && (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-blue-900">
          {progress.message || progress.stage}
        </span>
        <span className="text-sm text-blue-700">{progress.progress}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
    </div>
  );

  const extractButton = (
    <button
      onClick={handleExtract}
      disabled={files.length === 0 || isProcessing}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <Music className="h-4 w-4" />
      {isProcessing ? "Extracting..." : "Extract Audio"}
    </button>
  );

  return (
    <ToolPageLayout
      title="Audio Extractor"
      description="Extract audio from video files and save as MP3 or WAV"
      showBackButton={true}
    >
      {/* Upload Section */}
      <div className="mb-8">
        <FileUploadZone
          files={files}
          onFilesChange={handleFilesChange}
          disabled={isProcessing}
          actionButton={extractButton}
          acceptedFileTypes="video/*"
          supportedFormatsText="Supports MP4, WebM, MOV, and other video formats"
        >
          {optionsControl}
        </FileUploadZone>
      </div>

      {/* Progress Display */}
      {isProcessing && progressDisplay}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results Display */}
      <ProcessedFilesDisplay
        title="Extracted Audio"
        emptyStateMessage="Your extracted audio will appear here"
        files={processedFiles}
        onDownloadAll={() => {
          if (processedFiles[0]) {
            const link = document.createElement("a");
            link.href = processedFiles[0].url;
            link.download = processedFiles[0].name;
            link.click();
          }
        }}
        isCreatingZip={false}
        downloadAllButtonText="Download Audio"
        showPreview={false}
        formatFileSize={formatFileSize}
      />

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Tips for Best Results
        </h3>
        <ul className="text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>MP3</strong> is compressed and produces smaller files, ideal
            for sharing and storage
          </li>
          <li>
            <strong>WAV</strong> is uncompressed and preserves full audio quality,
            but creates larger files
          </li>
          <li>For music or high-quality audio, use MP3 High (320 kbps) or WAV</li>
          <li>For speech or podcasts, MP3 Medium (192 kbps) is usually sufficient</li>
          <li>Extraction time depends on video length and format</li>
        </ul>
      </div>
    </ToolPageLayout>
  );
}
