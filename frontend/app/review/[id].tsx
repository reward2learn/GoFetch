import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { api } from "@/src/api/client";

export default function Review() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      await api.post("/reviews", { orderId: id, rating, comment });
      router.replace(`/order/${id}`);
    } catch (e: any) {
      setErr(e.message || "Could not submit review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="review-close" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Leave a review</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: spacing.lg }}>
          <View style={styles.hero}>
            <Ionicons name="ribbon" size={40} color={colors.brandPrimary} />
          </View>
          <AppText weight="extrabold" size={type.xl} style={{ textAlign: "center", marginTop: spacing.md }}>
            How did it go?
          </AppText>
          <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 6 }}>
            Your rating is recorded on-chain to build community trust.
          </AppText>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} testID={`star-${i}`} onPress={() => setRating(i)} hitSlop={6}>
                <Ionicons name={rating >= i ? "star" : "star-outline"} size={40} color={colors.warning} />
              </Pressable>
            ))}
          </View>

          <TextInput
            testID="review-comment-input"
            placeholder="Share details of your experience (optional)"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
            style={styles.textArea}
          />
          {!!err && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.md }}>{err}</AppText>}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="submit-review-button" title="Submit review" icon="checkmark-circle" onPress={submit} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hero: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.xl },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl },
  textArea: {
    marginTop: spacing.xl,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    height: 120,
    textAlignVertical: "top",
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
