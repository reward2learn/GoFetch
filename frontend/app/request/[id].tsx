import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { AppText, Avatar, Badge, Button, Card, Divider, colors, radius, spacing, type, font, usd, shadow } from "@/src/components/ui";
import { STATUS_LABEL, statusColor } from "@/src/constants";
import { formatRoute } from "@/src/locations";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

export default function RequestDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [req, setReq] = useState<any>(null);
  const [avail, setAvail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.get(`/requests/${id}`);
      setReq(data);
      setFee(String(data.reward));
      api.get(`/requests/${id}/availability`).then(setAvail).catch(() => {});
    } catch {}
    finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitOffer = async () => {
    setError("");
    setBusy(true);
    try {
      const order = await api.post("/orders/accept", { requestId: id, proposedFee: parseFloat(fee) || req.reward, note });
      setAccepting(false);
      router.replace(`/order/${order.id}`);
    } catch (e: any) {
      setError(e.message || "Could not accept.");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (orderId: string, action: "accept" | "reject") => {
    try {
      const order = await api.post(`/orders/${orderId}/respond`, { action });
      if (action === "accept") router.replace(`/order/${order.id}`);
      else load();
    } catch {}
  };

  if (loading || !req) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const isOwner = req.buyerId === user?.id;
  const stake = Math.round(req.itemPrice * 0.15 * 100) / 100;
  const pendingOffers = (req.offers || []).filter((o: any) => o.status === "offered");

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: req.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(28,28,30,0.35)", "transparent", "rgba(28,28,30,0.85)"]} style={StyleSheet.absoluteFill} />
          <Pressable testID="back-button" onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + spacing.sm }]}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroBottom}>
            <Badge label={req.category} tone="brand" icon="pricetag" />
            <AppText weight="extrabold" size={type["2xl"]} color="#fff" style={{ marginTop: spacing.sm }}>
              {req.title}
            </AppText>
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {/* Reward highlight */}
          <View style={styles.rewardCard}>
            <View>
              <AppText size={type.sm} color="rgba(255,255,255,0.8)">Traveller reward</AppText>
              <AppText weight="extrabold" size={type["2xl"]} color="#fff">{usd(req.reward)}</AppText>
            </View>
            <View style={styles.divVert} />
            <View>
              <AppText size={type.sm} color="rgba(255,255,255,0.8)">Item price</AppText>
              <AppText weight="bold" size={type.lg} color="#fff">{usd(req.itemPrice)}</AppText>
            </View>
          </View>

          {/* Route */}
          <Card>
            <View style={styles.routeRow}>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Ionicons name="storefront" size={20} color={colors.brandPrimary} />
                <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4 }}>Buy from</AppText>
                <AppText weight="bold" style={{ textAlign: "center" }}>{formatRoute(req.fromCountry, req.fromCity)}</AppText>
              </View>
              <Ionicons name="airplane" size={20} color={colors.brandSecondary} />
              <View style={{ alignItems: "center", flex: 1 }}>
                <Ionicons name="location" size={20} color={colors.brandPrimary} />
                <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4 }}>Deliver to</AppText>
                <AppText weight="bold" style={{ textAlign: "center" }}>{formatRoute(req.toCountry, req.toCity)}</AppText>
              </View>
            </View>
          </Card>

          {avail && (
            <View testID="request-availability" style={styles.availCard}>
              <View style={styles.availIcon}>
                <Ionicons name="people" size={20} color={colors.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="bold">
                  {avail.total} {avail.total === 1 ? "traveller" : "travellers"} can deliver this
                </AppText>
                <AppText size={type.sm} color={colors.muted}>
                  {avail.planned} flying this route · {avail.past} delivered it before
                </AppText>
              </View>
            </View>
          )}

          {!!req.description && (
            <Card>
              <AppText weight="bold" style={{ marginBottom: 6 }}>Details</AppText>
              <AppText color={colors.onSurfaceTertiary} style={{ lineHeight: 21 }}>{req.description}</AppText>
            </Card>
          )}

          {/* Buyer trust */}
          <Pressable testID="view-buyer-profile" onPress={() => req.buyer && router.push(`/user/${req.buyer.id}`)}>
            <Card>
              <AppText weight="bold" style={{ marginBottom: spacing.sm }}>Requested by</AppText>
              <View style={styles.buyerRow}>
                <Avatar name={req.buyer?.name} size={46} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <AppText weight="bold" size={type.lg}>{req.buyer?.name}</AppText>
                    {req.buyer?.kycStatus === "verified" && <Ionicons name="checkmark-circle" size={16} color={colors.brandPrimary} />}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Ionicons name="star" size={13} color={colors.warning} />
                      <AppText size={type.sm} weight="semibold">{req.buyer?.reputation?.toFixed(1) ?? "—"}</AppText>
                    </View>
                    <AppText size={type.sm} color={colors.muted}>{req.buyer?.ordersCompleted} orders</AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </View>
            </Card>
          </Pressable>

          {/* Duty disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <AppText size={type.sm} color={colors.onSurfaceTertiary} style={{ flex: 1, lineHeight: 18 }}>
              Travellers must buy from a retail store, keep the itemised receipt, and declare goods at customs. Prohibited items are not allowed.
            </AppText>
          </View>

          {/* Owner: incoming offers */}
          {isOwner && (
            <View style={{ marginTop: spacing.sm }}>
              <AppText weight="bold" size={type.lg} style={{ marginBottom: spacing.sm }}>
                Offers ({pendingOffers.length})
              </AppText>
              {pendingOffers.length === 0 ? (
                <Card><AppText color={colors.muted} style={{ textAlign: "center" }}>No traveller offers yet</AppText></Card>
              ) : (
                pendingOffers.map((o: any) => (
                  <Card key={o.id} style={{ marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <AppText weight="semibold">Fee: {usd(o.proposedFee)}</AppText>
                      <Badge label={STATUS_LABEL[o.status]} tone={statusColor(o.status)} />
                    </View>
                    {!!o.note && <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4 }}>{o.note}</AppText>}
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                      <Button title="Decline" variant="outline" onPress={() => respond(o.id, "reject")} style={{ flex: 1, height: 44 }} />
                      <Button testID={`accept-offer-${o.id}`} title="Accept" onPress={() => respond(o.id, "accept")} style={{ flex: 1, height: 44 }} />
                    </View>
                  </Card>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      {!isOwner && req.status === "open" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <AppText size={type.sm} color={colors.muted}>You stake</AppText>
            <AppText weight="bold" color={colors.onSurface}>{usd(stake)} collateral</AppText>
          </View>
          <Button testID="accept-request-button" title="Accept & Offer" icon="airplane" onPress={() => setAccepting(true)} style={{ flex: 1.4 }} />
        </View>
      )}
      {isOwner && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Badge label="Your request" tone="muted" icon="person" />
          <View style={{ flex: 1 }} />
          <AppText color={colors.muted} size={type.sm}>Waiting for travellers</AppText>
        </View>
      )}

      {/* Offer sheet */}
      <Modal visible={accepting} transparent animationType="slide" onRequestClose={() => setAccepting(false)}>
        <Pressable style={styles.modalBg} onPress={() => setAccepting(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <AppText weight="bold" size={type.lg}>Make your offer</AppText>
            <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4 }}>
              Propose your service fee. You'll stake {usd(stake)} as collateral once the buyer agrees.
            </AppText>
            <AppText weight="semibold" size={type.sm} color={colors.onSurfaceTertiary} style={{ marginTop: spacing.lg, marginBottom: 6 }}>Your fee (USDC)</AppText>
            <View style={styles.amountWrap}>
              <AppText weight="bold" size={type.xl} color={colors.muted}>$</AppText>
              <TextInput testID="fee-input" value={fee} onChangeText={setFee} keyboardType="decimal-pad" style={styles.amountInput} />
            </View>
            <TextInput
              testID="offer-note-input"
              placeholder="Add a note (flight date, etc.)"
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
            />
            {!!error && <AppText color={colors.error} size={type.sm} style={{ marginTop: spacing.sm }}>{error}</AppText>}
            <Button testID="send-offer-button" title="Send offer" onPress={submitOffer} loading={busy} icon="send" style={{ marginTop: spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  hero: { height: 300, backgroundColor: colors.surfaceTertiary },
  backBtn: {
    position: "absolute",
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  divVert: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.25)" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  buyerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "#FDF6EC",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  availCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  availIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: "center", marginBottom: spacing.md },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  amountInput: { fontFamily: font.extrabold, fontSize: 30, color: colors.onSurface, minWidth: 100, textAlign: "center" },
  noteInput: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
});
