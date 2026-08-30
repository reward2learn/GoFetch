import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { LocationPicker } from "@/src/components/LocationPicker";
import { formatRoute } from "@/src/locations";
import { api } from "@/src/api/client";

export default function TravelPlan() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [from, setFrom] = useState<{ country: string; city: string } | null>(null);
  const [to, setTo] = useState<{ country: string; city: string } | null>(null);
  const [depart, setDepart] = useState("");
  const [note, setNote] = useState("");
  const [picker, setPicker] = useState<null | "from" | "to">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);

  const submit = async () => {
    setError("");
    if (!from || !to) {
      setError("Choose both your origin and destination.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/travel-plans", {
        fromCountry: from.country,
        fromCity: from.city,
        toCountry: to.country,
        toCity: to.city,
        departDate: depart.trim(),
        note: note.trim(),
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Could not save trip.");
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <View style={{ width: 26 }} />
          <AppText weight="bold" size={type.lg}>Trip shared</AppText>
          <Pressable testID="plan-done-x" onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
        <View style={[styles.center, { flex: 1, padding: spacing.xl }]}>
          <View style={styles.successCircle}>
            <Ionicons name="paper-plane" size={48} color="#fff" />
          </View>
          <AppText weight="extrabold" size={type.xl} style={{ marginTop: spacing.lg, textAlign: "center" }}>
            {result.matchCount > 0 ? `${result.matchCount} request${result.matchCount === 1 ? "" : "s"} already match!` : "Trip added"}
          </AppText>
          <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 6, lineHeight: 21 }}>
            {result.matchCount > 0
              ? "We've added them to your inbox. Accept one to start earning on this route."
              : "New requests matching your route will appear in your inbox automatically."}
          </AppText>
          <Button testID="view-inbox-button" title="View inbox" icon="mail" onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: "stretch" }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable testID="plan-close" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Share a trip</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Ionicons name="airplane" size={18} color={colors.brandPrimary} />
            <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ flex: 1, lineHeight: 18 }}>
              Tell us where you're flying. We'll match shopping requests on your route straight to your inbox.
            </AppText>
          </View>

          <Label text="Flying from" />
          <Pressable testID="plan-from" style={styles.select} onPress={() => setPicker("from")}>
            <Ionicons name="storefront-outline" size={18} color={colors.brandPrimary} />
            <AppText color={from ? colors.onSurface : colors.muted} weight={from ? "semibold" : "regular"} style={{ flex: 1 }}>
              {from ? formatRoute(from.country, from.city) : "Select origin"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Label text="Flying to" />
          <Pressable testID="plan-to" style={styles.select} onPress={() => setPicker("to")}>
            <Ionicons name="location-outline" size={18} color={colors.brandPrimary} />
            <AppText color={to ? colors.onSurface : colors.muted} weight={to ? "semibold" : "regular"} style={{ flex: 1 }}>
              {to ? formatRoute(to.country, to.city) : "Select destination"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Label text="Departure date (optional)" />
          <TextInput testID="depart-input" placeholder="e.g. 2026-07-15" placeholderTextColor={colors.muted} value={depart} onChangeText={setDepart} style={styles.input} />

          <Label text="Note (optional)" />
          <TextInput
            testID="plan-note-input"
            placeholder="Spare luggage capacity, preferences…"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            style={[styles.input, { height: 84, textAlignVertical: "top", paddingTop: 12 }]}
          />

          {!!error && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.md }}>{error}</AppText>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="submit-plan-button" title="Share trip & match" onPress={submit} loading={busy} icon="airplane" />
        </View>
      </KeyboardAvoidingView>

      <LocationPicker
        visible={picker === "from"}
        title="Flying from"
        onClose={() => setPicker(null)}
        onSelect={(country, city) => setFrom({ country, city })}
      />
      <LocationPicker
        visible={picker === "to"}
        title="Flying to"
        onClose={() => setPicker(null)}
        onSelect={(country, city) => setTo({ country, city })}
      />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <AppText weight="semibold" size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: spacing.lg, marginBottom: 6 }}>{text}</AppText>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  intro: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
  successCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
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
