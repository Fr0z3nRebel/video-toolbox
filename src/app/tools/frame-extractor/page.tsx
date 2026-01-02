"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone, {
  FileWithPreview,
} from "../../components/FileUploadZone";
import ProcessedFilesDisplay, {
  ProcessedFile,
} from "../../components/ProcessedFilesDisplay";
import { formatFileSize } from "../../components/utils/browserUtils";
import { createAndDownloadZip } from "../../components/utils/zipUtils";
import { extractFrames, FrameExtractionOptions } from "./functions";

export default function FrameExtractor() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [framePosition, setFramePosition] = useState<"last" | "first">("last");
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg">("png");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState<ProcessedFile[]>([]);

  const handleExtractFrames = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      const options: FrameExtractionOptions = {
        position: framePosition,
        format: outputFormat,
        quality: outputFormat === "jpeg" ? 0.95 : 1.0,
      };
      const results = await extractFrames(files, options);
      setExtractedFrames(results);
    } catch (error) {
      console.error("Error extracting frames:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (extractedFrames.length === 0) return;

    setIsCreatingZip(true);
    try {
      await createAndDownloadZip(
        extractedFrames.map((file) => ({ name: file.name, blob: file.blob })),
        `extracted-frames-${framePosition}.zip`
      );
    } catch (error) {
      console.error("Error creating zip file:", error);
    } finally {
      setIsCreatingZip(false);
    }
  };

  const optionsControl = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frame to Extract:
        </label>
        <select
          value={framePosition}
          onChange={(e) => setFramePosition(e.target.value as "last" | "first")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
        >
          <option value="last">Last Frame</option>
          <option value="first">First Frame</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format:
        </label>
        <select
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as "png" | "jpeg")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
        >
          <option value="png">PNG (Lossless)</option>
          <option value="jpeg">JPEG (Smaller)</option>
        </select>
      </div>
    </div>
  );

  const extractButton = (
    <button
      onClick={handleExtractFrames}
      disabled={files.length === 0 || isProcessing}
      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <Film className="h-4 w-4" />
      {isProcessing ? "Extracting..." : "Extract Frames"}
    </button>
  );

  return (
    <ToolPageLayout
      title="Video Frame Extractor"
      description="Extract the first or last frame from any video file"
      showBackButton={true}
    >
      {/* Upload Section */}
      <div className="mb-8">
        <FileUploadZone
          files={files}
          onFilesChange={setFiles}
          disabled={isProcessing}
          actionButton={extractButton}
          acceptedFileTypes="video/*"
          supportedFormatsText="Supports MP4, WebM, MOV, AVI, and other video formats"
        >
          {optionsControl}
        </FileUploadZone>
      </div>

      {/* Extracted Frames Display */}
      <ProcessedFilesDisplay
        title="Extracted Frames"
        emptyStateMessage="Extracted frames will appear here"
        files={extractedFrames}
        onDownloadAll={downloadAll}
        isCreatingZip={isCreatingZip}
        downloadAllButtonText="Download All"
        formatFileSize={formatFileSize}
      />

      {/* Use Case Info */}
      <div className="mt-8 bg-purple-50 rounded-xl border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Use Case: AI Video Generation
        </h3>
        <p className="text-purple-700">
          Extract the last frame of your AI-generated video to use as the first
          frame of your next generation. This ensures seamless continuity
          between video segments.
        </p>
      </div>
    </ToolPageLayout>
  );
}
