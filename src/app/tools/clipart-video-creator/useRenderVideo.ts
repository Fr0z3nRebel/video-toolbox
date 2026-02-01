"use client";

import { useCallback, useState } from "react";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import type { ClipartVideoCreatorProps } from "./schema";
import { clipartVideoCreatorSchema } from "./schema";
import { EtsySquare, etsySquareConfig } from "./components/EtsySquare";
import { SocialVertical, socialVerticalConfig } from "./components/SocialVertical";

export type CompositionId = "etsy-square" | "social-vertical";

const COMPOSITIONS = {
  "etsy-square": {
    component: EtsySquare,
    ...etsySquareConfig,
  },
  "social-vertical": {
    component: SocialVertical,
    ...socialVerticalConfig,
  },
} as const;

export function useRenderVideo() {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [activeCompositionId, setActiveCompositionId] =
    useState<CompositionId | null>(null);

  const render = useCallback(
    async (
      compositionId: CompositionId,
      inputProps: ClipartVideoCreatorProps,
      options?: { signal?: AbortSignal }
    ) => {
      const config = COMPOSITIONS[compositionId];
      if (!config) return;

      setIsRendering(true);
      setProgress(0);
      setRenderError(null);
      setActiveCompositionId(compositionId);

      const totalFrames = config.durationInFrames;

      try {
        const defaultProps: ClipartVideoCreatorProps = {
          hookImageUrl: "",
          clipartUrls: [],
          shopLogoUrl: "",
          shopName: "",
        };

        const result = await renderMediaOnWeb({
          composition: {
            id: config.id,
            component: config.component,
            durationInFrames: config.durationInFrames,
            fps: config.fps,
            width: config.width,
            height: config.height,
            defaultProps,
          },
          inputProps,
          schema: clipartVideoCreatorSchema,
          container: "mp4",
          videoCodec: "h264",
          muted: true,
          onProgress: ({ encodedFrames }) => {
            setProgress(encodedFrames / totalFrames);
          },
          signal: options?.signal,
        });

        const blob = await result.getBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${compositionId}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setRenderError(
          err instanceof Error ? err.message : "Render failed"
        );
      } finally {
        setIsRendering(false);
        setProgress(0);
        setActiveCompositionId(null);
      }
    },
    []
  );

  return {
    render,
    isRendering,
    progress,
    renderError,
    activeCompositionId,
  };
}
