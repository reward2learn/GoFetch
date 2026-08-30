import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { POST_CATEGORIES, CATEGORY_ICON } from "@/src/constants";
import { LocationPicker } from "@/src/components/LocationPicker";
import { formatRoute } from "@/src/locations";
import { api, fileUrl } from "@/src/api/client";

export default function PostRequest() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<string>("Beauty");
  const [itemPrice, setItemPrice] = useState("");
  const [reward, setReward] = useState("");
  const [from, setFrom] = useState<{ country: string; city: string } | null>(null);
  const [to, setTo] = useState<{ country: string; city: string } | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<null | "from" | "to">(null);
  const [avail, setAvail] = useState<any | null>(null);

  useEffect(() => {
    setAvail(null);
    if (from && to) {
      api
        .get(`/availability?fromCountry=${encodeURIComponent(from.country)}&toCountry=${encodeURIComponent(to.country)}`)
        .then(setAvail)
        .catch(() => {});
    }
  }, [from, to]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo permission is needed to add an image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    setUploading(true);
    try {
      const path = await api.uploadImage(res.assets[0].uri);
      setImagePath(path);
    } catch (e: any) {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError("");
    const ip = parseFloat(itemPrice);
    const rw = parseFloat(reward);
    if (!title.trim() || !ip || !rw || !from || !to) {
      setError("Fill in item, price, reward and both locations.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/requests", {
        title: title.trim(),
        description: desc.trim(),
        category,
        image: imagePath ? fileUrl(imagePath) : null,
        itemPrice: ip,
        maxItemPrice: Math.round(ip * 1.05 * 100) / 100,
        reward: rw,
        fromCountry: from.country,
        fromCity: from.city,
        toCountry: to.country,
        toCity: to.city,
        deadline: deadline.trim() || null,
      });
      router.back();
    } catch (e: any) {
      setError(e.message || "Could not post request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="close-post" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>New Request</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.imagePick} onPress={pickImage} testID="pick-image">
            {imagePath ? (
              <Image source={{ uri: fileUrl(imagePath) }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={{ alignItems: "center", gap: 6 }}>
                <Ionicons name={uploading ? "cloud-upload-outline" : "camera-outline"} size={30} color={colors.brandPrimary} />
                <AppText color={colors.brandPrimary} weight="semibold">
                  {uploading ? "Uploading…" : "Add item photo (optional)"}
                </AppText>
              </View>
            )}
          </Pressable>

          <Label text="What do you need?" />
          <TextInput testID="title-input" placeholder="e.g. Le Labo Santal 33 100ml" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} style={styles.input} />

          <Label text="Details" />
          <TextInput
            testID="desc-input"
            placeholder="Variant, size, colour, store, notes for customs…"
            placeholderTextColor={colors.muted}
            value={desc}
            onChangeText={setDesc}
            multiline
            style={[styles.input, { height: 90, textAlignVertical: "top", paddingTop: 12 }]}
          />

          <Label text="Category" />
          <View style={styles.catRow}>
            {POST_CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <Pressable key={c} testID={`post-cat-${c}`} onPress={() => setCategory(c)} style={[styles.catChip, active && styles.catChipActive]}>
                  <Ionicons name={CATEGORY_ICON[c] as any} size={14} color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary} />
                  <AppText size={type.sm} weight="semibold" color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary}>{c}</AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Label text="Item price (USDC)" />
              <TextInput testID="item-price-input" placeholder="240" placeholderTextColor={colors.muted} value={itemPrice} onChangeText={setItemPrice} keyboardType="decimal-pad" style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Traveller reward" />
              <TextInput testID="reward-input" placeholder="45" placeholderTextColor={colors.muted} value={reward} onChangeText={setReward} keyboardType="decimal-pad" style={styles.input} />
            </View>
          </View>

          <Label text="Buy from (origin)" />
          <Pressable testID="from-country" style={styles.selectRow} onPress={() => setPicker("from")}>
            <Ionicons name="storefront-outline" size={18} color={colors.brandPrimary} />
            <AppText color={from ? colors.onSurface : colors.muted} weight={from ? "semibold" : "regular"} style={{ flex: 1 }}>
              {from ? formatRoute(from.country, from.city) : "Select country & city"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Label text="Deliver to (destination)" />
          <Pressable testID="to-country" style={styles.selectRow} onPress={() => setPicker("to")}>
            <Ionicons name="location-outline" size={18} color={colors.brandPrimary} />
            <AppText color={to ? colors.onSurface : colors.muted} weight={to ? "semibold" : "regular"} style={{ flex: 1 }}>
              {to ? formatRoute(to.country, to.city) : "Select country & city"}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          {avail && (
            <View testID="availability-preview" style={styles.availCard}>
              <Ionicons name="people" size={20} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <AppText weight="bold">
                  {avail.total} {avail.total === 1 ? "traveller can" : "travellers can"} deliver this
                </AppText>
                <AppText size={type.sm} color={colors.muted}>
                  {avail.planned} with a matching trip · {avail.past} delivered this route before
                </AppText>
              </View>
            </View>
          )}

          <Label text="Needed by (optional)" />
          <TextInput testID="deadline-input" placeholder="e.g. 2026-07-25" placeholderTextColor={colors.muted} value={deadline} onChangeText={setDeadline} style={styles.input} />

          {!!error && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.md }}>{error}</AppText>}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="submit-request-button" title="Post Request" onPress={submit} loading={busy} icon="send" />
        </View>
      </KeyboardAvoidingView>

      <LocationPicker
        visible={picker === "from"}
        title="Buy from"
        onClose={() => setPicker(null)}
        onSelect={(country, city) => setFrom({ country, city })}
      />
      <LocationPicker
        visible={picker === "to"}
        title="Deliver to"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imagePick: {
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.brandTertiary,
    borderWidth: 1.5,
    borderColor: colors.brandTertiary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  twoCol: { flexDirection: "row", gap: spacing.md },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  selectRow: {
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
  availCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
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
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  destItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
});
