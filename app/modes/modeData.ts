import { allModes } from "@/lib/modes";

const modeDetails = Object.fromEntries(
  allModes.map((mode) => [
    mode.slug,
    {
      fullDescription: mode.fullDescription,
      rules: mode.rules,
      rewardBreakdown: mode.rewardBreakdown,
      insideImage: mode.appImage,
    },
  ])
);

export { modeDetails, allModes };
