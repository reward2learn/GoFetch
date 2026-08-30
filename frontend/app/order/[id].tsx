import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Modal, TextInput, Linking } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, Button, Card, Divider, colors, radius, spacing, type, usd, shadow, font } from "@/src/components/ui";
import { STATUS_STEPS, STATUS_STEP_LABEL, STATUS_LABEL, statusColor } from "@/src/constants";
import { api, fileUrl } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

export default function OrderDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [spotOpen, setSpotOpen] = useState(false);
  const [spotName, setSpotName] = useState("");
  const [spotAddress, setSpotAddress] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (e: any) {
      setErr(e.message || "");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (action: string, body?: any, key?: string) => {
    setErr("");
    setBusy(key || action);
    try {
      await api.post(`/orders/${id}/${action}`, body);
      await load();
    } catch (e: any) {
      setErr(e.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const uploadReceipt = async () => {
    setErr("");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr("Photo permission needed to upload the receipt.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy("purchased");
    try {
      const path = await api.uploadImage(res.assets[0].uri);
      await api.post(`/orders/${id}/purchased`, { receiptUrl: fileUrl(path) });
      await load();
    } catch (e: any) {
      setErr(e.message || "Upload failed.");
    } finally {
      setBusy(null);
    }
  };

  const saveSpot = async () => {
    if (!spotName.trim()) return;
    setBusy("spot");
    try {
      await api.post(`/orders/${id}/handoff-spot`, { name: spotName.trim(), address: spotAddress.trim() });
      setSpotOpen(false);
      setSpotName("");
      setSpotAddress("");
      await load();
    } catch (e: any) {
      setErr(e.message || "Could not save spot.");
    } finally {
      setBusy(null);
    }
  };

  const openMaps = (spot: any) => {
    const q = encodeURIComponent(`${spot.name} ${spot.address || ""}`.trim());
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  };

  if (loading || !order) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const asBuyer = order.buyerId === user?.id;
  const other = asBuyer ? order.traveler : order.buyer;
  const total = order.itemPrice + order.serviceFee;
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  const terminal = ["disputed", "cancelled", "rejected"].includes(order.status);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="order-back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <AppText weight="bold" size={type.lg}>Order</AppText>
        <Badge label={STATUS_LABEL[order.status]} tone={statusColor(order.status)} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
      >
        {/* Item */}
        <Card style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
          <Image source={{ uri: order.request?.image }} style={styles.thumb} contentFit="cover" />
          <View style={{ flex: 1, gap: 3 }}>
            <AppText weight="bold" numberOfLines={2}>{order.request?.title}</AppText>
            <AppText size={type.sm} color={colors.muted}>
              {order.request?.fromCountry} → {order.request?.toCountry}
            </AppText>
            <Badge label={asBuyer ? "You are buying" : "You are travelling"} tone={asBuyer ? "brand" : "success"} style={{ marginTop: 2 }} />
          </View>
        </Card>

        {/* Escrow summary */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.escrowHead}>
            <Ionicons name="lock-closed" size={16} color={colors.brandPrimary} />
            <AppText weight="bold">Escrow</AppText>
          </View>
          <Row label="Item price" value={usd(order.itemPrice)} />
          <Row label="Service fee" value={usd(order.serviceFee)} />
          <Row label="Traveller collateral" value={usd(order.stake)} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <Row label="Buyer locks" value={usd(total)} bold />
          {order.status === "completed" && (
            <Row label="Traveller payout" value={usd(order.payout)} bold color={colors.success} />
          )}
        </Card>

        {/* Timeline */}
        <Card style={{ marginTop: spacing.md }}>
          <AppText weight="bold" style={{ marginBottom: spacing.md }}>Journey</AppText>
          {STATUS_STEPS.map((s, i) => {
            const done = !terminal && currentIndex >= i;
            const active = !terminal && currentIndex === i;
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <View key={s} style={{ flexDirection: "row" }}>
                <View style={{ alignItems: "center" }}>
                  <View style={[styles.dot, done ? styles.dotDone : styles.dotIdle, active && styles.dotActive]}>
                    {done ? <Ionicons name="checkmark" size={13} color="#fff" /> : <View style={styles.dotInner} />}
                  </View>
                  {!isLast && <View style={[styles.line, done && currentIndex > i && { backgroundColor: colors.brandPrimary }]} />}
                </View>
                <View style={{ paddingBottom: isLast ? 0 : spacing.lg, paddingLeft: spacing.md, flex: 1 }}>
                  <AppText weight={active ? "bold" : "semibold"} color={done ? colors.onSurface : colors.muted}>
                    {STATUS_STEP_LABEL[s]}
                  </AppText>
                  {active && <AppText size={type.sm} color={colors.brandPrimary}>In progress</AppText>}
                </View>
              </View>
            );
          })}
          {terminal && (
            <Badge label={STATUS_LABEL[order.status]} tone={statusColor(order.status)} icon="alert-circle" style={{ marginTop: spacing.sm }} />
          )}
        </Card>

        {/* Receipt proof */}
        {order.receiptUrl && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
              <Ionicons name="receipt" size={16} color={colors.brandPrimary} />
              <AppText weight="bold">Store receipt (anchored)</AppText>
            </View>
            <Image source={{ uri: order.receiptUrl }} style={styles.receipt} contentFit="cover" />
            {!!order.receiptHash && (
              <AppText size={type.sm} color={colors.muted} numberOfLines={1} style={{ marginTop: 6 }}>
                #{order.receiptHash.slice(0, 24)}…
              </AppText>
            )}
          </Card>
        )}

        {/* Counterparty */}
        {other && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cpRow}>
              <Pressable testID="view-counterparty" onPress={() => router.push(`/user/${other.id}`)} style={styles.cpInfo}>
                <Avatar name={other.name} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppText weight="bold">{other.name}</AppText>
                    {other.kycStatus === "verified" && <Ionicons name="checkmark-circle" size={15} color={colors.brandPrimary} />}
                    {other.topTraveller && <Badge label="Top" tone="warning" icon="ribbon" />}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <AppText size={type.sm} color={colors.muted}>{other.reputation?.toFixed(1) ?? "—"} · {asBuyer ? "Traveller" : "Buyer"}</AppText>
                  </View>
                </View>
              </Pressable>
              <Pressable testID="open-chat-button" style={styles.chatBtn} onPress={() => router.push(`/chat/${id}`)}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.onBrandPrimary} />
              </Pressable>
            </View>
          </Card>
        )}

        {["funded", "purchased", "in_transit", "arrived", "completed"].includes(order.status) && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
              <Ionicons name="location" size={16} color={colors.brandPrimary} />
              <AppText weight="bold">Safe handoff spot</AppText>
            </View>
            {order.handoffSpot ? (
              <View>
                <View style={styles.spotRow}>
                  <View style={styles.spotPin}><Ionicons name="pin" size={18} color={colors.onBrandPrimary} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold">{order.handoffSpot.name}</AppText>
                    {!!order.handoffSpot.address && <AppText size={type.sm} color={colors.muted}>{order.handoffSpot.address}</AppText>}
                    <AppText size={type.sm} color={colors.muted}>Set by {order.handoffSpot.setByName}</AppText>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  <Button testID="open-maps-button" title="Open in Maps" variant="outline" icon="map" onPress={() => openMaps(order.handoffSpot)} style={{ flex: 1, height: 44 }} />
                  {order.status !== "completed" && (
                    <Button title="Change" variant="outline" icon="create-outline" onPress={() => setSpotOpen(true)} style={{ flex: 1, height: 44 }} />
                  )}
                </View>
              </View>
            ) : (
              <>
                <AppText size={type.sm} color={colors.muted} style={{ marginBottom: spacing.md, lineHeight: 19 }}>
                  Meet in a busy public place. Pick a spot you both know for a safe hand-over.
                </AppText>
                <Button testID="set-spot-button" title="Set safe meeting spot" icon="location" variant="secondary" onPress={() => setSpotOpen(true)} />
              </>
            )}
          </Card>
        )}

        {!!err && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.md, textAlign: "center" }}>{err}</AppText>}

        {/* Secondary actions */}
        {!terminal && order.status !== "completed" && (
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            {["funded", "purchased", "in_transit", "arrived"].includes(order.status) && (
              <Button title="Dispute" variant="outline" icon="flag" onPress={() => router.push(`/dispute/${id}`)} style={{ flex: 1, height: 46 }} />
            )}
            {["offered", "agreed"].includes(order.status) && (
              <Button title="Cancel" variant="outline" icon="close" onPress={() => act("cancel", undefined, "cancel")} loading={busy === "cancel"} style={{ flex: 1, height: 46 }} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Primary action bar */}
      <ActionBar
        order={order}
        asBuyer={asBuyer}
        busy={busy}
        insetsBottom={insets.bottom}
        onFund={() => act("fund", undefined, "fund")}
        onStake={() => act("stake", undefined, "stake")}
        onPurchased={uploadReceipt}
        onTransit={() => act("transit", undefined, "transit")}
        onArrived={() => act("arrived", undefined, "arrived")}
        onShowQR={() => router.push(`/qr/${id}`)}
        onScan={() => router.push(`/scan/${id}`)}
        onConfirm={() => act("confirm", undefined, "confirm")}
        onRespond={(action) => act("respond", { action }, "respond")}
        onReview={() => router.push(`/review/${id}`)}
      />

      <Modal visible={spotOpen} transparent animationType="slide" onRequestClose={() => setSpotOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setSpotOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <AppText weight="bold" size={type.lg}>Safe meeting spot</AppText>
            <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4, marginBottom: spacing.md }}>
              Pick a suggested public place or enter your own.
            </AppText>
            <View style={styles.spotChips}>
              {["Shopping mall concierge", "Airport arrivals point", "Police station lobby", "Major transit station", "Hotel lobby", "Busy cafe"].map((s) => (
                <Pressable key={s} testID={`spot-chip-${s}`} onPress={() => setSpotName(s)} style={[styles.spotChip, spotName === s && styles.spotChipActive]}>
                  <AppText size={type.sm} weight="semibold" color={spotName === s ? colors.onBrandPrimary : colors.onSurfaceTertiary}>{s}</AppText>
                </Pressable>
              ))}
            </View>
            <TextInput testID="spot-name-input" placeholder="Place name" placeholderTextColor={colors.muted} value={spotName} onChangeText={setSpotName} style={styles.spotInput} />
            <TextInput testID="spot-address-input" placeholder="Address / area (optional)" placeholderTextColor={colors.muted} value={spotAddress} onChangeText={setSpotAddress} style={styles.spotInput} />
            <Button testID="save-spot-button" title="Save meeting spot" icon="location" onPress={saveSpot} loading={busy === "spot"} style={{ marginTop: spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ActionBar(props: any) {
  const { order, asBuyer, busy, insetsBottom } = props;
  const s = order.status;
  let content: React.ReactNode = null;

  if (s === "offered") {
    content = asBuyer ? (
      <View style={{ flexDirection: "row", gap: spacing.sm, flex: 1 }}>
        <Button title="Decline" variant="outline" onPress={() => props.onRespond("reject")} style={{ flex: 1 }} />
        <Button testID="accept-offer-button" title="Accept offer" onPress={() => props.onRespond("accept")} loading={busy === "respond"} style={{ flex: 1.4 }} />
      </View>
    ) : <Waiting text="Waiting for buyer to accept your offer" />;
  } else if (s === "agreed") {
    if (asBuyer) {
      content = order.buyerFunded
        ? <Waiting text="Waiting for traveller to stake collateral" />
        : <Button testID="fund-escrow-button" title={`Fund escrow · ${usd(order.itemPrice + order.serviceFee)}`} icon="lock-closed" onPress={props.onFund} loading={busy === "fund"} style={{ flex: 1 }} />;
    } else {
      content = order.travelerStaked
        ? <Waiting text="Waiting for buyer to fund escrow" />
        : <Button testID="stake-button" title={`Stake collateral · ${usd(order.stake)}`} icon="shield" onPress={props.onStake} loading={busy === "stake"} style={{ flex: 1 }} />;
    }
  } else if (s === "funded") {
    content = asBuyer ? <Waiting text="Traveller is buying your item" /> :
      <Button testID="mark-purchased-button" title="Upload receipt · Mark purchased" icon="receipt" onPress={props.onPurchased} loading={busy === "purchased"} style={{ flex: 1 }} />;
  } else if (s === "purchased") {
    content = asBuyer ? <Waiting text="Item purchased — awaiting departure" /> :
      <Button testID="mark-transit-button" title="Mark in transit" icon="airplane" onPress={props.onTransit} loading={busy === "transit"} style={{ flex: 1 }} />;
  } else if (s === "in_transit") {
    content = asBuyer ? <Waiting text="Your item is on its way" /> :
      <Button testID="mark-arrived-button" title="Mark arrived" icon="checkmark-done" onPress={props.onArrived} loading={busy === "arrived"} style={{ flex: 1 }} />;
  } else if (s === "arrived") {
    content = asBuyer ? (
      <Button testID="show-qr-button" title="Show handoff QR" icon="qr-code" onPress={props.onShowQR} style={{ flex: 1 }} />
    ) : (
      <Button testID="scan-qr-button" title="Scan buyer's QR" icon="scan" onPress={props.onScan} style={{ flex: 1 }} />
    );
  } else if (s === "completed") {
    content = <Button testID="leave-review-button" title="Leave a review" icon="star" variant="secondary" onPress={props.onReview} style={{ flex: 1 }} />;
  } else {
    return null;
  }

  return (
    <View style={[styles.footer, { paddingBottom: insetsBottom + spacing.md }]}>
      {content}
    </View>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <View style={styles.waiting}>
      <Ionicons name="time-outline" size={18} color={colors.muted} />
      <AppText color={colors.muted} size={type.sm} style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.sumRow}>
      <AppText color={colors.muted} size={type.base}>{label}</AppText>
      <AppText weight={bold ? "bold" : "semibold"} color={color || colors.onSurface}>{value}</AppText>
    </View>
  );
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
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  escrowHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dotIdle: { backgroundColor: colors.surfaceTertiary, borderWidth: 1.5, borderColor: colors.borderStrong },
  dotDone: { backgroundColor: colors.brandPrimary },
  dotActive: { backgroundColor: colors.brandSecondary },
  dotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.muted },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  receipt: { width: "100%", height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  cpRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cpInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  spotRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  spotPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  spotChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  spotChip: { paddingHorizontal: spacing.md, height: 38, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border },
  spotChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  spotInput: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.sm,
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
  chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  waiting: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 54,
  },
});
