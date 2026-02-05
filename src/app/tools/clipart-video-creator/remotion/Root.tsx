"use client";

import React from "react";
import { Composition } from "remotion";
import { EtsySquare, etsySquareConfig } from "../components/EtsySquare";
import { SocialVertical, socialVerticalConfig } from "../components/SocialVertical";
import { clipartVideoCreatorSchema } from "../schema";
import type { ClipartVideoCreatorProps } from "../schema";

const defaultProps: ClipartVideoCreatorProps = {
  hookImageUrl: "",
  clipartUrls: [],
  clipartEffect: "slide",
  mockupUrls: [],
  shopLogoUrl: "",
  shopName: "",
  showStartScreenEtsy: true,
  showStartScreenSocial: true,
  showEndScreenEtsy: true,
  showEndScreenSocial: true,
};

export function RemotionRoot() {
  return (
    <>
      <Composition
        id={etsySquareConfig.id}
        component={EtsySquare}
        durationInFrames={etsySquareConfig.durationInFrames}
        fps={etsySquareConfig.fps}
        width={etsySquareConfig.width}
        height={etsySquareConfig.height}
        defaultProps={defaultProps}
        schema={clipartVideoCreatorSchema}
      />
      <Composition
        id={socialVerticalConfig.id}
        component={SocialVertical}
        durationInFrames={socialVerticalConfig.durationInFrames}
        fps={socialVerticalConfig.fps}
        width={socialVerticalConfig.width}
        height={socialVerticalConfig.height}
        defaultProps={defaultProps}
        schema={clipartVideoCreatorSchema}
      />
    </>
  );
}
