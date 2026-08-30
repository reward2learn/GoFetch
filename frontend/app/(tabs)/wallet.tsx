import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, TextInput, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { AppText, Button, Badge, Divider, colors, radius, spacing, type, font, usd, shadow } from "@/src/components/ui";
import { api } from "@/src/api/client";

const TX_META: Record<string, { icon: string; label: string; positive: boolean }> = {
  deposit: { icon: "arrow-down-circle", label: "Deposit", positive: true },
  escrow_lock: { icon: "lock-closed", label: "Locked in escrow", positive: false },
  escrow_release: { icon: "checkmark-circle", label: "Payout received", positive: true },
  escrow_refund: { icon: "return-down-back", label: "Escrow refunded", positive: true },
  stake_lock: { icon: "shield", label: "Collateral staked", positive: false },
  stake_return: { icon: "shield-checkmark", label: "Collateral returned", positive: true },
  stake_slash: { icon: "warning", label: "Collateral slashed", positive: false },
  stake_comp: { icon: "gift", label: "Compensation", positive: true },
  platform_fee: { icon: "business", label: "Platform fee", positive: false },
};

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [chain, setChain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("500");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, c] = await Promise.all([api.get("/wallet"), api.get("/chain/config")]);
      setData(w);
      setChain(c);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const deposit = async () => {
    setBusy(true);
    try {
      await api.post("/wallet/deposit", { amount: parseFloat(amount) || 0 });
      setDepositOpen(false);
      await load();
    } catch {} finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centerFill]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const short = data?.walletAddress ? `${data.walletAddress.slice(0, 6)}…${data.walletAddress.slice(-4)}` : "";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing["3xl"] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brandPrimary} />}
      >
        <AppText weight="extrabold" size={type["2xl"]} style={{ marginBottom: spacing.md }}>
          Wallet
        </AppText>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balTop}>
            <View style={styles.usdcChip}>
              <Ionicons name="ellipse" size={14} color="#2775CA" />
              <AppText weight="semibold" size={type.sm} color="#fff">USDC</AppText>
            </View>
            <View style={styles.addrChip}>
              <Ionicons name="wallet-outline" size={12} color="rgba(255,255,255,0.8)" />
              <AppText size={type.sm} color="rgba(255,255,255,0.85)">{short}</AppText>
            </View>
          </View>
          <AppText color="rgba(255,255,255,0.75)" size={type.sm} style={{ marginTop: spacing.lg }}>
            Available balance
          </AppText>
          <AppText weight="extrabold" size={40} color="#fff" testID="wallet-balance">
            {usd(data?.balance)}
          </AppText>
          <View style={styles.lockedRow}>
            <Ionicons name="lock-closed" size={13} color={colors.warning} />
            <AppText size={type.sm} color="rgba(255,255,255,0.9)">
              {usd(data?.locked)} locked in escrow
            </AppText>
          </View>
          <View style={styles.actionRow}>
            <Pressable testID="deposit-button" style={styles.balAction} onPress={() => setDepositOpen(true)}>
              <Ionicons name="add" size={18} color={colors.brandPrimary} />
              <AppText weight="semibold" color={colors.brandPrimary}>Add USDC</AppText>
            </Pressable>
            <Pressable style={[styles.balAction, styles.balActionGhost]} onPress={load}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <AppText weight="semibold" color="#fff">Refresh</AppText>
            </Pressable>
          </View>
        </View>

        {/* Chain banner */}
        <View style={styles.chainBanner}>
          <Ionicons name={chain?.live ? "shield-checkmark" : "flask"} size={18} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={type.sm}>
              {chain?.live ? `Live on ${chain?.chainName}` : "Managed escrow (test mode)"}
            </AppText>
            <AppText size={type.sm} color={colors.muted}>
              {chain?.live
                ? "Funds settle via on-chain USDC smart contract."
                : `On-chain USDC (${chain?.chainName}) activates in the native build.`}
            </AppText>
          </View>
        </View>

        {/* Transactions */}
        <AppText weight="bold" size={type.lg} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          Activity
        </AppText>
        <View style={styles.txCard}>
          {(!data?.transactions || data.transactions.length === 0) ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <Ionicons name="receipt-outline" size={28} color={colors.muted} />
              <AppText color={colors.muted} style={{ marginTop: 6 }}>No transactions yet</AppText>
            </View>
          ) : (
            data.transactions.map((t: any, idx: number) => {
              const meta = TX_META[t.type] || { icon: "swap-horizontal", label: t.type, positive: t.amount >= 0 };
              return (
                <View key={t.id}>
                  {idx > 0 && <Divider />}
                  <View style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: meta.positive ? "#E1F0E8" : colors.surfaceTertiary }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.positive ? colors.success : colors.onSurfaceTertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" size={type.base}>{meta.label}</AppText>
                      <AppText size={type.sm} color={colors.muted} numberOfLines={1}>{t.note}</AppText>
                    </View>
                    <AppText weight="bold" color={t.amount >= 0 ? colors.success : colors.onSurface}>
                      {t.amount >= 0 ? "+" : "−"}{usd(Math.abs(t.amount))}
                    </AppText>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Deposit modal */}
      <Modal visible={depositOpen} transparent animationType="slide" onRequestClose={() => setDepositOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setDepositOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <AppText weight="bold" size={type.lg}>Add test USDC</AppText>
            <AppText size={type.sm} color={colors.muted} style={{ marginTop: 4, marginBottom: spacing.md }}>
              This faucet tops up your balance so you can try the escrow flow. On the live network you'd deposit real USDC.
            </AppText>
            <View style={styles.amountWrap}>
              <AppText weight="bold" size={type["2xl"]} color={colors.muted}>$</AppText>
              <TextInput
                testID="deposit-amount-input"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            </View>
            <View style={styles.presetRow}>
              {["100", "500", "1000"].map((p) => (
                <Pressable key={p} style={styles.preset} onPress={() => setAmount(p)}>
                  <AppText weight="semibold" color={colors.brandPrimary}>${p}</AppText>
                </Pressable>
              ))}
            </View>
            <Button testID="confirm-deposit-button" title="Add to wallet" onPress={deposit} loading={busy} icon="add-circle" style={{ marginTop: spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  centerFill: { alignItems: "center", justifyContent: "center" },
  balanceCard: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.card,
  },
  balTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  usdcChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  addrChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  lockedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  balAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    height: 46,
    borderRadius: radius.md,
  },
  balActionGhost: { backgroundColor: "rgba(255,255,255,0.14)" },
  chainBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  txCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
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
  amountInput: { fontFamily: font.extrabold, fontSize: 34, color: colors.onSurface, minWidth: 120, textAlign: "center" },
  presetRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  preset: { flex: 1, alignItems: "center", paddingVertical: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md },
});
