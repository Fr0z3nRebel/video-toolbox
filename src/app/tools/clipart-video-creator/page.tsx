"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { canRenderMediaOnWeb } from "@remotion/web-renderer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone, {
  FileWithPreview,
} from "../../components/FileUploadZone";
import { EtsySquare, etsySquareConfig } from "./components/EtsySquare";
import { SocialVertical, socialVerticalConfig } from "./components/SocialVertical";
import { clipartVideoCreatorSchema } from "./schema";
import type { ClipartVideoCreatorProps } from "./schema";
import type { ClipartEffect } from "./schema";
import { useRenderVideo } from "./useRenderVideo";
import { WIZARD_STEPS } from "./constants/wizardSteps";
import { useWizard } from "./hooks/useWizard";

/** Convert a File to a data URL so it works inside Remotion Player (which may render in an iframe where blob URLs from the parent are not loadable). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function revokeBlobUrl(url: string) {
  if (url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

export default function ClipartVideoCreatorPage() {
  const { step, setStep, nextStep, previousStep, isFirstStep, isLastStep } =
    useWizard(1);
  const [hookImageFile, setHookImageFile] = useState<FileWithPreview[]>([]);
  const [clipartFiles, setClipartFiles] = useState<FileWithPreview[]>([]);
  const [mockupFiles, setMockupFiles] = useState<FileWithPreview[]>([]);
  const [shopLogoFile, setShopLogoFile] = useState<FileWithPreview[]>([]);
  const [shopName, setShopName] = useState("");
  const [clipartEffect, setClipartEffect] = useState<ClipartEffect>("slide");
  const [showStartScreenEtsy, setShowStartScreenEtsy] = useState(true);
  const [showStartScreenSocial, setShowStartScreenSocial] = useState(true);
  const [showEndScreenEtsy, setShowEndScreenEtsy] = useState(true);
  const [showEndScreenSocial, setShowEndScreenSocial] = useState(true);
  const [activeTab, setActiveTab] = useState<"etsy" | "social">("etsy");
  const [canRenderOnWeb, setCanRenderOnWeb] = useState<boolean | null>(null);

  const hookImageUrl = hookImageFile[0]?.preview ?? null;
  const clipartUrls = useMemo(
    () => clipartFiles.map((f) => f.preview).filter((u): u is string => !!u),
    [clipartFiles]
  );
  const mockupUrls = useMemo(
    () => mockupFiles.map((f) => f.preview).filter((u): u is string => !!u),
    [mockupFiles]
  );
  const shopLogoUrl = shopLogoFile[0]?.preview ?? "";

  const inputProps: ClipartVideoCreatorProps = useMemo(
    () => ({
      hookImageUrl: hookImageUrl ?? "",
      clipartUrls,
      clipartEffect,
      mockupUrls,
      shopLogoUrl: shopLogoUrl || "",
      shopName: shopName.trim() || "My Shop",
      showStartScreenEtsy,
      showStartScreenSocial,
      showEndScreenEtsy,
      showEndScreenSocial,
    }),
    [hookImageUrl, clipartUrls, clipartEffect, mockupUrls, shopLogoUrl, shopName, showStartScreenEtsy, showStartScreenSocial, showEndScreenEtsy, showEndScreenSocial]
  );

  useEffect(() => {
    canRenderMediaOnWeb({
      width: socialVerticalConfig.width,
      height: socialVerticalConfig.height,
      container: "mp4",
      videoCodec: "h264",
      muted: true,
    })
      .then((result) => setCanRenderOnWeb(result.canRender))
      .catch(() => setCanRenderOnWeb(false));
  }, []);

  const canRender = useMemo(() => {
    const needsLogo =
      inputProps.showEndScreenEtsy || inputProps.showEndScreenSocial;
    return (
      canRenderOnWeb === true &&
      !!inputProps.hookImageUrl &&
      inputProps.clipartUrls.length > 0 &&
      (needsLogo ? !!inputProps.shopLogoUrl : true)
    );
  }, [canRenderOnWeb, inputProps]);

  const {
    render,
    isRendering,
    progress,
    renderError,
    activeCompositionId,
  } = useRenderVideo();

  /** Only convert to data URL when the item is a real File; keep existing data URL previews (e.g. when adding more files after initial upload). */
  const ensureDataUrl = useCallback(
    async (f: FileWithPreview): Promise<string> => {
      if (f instanceof File) return fileToDataUrl(f);
      const p = f.preview;
      return typeof p === "string" && p.startsWith("data:") ? p : "";
    },
    []
  );

  const setHookImageWithUrl = useCallback(
    (files: FileWithPreview[]) => {
      files.forEach((f) => f.preview?.startsWith?.("blob:") && revokeBlobUrl(f.preview));
      const toProcess = files.slice(0, 1);
      Promise.all(
        toProcess.map(async (f) => ({
          ...f,
          id: (f as FileWithPreview).id || Math.random().toString(36).slice(2),
          preview: await ensureDataUrl(f),
        }))
      ).then((withPreviews) =>
        setHookImageFile(withPreviews as FileWithPreview[])
      );
    },
    [ensureDataUrl]
  );

  const setClipartWithUrls = useCallback(
    (files: FileWithPreview[]) => {
      files.forEach((f) => f.preview?.startsWith?.("blob:") && revokeBlobUrl(f.preview));
      Promise.all(
        files.map(async (f) => ({
          ...f,
          id: (f as FileWithPreview).id || Math.random().toString(36).slice(2),
          preview: await ensureDataUrl(f),
        }))
      ).then((withPreviews) =>
        setClipartFiles(withPreviews as FileWithPreview[])
      );
    },
    [ensureDataUrl]
  );

  const setMockupWithUrls = useCallback(
    (files: FileWithPreview[]) => {
      files.forEach((f) => f.preview?.startsWith?.("blob:") && revokeBlobUrl(f.preview));
      Promise.all(
        files.map(async (f) => ({
          ...f,
          id: (f as FileWithPreview).id || Math.random().toString(36).slice(2),
          preview: await ensureDataUrl(f),
        }))
      ).then((withPreviews) =>
        setMockupFiles(withPreviews as FileWithPreview[])
      );
    },
    [ensureDataUrl]
  );

  const setShopLogoWithUrl = useCallback(
    (files: FileWithPreview[]) => {
      files.forEach((f) => f.preview?.startsWith?.("blob:") && revokeBlobUrl(f.preview));
      const toProcess = files.slice(0, 1);
      Promise.all(
        toProcess.map(async (f) => ({
          ...f,
          id: (f as FileWithPreview).id || Math.random().toString(36).slice(2),
          preview: await ensureDataUrl(f),
        }))
      ).then((withPreviews) =>
        setShopLogoFile(withPreviews as FileWithPreview[])
      );
    },
    [ensureDataUrl]
  );

  const handleRenderEtsy = useCallback(() => {
    const parsed = clipartVideoCreatorSchema.safeParse(inputProps);
    if (!parsed.success) return;
    render("etsy-square", parsed.data);
  }, [inputProps, render]);

  const handleRenderSocial = useCallback(() => {
    const parsed = clipartVideoCreatorSchema.safeParse(inputProps);
    if (!parsed.success) return;
    render("social-vertical", parsed.data);
  }, [inputProps, render]);

  const isRenderingEtsy = isRendering && activeCompositionId === "etsy-square";
  const isRenderingSocial =
    isRendering && activeCompositionId === "social-vertical";

  const stepContent =
    step === 1 ? (
      <div className="space-y-4">
        <FileUploadZone
          files={hookImageFile}
          onFilesChange={setHookImageWithUrl}
          acceptedFileTypes="image/*"
          supportedFormatsText="PNG, JPG, WebP"
          title="Hook"
          dropZoneText="Drop image here or click to select"
          showFileSize
          maxDisplayHeight="max-h-20"
          disabled={isRendering}
          compact
          actionButton={
            <span className="text-xs text-gray-500">Single image</span>
          }
        />
      </div>
    ) : step === 2 ? (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Effect (1:1 video)
          </label>
          <select
            value={clipartEffect}
            onChange={(e) =>
              setClipartEffect(e.target.value as ClipartEffect)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
            disabled={isRendering}
          >
            <option value="slide">Side scroll (all rows same direction)</option>
            <option value="alternateSlide">
              Alternate side scroll (top row left, bottom row right)
            </option>
            <option value="diagonalSlide">
              Diagonal scroll (27.5°)
            </option>
            <option value="alternateDiagonalSlide">
              Alternate diagonal scroll (top up-left, bottom down-right)
            </option>
          </select>
        </div>
        <FileUploadZone
          files={clipartFiles}
          onFilesChange={setClipartWithUrls}
          acceptedFileTypes="image/*"
          supportedFormatsText="PNG, JPG (multiple)"
          title="Clipart"
          dropZoneText="Drop images here or click to select"
          showFileSize
          maxDisplayHeight="max-h-24"
          disabled={isRendering}
          compact
          actionButton={
            <span className="text-xs text-gray-500">Multiple images</span>
          }
        />
        <p className="text-sm text-gray-600">
          Optional. Mockup images appear every other slot in the clipart scroll.
          If you add fewer mockups than clipart, they are spaced out for balance.
        </p>
        <FileUploadZone
          files={mockupFiles}
          onFilesChange={setMockupWithUrls}
          acceptedFileTypes="image/*"
          supportedFormatsText="PNG, JPG (multiple)"
          title="Mockups"
          dropZoneText="Drop mockup images or click to select"
          showFileSize
          maxDisplayHeight="max-h-24"
          disabled={isRendering}
          compact
          actionButton={
            <span className="text-xs text-gray-500">Optional, multiple</span>
          }
        />
      </div>
    ) : step === 3 ? (
      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Shop title
        </label>
        <input
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="My Shop"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          disabled={isRendering}
        />
        <p className="text-sm text-gray-600">
          Logo shows at end of 1:1 (above text) and Social Short (9:16) above &quot;LINK IN BIO&quot; when end screen is on.
        </p>
        <FileUploadZone
          files={shopLogoFile}
          onFilesChange={setShopLogoWithUrl}
          acceptedFileTypes="image/*"
          supportedFormatsText="PNG, JPG"
          title="Shop logo"
          dropZoneText="Drop logo here or click"
          showFileSize
          maxDisplayHeight="max-h-20"
          disabled={isRendering}
          compact
          actionButton={
            <span className="text-xs text-gray-500">Single image</span>
          }
        />
      </div>
    ) : (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Start screen (0–3s hook image)</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStartScreenEtsy}
              onChange={(e) => setShowStartScreenEtsy(e.target.checked)}
              disabled={isRendering}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Show start screen on Etsy Listing (1:1)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStartScreenSocial}
              onChange={(e) => setShowStartScreenSocial(e.target.checked)}
              disabled={isRendering}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Show start screen on Social Short (9:16)
            </span>
          </label>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">End screen (12–15s)</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEndScreenEtsy}
              onChange={(e) => setShowEndScreenEtsy(e.target.checked)}
              disabled={isRendering}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Show end screen on 1:1 (logo, PNGs included, commercial use)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEndScreenSocial}
              onChange={(e) => setShowEndScreenSocial(e.target.checked)}
              disabled={isRendering}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Show end screen on 9:16 (logo, LINK IN BIO)
            </span>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          When unchecked, the scroll is slowed so the last image fully appears at 15s (no end screen, no white space).
        </p>
        {(isRenderingEtsy ||
          isRenderingSocial ||
          (progress > 0 && activeCompositionId)) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Rendering…</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRenderEtsy}
            disabled={!canRender || isRendering}
            className="flex-1 py-3 px-4 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isRenderingEtsy ? "Preparing…" : "1:1 MP4"}
          </button>
          <button
            type="button"
            onClick={handleRenderSocial}
            disabled={!canRender || isRendering}
            className="flex-1 py-3 px-4 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isRenderingSocial ? "Preparing…" : "9:16 MP4"}
          </button>
        </div>
        {!canRender && (
          <p className="text-xs text-gray-500">
            Complete hook image, clipart, and logo to export.
          </p>
        )}
      </div>
    );

  return (
    <ToolPageLayout
      title="ClipArt Bundle Video Creator"
      description="Create Etsy listing (1:1) and social short (9:16) MP4 videos from your assets"
      showBackButton
    >
      {/* Wizard + preview (bundle-builder style) */}
      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          {/* Stepper + step content */}
          <div className="flex flex-col min-h-0">
            <nav
              aria-label="Steps"
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-4 pb-4 border-b border-gray-200"
            >
              {WIZARD_STEPS.map((s, i) => (
                <span key={s.num} className="flex items-center gap-x-1.5">
                  {i > 0 && (
                    <span className="text-gray-300 select-none" aria-hidden>
                      •
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(s.num)}
                    className={`text-sm font-medium ${
                      step === s.num ? "text-blue-600" : "text-gray-500"
                    } hover:text-gray-900 transition-colors`}
                    aria-current={step === s.num ? "step" : undefined}
                  >
                    {s.num}. {s.label}
                  </button>
                </span>
              ))}
            </nav>
            <div className="space-y-4 flex-1 min-h-0 overflow-y-auto lg:pr-1">
              {stepContent}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 shrink-0">
              {!isFirstStep ? (
                <button
                  type="button"
                  onClick={previousStep}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : null}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Video preview (right column) */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="relative w-full min-h-0 flex flex-col justify-start items-stretch max-h-[90vh] rounded-xl border border-gray-200 bg-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 bg-white px-2 pt-2 pb-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("etsy")}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-colors text-sm ${
                    activeTab === "etsy"
                      ? "bg-white border border-b-0 border-gray-200 text-blue-600 -mb-px shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Etsy Listing (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-2 font-medium rounded-t-lg transition-colors text-sm ${
                    activeTab === "social"
                      ? "bg-white border border-b-0 border-gray-200 text-blue-600 -mb-px shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Social Short (9:16)
                </button>
              </div>

              {/* Player area */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2">
                {activeTab === "etsy" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-full h-full max-w-full max-h-full aspect-square shrink-0">
                      <Player
                        component={EtsySquare}
                        inputProps={inputProps}
                        durationInFrames={etsySquareConfig.durationInFrames}
                        compositionWidth={etsySquareConfig.width}
                        compositionHeight={etsySquareConfig.height}
                        fps={etsySquareConfig.fps}
                        style={{ width: "100%", height: "100%" }}
                        schema={clipartVideoCreatorSchema}
                        controls
                        loop
                        acknowledgeRemotionLicense
                      />
                    </div>
                  </div>
                )}
                {activeTab === "social" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="w-full h-full max-w-full max-h-full shrink-0"
                      style={{ aspectRatio: "9/16" }}
                    >
                      <Player
                        component={SocialVertical}
                        inputProps={inputProps}
                        durationInFrames={
                          socialVerticalConfig.durationInFrames
                        }
                        compositionWidth={socialVerticalConfig.width}
                        compositionHeight={socialVerticalConfig.height}
                        fps={socialVerticalConfig.fps}
                        style={{ width: "100%", height: "100%" }}
                        schema={clipartVideoCreatorSchema}
                        controls
                        loop
                        acknowledgeRemotionLicense
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts below card (bundle-builder style) */}
      {canRenderOnWeb === false && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your browser does not support in-browser video encoding (WebCodecs).
          Try Chrome or Edge.
        </div>
      )}
      {renderError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {renderError}
        </div>
      )}
    </ToolPageLayout>
  );
}
