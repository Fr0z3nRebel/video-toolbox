"use client";

import React, { useMemo } from "react";
import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { ClipartVideoCreatorProps } from "../schema";

const SOCIAL_WIDTH = 1080;
const SOCIAL_HEIGHT = 1920;
const FPS = 30;
const DURATION_FRAMES = 450; // 15s

const CELL_SIZE = 480;
const GAP = 24;

export const socialVerticalConfig = {
  id: "social-vertical" as const,
  width: SOCIAL_WIDTH,
  height: SOCIAL_HEIGHT,
  fps: FPS,
  durationInFrames: DURATION_FRAMES,
};

export function SocialVertical(props: ClipartVideoCreatorProps) {
  const frame = useCurrentFrame();

  const scrollContentHeight = useMemo(() => {
    const count = props.clipartUrls.length;
    const rows = Math.ceil(count / 2);
    return rows * (CELL_SIZE + GAP) + GAP;
  }, [props.clipartUrls.length]);

  const kenBurnsScale = interpolate(frame, [0, 90], [1.4, 0.75], {
    extrapolateRight: "clamp",
  });

  const scrollTranslateY = interpolate(
    frame,
    [90, 360],
    [0, -(scrollContentHeight - SOCIAL_HEIGHT)],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const arrowOffset = interpolate(frame, [360, 420], [0, 12], {
    extrapolateRight: "clamp",
  });

  const arrowOpacity = interpolate(
    frame,
    [360, 390, 420, 450],
    [0.6, 1, 0.6, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a" }}>
      {/* Background: HookImage scaled 300%, no blur (client-side unsupported), with overlay */}
      {props.hookImageUrl && (
        <AbsoluteFill>
          <Img
            src={props.hookImageUrl}
            style={{
              width: "300%",
              height: "300%",
              objectFit: "cover",
              left: "-100%",
              top: "-100%",
              position: "absolute",
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />
        </AbsoluteFill>
      )}

      {/* 0–3s: Ken Burns zoom on HookImage (same as 1:1), then "New Bundle Alert!" */}
      {frame < 90 && props.hookImageUrl && (
        <AbsoluteFill>
          <Img
            src={props.hookImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: "center center",
            }}
          />
          <AbsoluteFill
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          />
          <AbsoluteFill
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: 120,
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 56,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              New Bundle Alert!
            </span>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* 3–12s: Vertical scroll – 2-column staggered, scroll up */}
      {frame >= 90 && frame < 360 && props.clipartUrls.length > 0 && (
        <AbsoluteFill
          style={{
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: GAP,
              paddingLeft: GAP,
              paddingRight: GAP,
              transform: `translateY(${scrollTranslateY}px)`,
              willChange: "transform",
            }}
          >
            {[0, 1].map((col) => (
              <div
                key={col}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: GAP,
                  width: (SOCIAL_WIDTH - GAP * 3) / 2,
                  flexShrink: 0,
                }}
              >
                {props.clipartUrls
                  .filter((_, i) => i % 2 === col)
                  .map((url, i) => (
                    <div
                      key={`${col}-${i}`}
                      style={{
                        width: "100%",
                        height: CELL_SIZE,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Img
                        src={url}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* 12–15s: CTA – ShopLogo (your logo appears here), "LINK IN BIO", animated arrow */}
      {frame >= 360 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {props.shopLogoUrl ? (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: "rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                flexShrink: 0,
              }}
            >
              <Img
                src={props.shopLogoUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : null}
          <span
            style={{
              color: "#fff",
              fontSize: 72,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: 2,
            }}
          >
            LINK IN BIO
          </span>
          <span
            style={{
              color: "#fff",
              fontSize: 40,
              transform: `translateY(${arrowOffset}px)`,
              opacity: arrowOpacity,
            }}
          >
            ↓
          </span>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
