"use client";

import { useState, useEffect } from "react";
import { Scissors } from "lucide-react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone, {
  FileWithPreview,
} from "../../components/FileUploadZone";
import ProcessedFilesDisplay, {
  ProcessedFile,
} from "../../components/ProcessedFilesDisplay";
import { formatFileSize } from "../../components/utils/browserUtils";
import { createAndDownloadZip } from "../../components/utils/zipUtils";
import {
  splitAudio,
  getAudioMetadata,
  AudioSplitProgress,
} from "./functions";

export default function AudioSplitter() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [segmentLength, setSegmentLength] = useState<string>("30");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<AudioSplitProgress | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [audioMetadata, setAudioMetadata] = useState<{
    duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  // Load audio metadata when file changes
  useEffect(() => {
    if (files.length > 0) {
      getAudioMetadata(files[0])
        .then((metadata) => {
          setAudioMetadata(metadata);
        })
        .catch((err) => {
          console.error("Failed to load audio metadata:", err);
          setAudioMetadata(null);
        });
    } else {
      setAudioMetadata(null);
    }
  }, [files]);

  // Handle splitting
  const handleSplit = async () => {
    if (files.length === 0) return;

    const length = parseFloat(segmentLength);
    if (isNaN(length) || length <= 0) {
      setError("Segment length must be a positive number");
      return;
    }

    setIsProcessing(true);
    setProgress(null);
    setError(null);

    try {
      const results = await splitAudio(files[0], length, setProgress);
      setProcessedFiles(results);
    } catch (err) {
      console.error("Error splitting audio:", err);
      setError(
        err instanceof Error ? err.message : "Failed to split audio file"
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

  // Calculate estimated segments
  const estimatedSegments = audioMetadata && segmentLength
    ? Math.ceil(audioMetadata.duration / parseFloat(segmentLength) || 1)
    : null;

  const optionsControl = (
    <div className="space-y-4">
      {/* Segment Length Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Segment Length (seconds):
        </label>
        <input
          type="number"
          value={segmentLength}
          onChange={(e) => setSegmentLength(e.target.value)}
          min="0.1"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
          disabled={isProcessing}
          placeholder="30"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter the desired length for each segment in seconds
        </p>
      </div>

      {/* Audio Duration Info */}
      {audioMetadata && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700">
            <span className="font-medium">Audio duration:</span>{" "}
            {audioMetadata.duration.toFixed(1)}s
          </p>
          {estimatedSegments && (
            <p className="text-sm text-orange-700 mt-1">
              <span className="font-medium">Estimated segments:</span>{" "}
              {estimatedSegments}
              {estimatedSegments > 1 && " (last segment may be shorter)"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const progressDisplay = progress && (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-orange-900">
          {progress.message || progress.stage}
          {progress.currentSegment && progress.totalSegments && (
            <span className="ml-2 text-orange-700">
              ({progress.currentSegment}/{progress.totalSegments})
            </span>
          )}
        </span>
        <span className="text-sm text-orange-700">{progress.progress}%</span>
      </div>
      <div className="w-full bg-orange-200 rounded-full h-2">
        <div
          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
    </div>
  );

  const splitButton = (
    <button
      onClick={handleSplit}
      disabled={files.length === 0 || isProcessing}
      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <Scissors className="h-4 w-4" />
      {isProcessing ? "Splitting..." : "Split Audio"}
    </button>
  );

  const downloadAll = async () => {
    if (processedFiles.length === 0) return;

    setIsCreatingZip(true);
    try {
      const baseName = files[0]?.name.replace(/\.[^/.]+$/, "") || "audio-split";
      await createAndDownloadZip(
        processedFiles.map((file) => ({ name: file.name, blob: file.blob })),
        `${baseName}-segments.zip`
      );
    } catch (error) {
      console.error("Error creating zip file:", error);
    } finally {
      setIsCreatingZip(false);
    }
  };

  return (
    <ToolPageLayout
      title="Audio Splitter"
      description="Split audio files into segments of any length"
      showBackButton={true}
    >
      {/* Upload Section */}
      <div className="mb-8">
        <FileUploadZone
          files={files}
          onFilesChange={handleFilesChange}
          disabled={isProcessing}
          actionButton={splitButton}
          acceptedFileTypes="audio/*"
          supportedFormatsText="Supports MP3, WAV, M4A, and other audio formats"
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
        title="Audio Segments"
        emptyStateMessage="Your split audio segments will appear here"
        files={processedFiles}
        onDownloadAll={downloadAll}
        isCreatingZip={isCreatingZip}
        downloadAllButtonText="Download All Segments"
        showPreview={false}
        formatFileSize={formatFileSize}
      />

      {/* Tips Section */}
      <div className="mt-8 bg-orange-50 rounded-xl border border-orange-200 p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-2">
          Tips for Best Results
        </h3>
        <ul className="text-orange-700 space-y-1 list-disc list-inside">
          <li>
            The last segment will be shorter if the audio duration is not evenly
            divisible by the segment length
          </li>
          <li>
            Segments are created using stream copy (no re-encoding) for faster
            processing
          </li>
          <li>
            All segments maintain the original audio format and quality
          </li>
          <li>
            Processing time depends on the number of segments and file size
          </li>
          <li>
            You can download individual segments or all segments as a ZIP file
          </li>
        </ul>
      </div>
    </ToolPageLayout>
  );
}
