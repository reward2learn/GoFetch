import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppText, colors, radius, spacing, type, font } from "@/src/components/ui";
import { STATUS_LABEL } from "@/src/constants";
import { api, fileUrl } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";

export default function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadOrder = useCallback(async () => {
    try {
      setOrder(await api.get(`/orders/${id}`));
    } catch {}
  }, [id]);

  const loadMsgs = useCallback(async () => {
    try {
      const m = await api.get(`/orders/${id}/messages`);
      setMessages(m);
    } catch {}
  }, [id]);

  useEffect(() => {
    loadOrder();
    loadMsgs();
    const t = setInterval(loadMsgs, 3000);
    return () => clearInterval(t);
  }, [loadOrder, loadMsgs]);

  const send = async (imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    const body = { text: text.trim(), imageUrl: imageUrl || null };
    setText("");
    setSending(true);
    try {
      await api.post(`/orders/${id}/messages`, body);
      await loadMsgs();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {} finally {
      setSending(false);
    }
  };

  const attach = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    setSending(true);
    try {
      const path = await api.uploadImage(res.assets[0].uri);
      await send(fileUrl(path));
    } catch {} finally {
      setSending(false);
    }
  };

  const other = order ? (order.buyerId === user?.id ? order.traveler : order.buyer) : null;

  const renderMsg = ({ item }: { item: any }) => {
    const mine = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleRow, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.msgImg} contentFit="cover" />
          )}
          {!!item.text && (
            <AppText color={mine ? "#fff" : colors.onSurface} style={{ lineHeight: 20 }}>
              {item.text}
            </AppText>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="chat-back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText weight="bold" size={type.lg} numberOfLines={1}>{other?.name || "Chat"}</AppText>
          <AppText size={type.sm} color={colors.muted} numberOfLines={1}>{order?.request?.title}</AppText>
        </View>
        <Pressable onPress={() => router.push(`/order/${id}`)} hitSlop={10}>
          <Ionicons name="information-circle-outline" size={24} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {order && (
        <View style={styles.escrowBanner}>
          <Ionicons name="lock-closed" size={14} color={colors.brandPrimary} />
          <AppText size={type.sm} color={colors.brandPrimary} weight="semibold">
            {["funded", "purchased", "in_transit", "arrived"].includes(order.status)
              ? "USDC locked in escrow"
              : STATUS_LABEL[order.status]}
          </AppText>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1, justifyContent: messages.length ? "flex-end" : "center" }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: "center" }}>
              <Ionicons name="chatbubbles-outline" size={34} color={colors.muted} />
              <AppText color={colors.muted} style={{ marginTop: 6 }}>Arrange the handoff here</AppText>
            </View>
          }
        />
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable testID="attach-button" onPress={attach} hitSlop={8} style={styles.attach}>
            <Ionicons name="image-outline" size={22} color={colors.brandPrimary} />
          </Pressable>
          <TextInput
            testID="chat-input"
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            style={styles.input}
            multiline
          />
          <Pressable testID="send-button" onPress={() => send()} disabled={sending} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  escrowBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brandTertiary,
    paddingVertical: 8,
  },
  bubbleRow: { flexDirection: "row" },
  bubble: { maxWidth: "78%", borderRadius: radius.lg, padding: spacing.md },
  bubbleMine: { backgroundColor: colors.brandPrimary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surfaceSecondary, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  msgImg: { width: 200, height: 150, borderRadius: radius.md, marginBottom: 6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  attach: { height: 44, justifyContent: "center" },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.onSurface,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
});
