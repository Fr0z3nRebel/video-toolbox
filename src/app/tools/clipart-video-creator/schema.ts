import { z } from "zod";

export const clipartEffectOptions = [
  "slide",
  "alternateSlide",
  "diagonalSlide",
  "alternateDiagonalSlide",
] as const;
export type ClipartEffect = (typeof clipartEffectOptions)[number];

export const clipartVideoCreatorSchema = z.object({
  hookImageUrl: z.string(),
  clipartUrls: z.array(z.string()),
  clipartEffect: z.enum(clipartEffectOptions),
  mockupUrls: z.array(z.string()),
  shopLogoUrl: z.string(),
  shopName: z.string(),
  showEndScreenEtsy: z.boolean(),
  showEndScreenSocial: z.boolean(),
});

export type ClipartVideoCreatorProps = z.infer<typeof clipartVideoCreatorSchema>;
