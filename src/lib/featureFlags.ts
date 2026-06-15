// Feature flags — gate non-functional features without removing code.
// To re-enable a feature, set its flag to `true` here.
export const FEATURES = {
  // TODO: Re-enable Mentor IA when the Gemini integration is functional
  mentorIA: false,
} as const;
