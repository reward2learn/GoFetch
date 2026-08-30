import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";

const HERO =
  "https://images.unsplash.com/photo-1553619948-505cc1cdc320?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const onContinue = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    if (!accepted) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      await login(name.trim(), email.trim(), true);
      router.replace("/(tabs)/explore");
    } catch (e: any) {
      setError(e.message || "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={["rgba(28,28,30,0.25)", "rgba(28,28,30,0.65)", "rgba(28,28,30,0.96)"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", padding: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingBottom: insets.bottom + spacing.lg }}>
            <View style={styles.logoBadge}>
              <Ionicons name="earth" size={22} color={colors.onBrandPrimary} />
            </View>
            <AppText weight="extrabold" size={type["3xl"]} color="#fff" style={{ marginTop: spacing.lg }}>
              Shop the world,{"\n"}delivered by travellers.
            </AppText>
            <AppText color="rgba(255,255,255,0.82)" size={type.lg} style={{ marginTop: spacing.sm, lineHeight: 24 }}>
              Escrow-protected payments in USDC. Funds release only when you confirm the handoff.
            </AppText>

            {step === "intro" ? (
              <View style={{ marginTop: spacing["2xl"], gap: spacing.md }}>
                <Pressable
                  testID="continue-google-button"
                  onPress={() => setStep("form")}
                  style={({ pressed }) => [styles.googleBtn, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <Ionicons name="logo-google" size={20} color="#1C1C1E" />
                  <AppText weight="semibold" size={type.lg}>
                    Continue with Google
                  </AppText>
                </Pressable>
                <AppText color="rgba(255,255,255,0.7)" size={type.sm} style={{ textAlign: "center" }}>
                  A secure non-custodial wallet is created for you.
                </AppText>
              </View>
            ) : (
              <View style={styles.formCard}>
                <AppText weight="bold" size={type.lg}>
                  Set up your wallet
                </AppText>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={colors.muted} />
                  <TextInput
                    testID="name-input"
                    placeholder="Full name"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={colors.muted} />
                  <TextInput
                    testID="email-input"
                    placeholder="Google email"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                </View>
                {!!error && (
                  <AppText color={colors.error} size={type.sm}>
                    {error}
                  </AppText>
                )}
                <Pressable testID="accept-terms" onPress={() => setAccepted((a) => !a)} style={styles.termsRow}>
                  <Ionicons
                    name={accepted ? "checkbox" : "square-outline"}
                    size={22}
                    color={accepted ? colors.brandPrimary : colors.muted}
                  />
                  <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ flex: 1, lineHeight: 19 }}>
                    I agree to the{" "}
                    <AppText size={type.sm} weight="bold" color={colors.brandPrimary} onPress={() => router.push("/legal/terms")}>
                      Terms & Conditions
                    </AppText>{" "}
                    and{" "}
                    <AppText size={type.sm} weight="bold" color={colors.brandPrimary} onPress={() => router.push("/legal/privacy")}>
                      Privacy Policy
                    </AppText>
                    .
                  </AppText>
                </Pressable>
                <Button
                  testID="login-submit-button"
                  title="Create wallet & continue"
                  onPress={onContinue}
                  loading={loading}
                  disabled={!accepted}
                  icon="arrow-forward"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceInverse },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtn: {
    height: 54,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  formCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  input: { flex: 1, fontFamily: font.medium, fontSize: type.base, color: colors.onSurface },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 },
});
