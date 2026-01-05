"use client";

import { useState, useEffect } from "react";
import { Clapperboard } from "lucide-react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone, {
  FileWithPreview,
} from "../../components/FileUploadZone";
import ProcessedFilesDisplay, {
  ProcessedFile,
} from "../../components/ProcessedFilesDisplay";
import { formatFileSize } from "../../components/utils/browserUtils";
import {
  convertVideoToGif,
  getVideoMetadata,
  GifConversionOptions,
  DEFAULT_OPTIONS,
  GIF_PRESETS,
  ConversionProgress,
  DitheringAlgorithm,
} from "./functions";

export default function VideoToGif() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [options, setOptions] = useState<GifConversionOptions>(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("Balanced");
  const [error, setError] = useState<string | null>(null);

  // Load video metadata when file changes
  useEffect(() => {
    if (files.length > 0) {
      getVideoMetadata(files[0])
        .then((metadata) => {
          setVideoMetadata(metadata);
          // Reset start time if it exceeds new video duration
          setOptions((prev) => {
            if (prev.startTime >= metadata.duration) {
              return { ...prev, startTime: 0 };
            }
            return prev;
          });
        })
        .catch((err) => {
          console.error("Failed to load video metadata:", err);
          setVideoMetadata(null);
        });
    } else {
      setVideoMetadata(null);
    }
  }, [files]);

  // Apply preset
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = GIF_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setOptions((prev) => ({ ...prev, ...preset.options }));
    }
  };

  // Handle conversion
  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const result = await convertVideoToGif(files[0], options, setProgress);
      setProcessedFiles([result]);
    } catch (err) {
      console.error("Error converting video:", err);
      setError(
        err instanceof Error ? err.message : "Failed to convert video to GIF"
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

  // Calculate estimated output dimensions
  const estimatedWidth = videoMetadata
    ? Math.round(videoMetadata.width * options.scale)
    : null;
  const estimatedHeight = videoMetadata
    ? Math.round(videoMetadata.height * options.scale)
    : null;

  // Calculate max duration based on video
  const maxAvailableDuration = videoMetadata
    ? Math.max(0.5, videoMetadata.duration - options.startTime)
    : 30;

  const optionsControl = (
    <div className="space-y-4">
      {/* Preset Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preset:
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          disabled={isProcessing}
        >
          {GIF_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} - {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Frame Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frame Rate: {options.fps} FPS
        </label>
        <input
          type="range"
          min="1"
          max="30"
          value={options.fps}
          onChange={(e) =>
            setOptions((prev) => ({ ...prev, fps: Number(e.target.value) }))
          }
          className="w-full accent-green-600"
          disabled={isProcessing}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>30</span>
        </div>
      </div>

      {/* Scale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scale: {Math.round(options.scale * 100)}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          value={options.scale * 100}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              scale: Number(e.target.value) / 100,
            }))
          }
          className="w-full accent-green-600"
          disabled={isProcessing}
        />
        {estimatedWidth && estimatedHeight && (
          <p className="text-xs text-gray-500 mt-1">
            Output: {estimatedWidth} x {estimatedHeight} px
          </p>
        )}
      </div>

      {/* Duration/Trim (only show when video is loaded) */}
      {videoMetadata && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time: {options.startTime.toFixed(1)}s
            </label>
            <input
              type="range"
              min="0"
              max={Math.max(0, videoMetadata.duration - 0.5)}
              step="0.1"
              value={options.startTime}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  startTime: Number(e.target.value),
                }))
              }
              className="w-full accent-green-600"
              disabled={isProcessing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration: {Math.min(options.maxDuration, maxAvailableDuration).toFixed(1)}s
            </label>
            <input
              type="range"
              min="0.5"
              max={Math.min(30, maxAvailableDuration)}
              step="0.5"
              value={Math.min(options.maxDuration, maxAvailableDuration)}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  maxDuration: Number(e.target.value),
                }))
              }
              className="w-full accent-green-600"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Video duration: {videoMetadata.duration.toFixed(1)}s
            </p>
          </div>
        </>
      )}

      {/* Quality */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quality:{" "}
          {options.quality <= 5
            ? "High"
            : options.quality <= 12
            ? "Medium"
            : "Low"}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={options.quality}
          onChange={(e) =>
            setOptions((prev) => ({ ...prev, quality: Number(e.target.value) }))
          }
          className="w-full accent-green-600"
          disabled={isProcessing}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Higher quality</span>
          <span>Smaller file</span>
        </div>
      </div>

      {/* Dithering */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dithering:
        </label>
        <select
          value={options.dithering === false ? "none" : options.dithering}
          onChange={(e) =>
            setOptions((prev) => ({
              ...prev,
              dithering:
                e.target.value === "none"
                  ? false
                  : (e.target.value as DitheringAlgorithm),
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
          disabled={isProcessing}
        >
          <option value="FloydSteinberg">Floyd-Steinberg (Recommended)</option>
          <option value="Atkinson">Atkinson</option>
          <option value="Stucki">Stucki</option>
          <option value="none">None (Fastest)</option>
        </select>
      </div>
    </div>
  );

  const progressDisplay = progress && (
    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-green-900">
          {progress.message || progress.stage}
        </span>
        <span className="text-sm text-green-700">{progress.progress}%</span>
      </div>
      <div className="w-full bg-green-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      {progress.currentFrame && progress.totalFrames && (
        <p className="text-xs text-green-600 mt-1">
          Frame {progress.currentFrame} of {progress.totalFrames}
        </p>
      )}
    </div>
  );

  const convertButton = (
    <button
      onClick={handleConvert}
      disabled={files.length === 0 || isProcessing}
      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <Clapperboard className="h-4 w-4" />
      {isProcessing ? "Converting..." : "Convert to GIF"}
    </button>
  );

  return (
    <ToolPageLayout
      title="Video to GIF"
      description="Convert video clips to animated GIFs with customizable options"
      showBackButton={true}
    >
      {/* Upload Section */}
      <div className="mb-8">
        <FileUploadZone
          files={files}
          onFilesChange={handleFilesChange}
          disabled={isProcessing}
          actionButton={convertButton}
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
        title="Generated GIF"
        emptyStateMessage="Your GIF will appear here after conversion"
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
        downloadAllButtonText="Download GIF"
        showPreview={true}
        formatFileSize={formatFileSize}
      />

      {/* Tips Section */}
      <div className="mt-8 bg-green-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Tips for Best Results
        </h3>
        <ul className="text-green-700 space-y-1 list-disc list-inside">
          <li>Shorter clips (2-5 seconds) create smaller, more shareable GIFs</li>
          <li>Lower frame rates (8-12 FPS) significantly reduce file size</li>
          <li>Scaling down to 50% or less helps with large videos</li>
          <li>Floyd-Steinberg dithering provides best quality for video content</li>
        </ul>
      </div>
    </ToolPageLayout>
  );
}
