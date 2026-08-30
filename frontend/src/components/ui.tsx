import React from "react";
import {
  Text,
  TextProps,
  View,
  ViewProps,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, spacing, type, shadow } from "@/src/theme/theme";

export function AppText(
  props: TextProps & { weight?: keyof typeof font; size?: number; color?: string }
) {
  const { style, weight = "regular", size = type.base, color = colors.onSurface, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[{ fontFamily: font[weight], fontSize: size, color }, style]}
    />
  );
}

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
      ? colors.brandSecondary
      : variant === "danger"
      ? colors.error
      : "transparent";
  const fg =
    variant === "outline" || variant === "ghost" ? colors.brandPrimary : colors.onBrandPrimary;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.brandPrimary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={{ fontFamily: font.semibold, fontSize: type.lg, color: fg }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const badgeColors: Record<string, { bg: string; fg: string }> = {
  brand: { bg: colors.brandTertiary, fg: colors.brandPrimary },
  success: { bg: "#E1F0E8", fg: colors.success },
  warning: { bg: "#FCEBD4", fg: "#9A6516" },
  error: { bg: "#F9E0DD", fg: colors.error },
  muted: { bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary },
};

export function Badge({
  label,
  tone = "brand",
  icon,
  style,
}: {
  label: string;
  tone?: keyof typeof badgeColors;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const c = badgeColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      {icon && <Ionicons name={icon} size={12} color={c.fg} />}
      <Text style={{ fontFamily: font.semibold, fontSize: type.sm, color: c.fg }}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, uri, size = 40 }: { name?: string; uri?: string | null; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brandTertiary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: font.bold, color: colors.brandPrimary, fontSize: size * 0.38 }}>
        {initials}
      </Text>
    </View>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={value >= i ? "star" : value >= i - 0.5 ? "star-half" : "star-outline"}
          size={size}
          color={colors.warning}
        />
      ))}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.divider }, style]} />;
}

export function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
  testID,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  testID?: string;
}) {
  return (
    <View style={styles.empty} testID={testID}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.brandPrimary} />
      </View>
      <AppText weight="bold" size={type.lg} style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {subtitle && (
        <AppText color={colors.muted} style={{ textAlign: "center", marginTop: 4, lineHeight: 20 }}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

export function usd(n?: number): string {
  const v = Number(n || 0);
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Row({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center" }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing["3xl"], paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});

export { colors, font, radius, spacing, type, shadow };
export type { StyleProp, ViewStyle, TextStyle };
