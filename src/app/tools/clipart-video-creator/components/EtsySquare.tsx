"use client";

import React, { useMemo } from "react";
import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import type { ClipartVideoCreatorProps } from "../schema";

const ETSY_WIDTH = 1080;
const ETSY_HEIGHT = 1080;
const FPS = 30;
const DURATION_FRAMES = 450; // 15s

const OFF_WHITE = "#faf9f7";

/** 27.5° – strip runs at this angle (diagonal layout) */
const DIAG_DEG = 27.5;

/** Diagonal divide through center (540, 540): y = 540 + (x - 540) * tan(27.5°) */
const DIAG_TAN = Math.tan((DIAG_DEG * Math.PI) / 180);
const DIAG_Y_AT_0 = 540 * (1 - DIAG_TAN);   // line at x=0
const DIAG_Y_AT_1080 = 540 * (1 + DIAG_TAN); // line at x=1080
/** Clip path for top region (above the diagonal line) */
const CLIP_TOP = `polygon(0 0, ${ETSY_WIDTH} 0, ${ETSY_WIDTH} ${DIAG_Y_AT_1080}, 0 ${DIAG_Y_AT_0})`;
/** Clip path for bottom region (below the diagonal line) */
const CLIP_BOTTOM = `polygon(0 ${DIAG_Y_AT_0}, ${ETSY_WIDTH} ${DIAG_Y_AT_1080}, ${ETSY_WIDTH} ${ETSY_HEIGHT}, 0 ${ETSY_HEIGHT})`;

/** Offset so strip images aren't cut off at the diagonal divide (top: up-left, bottom: down-right) */
const DIAG_STRIP_OFFSET = 32;

export const etsySquareConfig = {
  id: "etsy-square" as const,
  width: ETSY_WIDTH,
  height: ETSY_HEIGHT,
  fps: FPS,
  durationInFrames: DURATION_FRAMES,
};

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function EtsySquare(props: ClipartVideoCreatorProps) {
  const frame = useCurrentFrame();

  const gridChunks = useMemo(
    () => chunk(props.clipartUrls, 4),
    [props.clipartUrls]
  );

  const kenBurnsScale = interpolate(frame, [0, 90], [1.4, 1], {
    extrapolateRight: "clamp",
  });

  const slideDistance = (Math.max(0, gridChunks.length - 1)) * ETSY_WIDTH;
  const gridSlideX = interpolate(
    frame,
    [90, 360],
    [0, -slideDistance],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const alternateTopSlideX = interpolate(
    frame,
    [90, 360],
    [0, -slideDistance],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const alternateBottomSlideX = interpolate(
    frame,
    [90, 360],
    [-slideDistance, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  /** Diagonal = strip is rotated 27.5° (runs diagonally), scroll along strip with translateX. */
  const halfHeight = ETSY_HEIGHT / 2;

  const isSlide = props.clipartEffect === "slide";
  const isAlternateSlide = props.clipartEffect === "alternateSlide";
  const isDiagonalSlide = props.clipartEffect === "diagonalSlide";
  const isAlternateDiagonalSlide =
    props.clipartEffect === "alternateDiagonalSlide";

  return (
    <AbsoluteFill style={{ backgroundColor: OFF_WHITE }}>
      {/* 0–3s: Ken Burns zoom on HookImage */}
      {frame < 90 && props.hookImageUrl && (
        <AbsoluteFill>
          <Img
            src={props.hookImageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: "center center",
            }}
          />
        </AbsoluteFill>
      )}

      {/* 3–12s: Grid slide – 2x2 grids, horizontal */}
      {frame >= 90 && frame < 360 && gridChunks.length > 0 && isSlide && (
        <AbsoluteFill
          style={{
            backgroundColor: OFF_WHITE,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: "100%",
              transform: `translateX(${gridSlideX}px)`,
              willChange: "transform",
            }}
          >
            {gridChunks.map((urls, idx) => (
              <div
                key={idx}
                style={{
                  width: ETSY_WIDTH,
                  height: ETSY_HEIGHT,
                  flexShrink: 0,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: 0,
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: OFF_WHITE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 8,
                    }}
                  >
                    {urls[i] ? (
                      <Img
                        src={urls[i]}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      )}

      {/* 3–12s: Diagonal – strip is at 27.5° angle, scroll along the strip */}
      {frame >= 90 && frame < 360 && gridChunks.length > 0 && isDiagonalSlide && (
        <AbsoluteFill
          style={{
            backgroundColor: OFF_WHITE,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: gridChunks.length * ETSY_WIDTH,
              height: ETSY_HEIGHT,
              transformOrigin: "540px 540px",
              transform: `rotate(-${DIAG_DEG}deg) translateX(${gridSlideX}px)`,
              willChange: "transform",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "100%",
              }}
            >
              {gridChunks.map((urls, idx) => (
                <div
                  key={idx}
                  style={{
                    width: ETSY_WIDTH,
                    height: ETSY_HEIGHT,
                    flexShrink: 0,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gridTemplateRows: "1fr 1fr",
                    gap: 0,
                  }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: OFF_WHITE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                      }}
                    >
                      {urls[i] ? (
                        <Img
                          src={urls[i]}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 3–12s: Alternate slide – top row left, bottom row right */}
      {frame >= 90 && frame < 360 && gridChunks.length > 0 && isAlternateSlide && (
        <AbsoluteFill
          style={{
            backgroundColor: OFF_WHITE,
            overflow: "hidden",
          }}
        >
          {/* Top row: slides left */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: ETSY_WIDTH,
              height: halfHeight,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "100%",
                transform: `translateX(${alternateTopSlideX}px)`,
                willChange: "transform",
              }}
            >
              {gridChunks.map((urls, idx) => (
                <div
                  key={`top-${idx}`}
                  style={{
                    width: ETSY_WIDTH,
                    height: halfHeight,
                    flexShrink: 0,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0,
                  }}
                >
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: OFF_WHITE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 4,
                      }}
                    >
                      {urls[i] ? (
                        <Img
                          src={urls[i]}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Bottom row: slides right */}
          <div
            style={{
              position: "absolute",
              top: halfHeight,
              left: 0,
              width: ETSY_WIDTH,
              height: halfHeight,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "100%",
                transform: `translateX(${alternateBottomSlideX}px)`,
                willChange: "transform",
              }}
            >
              {gridChunks.map((urls, idx) => (
                <div
                  key={`bottom-${idx}`}
                  style={{
                    width: ETSY_WIDTH,
                    height: halfHeight,
                    flexShrink: 0,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0,
                  }}
                >
                  {[2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: OFF_WHITE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 4,
                      }}
                    >
                      {urls[i] ? (
                        <Img
                          src={urls[i]}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* 3–12s: Alternate diagonal – strips at 27.5°, divide between top/bottom is angled 27.5° */}
      {frame >= 90 &&
        frame < 360 &&
        gridChunks.length > 0 &&
        isAlternateDiagonalSlide && (
          <AbsoluteFill
            style={{
              backgroundColor: OFF_WHITE,
              overflow: "hidden",
            }}
          >
            {/* Top region: clipped by diagonal line (above the 27.5° divide) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: ETSY_WIDTH,
                height: ETSY_HEIGHT,
                overflow: "hidden",
                clipPath: CLIP_TOP,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: gridChunks.length * ETSY_WIDTH,
                  height: halfHeight,
                  transformOrigin: "540px 270px",
                  transform: `translate(${-DIAG_STRIP_OFFSET}px, ${-DIAG_STRIP_OFFSET}px) rotate(-${DIAG_DEG}deg) translateX(${alternateTopSlideX}px)`,
                  willChange: "transform",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    height: halfHeight,
                  }}
                >
                  {gridChunks.map((urls, idx) => (
                    <div
                      key={`top-${idx}`}
                      style={{
                        width: ETSY_WIDTH,
                        height: halfHeight,
                        flexShrink: 0,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0,
                      }}
                    >
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: OFF_WHITE,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 4,
                          }}
                        >
                          {urls[i] ? (
                            <Img
                              src={urls[i]}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Bottom region: clipped by diagonal line (below the 27.5° divide) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: ETSY_WIDTH,
                height: ETSY_HEIGHT,
                overflow: "hidden",
                clipPath: CLIP_BOTTOM,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: halfHeight,
                  width: gridChunks.length * ETSY_WIDTH,
                  height: halfHeight,
                  transformOrigin: "540px 270px",
                  transform: `translate(${DIAG_STRIP_OFFSET}px, ${DIAG_STRIP_OFFSET}px) rotate(-${DIAG_DEG}deg) translateX(${alternateBottomSlideX}px)`,
                  willChange: "transform",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    height: halfHeight,
                  }}
                >
                  {gridChunks.map((urls, idx) => (
                    <div
                      key={`bottom-${idx}`}
                      style={{
                        width: ETSY_WIDTH,
                        height: halfHeight,
                        flexShrink: 0,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0,
                      }}
                    >
                      {[2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: OFF_WHITE,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 4,
                          }}
                        >
                          {urls[i] ? (
                            <Img
                              src={urls[i]}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        )}

      {/* 12–15s: Logo + text */}
      {frame >= 360 && (
        <AbsoluteFill
          style={{
            backgroundColor: OFF_WHITE,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {props.shopLogoUrl ? (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
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
              color: "#333",
              fontSize: 48,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            20 PNGs Included
          </span>
          <span
            style={{
              color: "#333",
              fontSize: 36,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Commercial Use
          </span>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
