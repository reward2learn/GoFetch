import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { api, fileUrl } from "@/src/api/client";

const REASONS = ["Item not as described", "Item not received", "Damaged item", "Wrong item", "Other"];

export default function Dispute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const addEvidence = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      const path = await api.uploadImage(res.assets[0].uri);
      setEvidence((e) => [...e, fileUrl(path)!]);
    } catch {}
  };

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      await api.post("/disputes", { orderId: id, reason: `${reason}${detail ? " — " + detail : ""}`, evidence });
      router.replace(`/order/${id}`);
    } catch (e: any) {
      setErr(e.message || "Could not submit dispute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="dispute-close" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Raise a dispute</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <Ionicons name="scale" size={18} color={colors.brandPrimary} />
            <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ flex: 1, lineHeight: 18 }}>
              Escrow is frozen while arbitration reviews the evidence from both parties. Provide clear proof to speed things up.
            </AppText>
          </View>

          <AppText weight="semibold" size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: spacing.lg, marginBottom: 6 }}>Reason</AppText>
          <View style={{ gap: spacing.sm }}>
            {REASONS.map((r) => (
              <Pressable key={r} testID={`reason-${r}`} onPress={() => setReason(r)} style={[styles.reason, reason === r && styles.reasonActive]}>
                <Ionicons name={reason === r ? "radio-button-on" : "radio-button-off"} size={20} color={reason === r ? colors.brandPrimary : colors.muted} />
                <AppText weight={reason === r ? "semibold" : "regular"}>{r}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText weight="semibold" size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: spacing.lg, marginBottom: 6 }}>Describe the issue</AppText>
          <TextInput
            testID="dispute-detail-input"
            placeholder="What went wrong?"
            placeholderTextColor={colors.muted}
            value={detail}
            onChangeText={setDetail}
            multiline
            style={styles.textArea}
          />

          <AppText weight="semibold" size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: spacing.lg, marginBottom: 6 }}>Evidence</AppText>
          <View style={styles.evidenceRow}>
            {evidence.map((u, i) => (
              <Image key={i} source={{ uri: u }} style={styles.evImg} contentFit="cover" />
            ))}
            <Pressable testID="add-evidence" onPress={addEvidence} style={styles.addEv}>
              <Ionicons name="add" size={26} color={colors.brandPrimary} />
            </Pressable>
          </View>

          {!!err && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.md }}>{err}</AppText>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="submit-dispute-button" title="Submit dispute" variant="danger" icon="flag" onPress={submit} loading={busy} />
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
  notice: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  textArea: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    height: 110,
    textAlignVertical: "top",
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
  evidenceRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  evImg: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  addEv: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brandTertiary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
