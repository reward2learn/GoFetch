import Constants, { ExecutionEnvironment } from "expo-constants";
import { useFonts } from "expo-font";

// Load Plus Jakarta Sans from the Fontsource CDN via expo-font.
// On native dev/prod builds fonts autolink differently, but remote URIs work
// in Expo Go and web. We fall through on error so the app still boots.
const url = (weight: string) =>
  `https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-${weight}-normal.ttf`;

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    "Jakarta-Regular": url("400"),
    "Jakarta-Medium": url("500"),
    "Jakarta-SemiBold": url("600"),
    "Jakarta-Bold": url("700"),
    "Jakarta-ExtraBold": url("800"),
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keep = { Constants, ExecutionEnvironment };
