import React, { useCallback, useRef, useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Linking, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, Button, colors, radius, spacing, type, font } from "@/src/components/ui";
import { api } from "@/src/api/client";

export default function ScanQR() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(Platform.OS === "web");
  const lock = useRef(false);

  const submit = useCallback(async (code: string) => {
    if (lock.current) return;
    lock.current = true;
    setStatus("submitting");
    setErr("");
    try {
      await api.post(`/orders/${id}/complete`, { secret: code });
      setStatus("done");
      setTimeout(() => router.replace(`/order/${id}`), 900);
    } catch (e: any) {
      setErr(e.message || "Invalid code.");
      setStatus("error");
      lock.current = false;
    }
  }, [id, router]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable testID="scan-close" onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="close" size={26} color="#fff" />
      </Pressable>
      <AppText weight="bold" size={type.lg} color="#fff">Scan handoff QR</AppText>
      <View style={{ width: 26 }} />
    </View>
  );

  if (status === "done") {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.brandPrimary }]}>
        <Ionicons name="checkmark-circle" size={80} color="#fff" />
        <AppText weight="extrabold" size={type.xl} color="#fff" style={{ marginTop: spacing.md }}>
          Funds released!
        </AppText>
        <AppText color="rgba(255,255,255,0.85)" style={{ marginTop: 6 }}>Payout is on its way to your wallet.</AppText>
      </View>
    );
  }

  const canUseCamera = permission?.granted && Platform.OS !== "web";

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {canUseCamera && !showManual && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => submit(data)}
        />
      )}
      {header}

      {!canUseCamera && !showManual && (
        <View style={[styles.center, { flex: 1, padding: spacing.xl }]}>
          <Ionicons name="camera" size={48} color="#fff" />
          <AppText color="#fff" weight="bold" size={type.lg} style={{ marginTop: spacing.md, textAlign: "center" }}>
            Camera access needed
          </AppText>
          <AppText color="rgba(255,255,255,0.8)" style={{ marginTop: 6, textAlign: "center" }}>
            Scan the buyer's QR to release escrow after they confirm the item.
          </AppText>
          {permission && !permission.granted && permission.canAskAgain && (
            <Button title="Allow camera" icon="camera" onPress={requestPermission} style={{ marginTop: spacing.lg, alignSelf: "stretch" }} />
          )}
          {permission && !permission.granted && !permission.canAskAgain && (
            <Button title="Open settings" icon="settings-outline" onPress={() => Linking.openSettings()} style={{ marginTop: spacing.lg, alignSelf: "stretch" }} />
          )}
          <Pressable onPress={() => setShowManual(true)} style={{ marginTop: spacing.lg }}>
            <AppText color="#fff" weight="semibold">Enter code manually</AppText>
          </Pressable>
        </View>
      )}

      {canUseCamera && !showManual && (
        <>
          <View style={styles.frame} pointerEvents="none">
            <View style={styles.reticle} />
            <AppText color="#fff" style={{ marginTop: spacing.lg }}>Point at the buyer's QR code</AppText>
          </View>
          <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
            <Pressable onPress={() => setShowManual(true)}>
              <AppText color="#fff" weight="semibold">Enter code manually</AppText>
            </Pressable>
          </View>
        </>
      )}

      {showManual && (
        <View style={[styles.center, { flex: 1, padding: spacing.xl }]}>
          <Ionicons name="qr-code" size={44} color="#fff" />
          <AppText color="#fff" weight="bold" size={type.lg} style={{ marginTop: spacing.md }}>Enter handoff code</AppText>
          <AppText color="rgba(255,255,255,0.75)" size={type.sm} style={{ marginTop: 6, textAlign: "center" }}>
            Paste the code from the buyer's screen (format TRUSTMULE:…).
          </AppText>
          <TextInput
            testID="manual-code-input"
            value={manual}
            onChangeText={setManual}
            placeholder="TRUSTMULE:…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            style={styles.manualInput}
          />
          {!!err && <AppText color="#FF9C8A" size={type.sm} style={{ marginTop: spacing.sm }}>{err}</AppText>}
          <Button
            testID="submit-code-button"
            title="Release escrow"
            icon="lock-open"
            loading={status === "submitting"}
            onPress={() => submit(manual.trim())}
            style={{ marginTop: spacing.lg, alignSelf: "stretch" }}
          />
          {Platform.OS !== "web" && (
            <Pressable onPress={() => { setShowManual(false); setErr(""); }} style={{ marginTop: spacing.lg }}>
              <AppText color="#fff" weight="semibold">Use camera instead</AppText>
            </Pressable>
          )}
        </View>
      )}

      {!!err && !showManual && (
        <View style={[styles.errBar, { bottom: insets.bottom + 70 }]}>
          <AppText color="#fff">{err}</AppText>
          <Pressable onPress={() => { lock.current = false; setErr(""); setStatus("idle"); }}>
            <AppText color="#fff" weight="bold">Retry</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  frame: { flex: 1, alignItems: "center", justifyContent: "center" },
  reticle: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  bottom: { alignItems: "center", paddingTop: spacing.md },
  manualInput: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    color: "#fff",
    fontFamily: font.medium,
    fontSize: type.base,
  },
  errBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
