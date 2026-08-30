import React, { useMemo, useState } from "react";
import { View, StyleSheet, Modal, Pressable, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, colors, radius, spacing, type, font } from "@/src/components/ui";
import { LOCATIONS, citiesFor } from "@/src/locations";

export function LocationPicker({
  visible,
  title,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (country: string, city: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const countries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOCATIONS.map((l) => l.country).filter((c) => !q || c.toLowerCase().includes(q));
  }, [query]);

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return citiesFor(country).filter((c) => !q || c.toLowerCase().includes(q));
  }, [country, query]);

  const close = () => {
    setCountry(null);
    setQuery("");
    onClose();
  };

  const pick = (city: string) => {
    onSelect(country!, city);
    setCountry(null);
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.bg}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md, maxHeight: "82%" }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            {country ? (
              <Pressable testID="picker-back" onPress={() => { setCountry(null); setQuery(""); }} hitSlop={8}>
                <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
              </Pressable>
            ) : (
              <View style={{ width: 22 }} />
            )}
            <AppText weight="bold" size={type.lg}>{country ? country : title}</AppText>
            <Pressable testID="picker-close" onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              testID="picker-search"
              placeholder={country ? "Search city" : "Search country"}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={styles.search}
            />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {!country
              ? countries.map((c) => (
                  <Pressable key={c} testID={`country-${c}`} style={styles.row} onPress={() => { setCountry(c); setQuery(""); }}>
                    <AppText size={type.lg}>{c}</AppText>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                ))
              : (
                <>
                  <Pressable testID="city-all" style={styles.row} onPress={() => pick("")}>
                    <AppText size={type.lg} weight="semibold" color={colors.brandPrimary}>All cities in {country}</AppText>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.brandPrimary} />
                  </Pressable>
                  {cities.map((c) => (
                    <Pressable key={c} testID={`city-${c}`} style={styles.row} onPress={() => pick(c)}>
                      <AppText size={type.lg}>{c}</AppText>
                      <Ionicons name="airplane-outline" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.sm,
  },
  search: { flex: 1, fontFamily: font.medium, fontSize: type.base, color: colors.onSurface },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
