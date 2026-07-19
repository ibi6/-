import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Send, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/theme';
import {
  useChatStore,
  useNutritionStore,
  useWorkoutStore,
  useSubscriptionStore,
} from '@/stores';
import type { AIAction, AIRecommendationCardData, ChatMessage } from '@/types';
import { AppConfig } from '@/constants';

const SUGGESTIONS = [
  '今天训练怎么安排？',
  '帮我看看蛋白质够不够',
  '减脂期晚餐吃什么',
  '深蹲膝盖有点不适怎么办',
  '火锅怎么记饮食',
];

export default function AITab() {
  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const error = useChatStore((s) => s.error);
  const send = useChatStore((s) => s.send);
  const clearChat = useChatStore((s) => s.clearChat);
  const remainingQuota = useChatStore((s) => s.remainingQuota);
  const canSend = useChatStore((s) => s.canSend);
  const addFoodToMeal = useNutritionStore((s) => s.addFoodToMeal);
  const startTodayWorkout = useWorkoutStore((s) => s.startTodayWorkout);
  const isPro = useSubscriptionStore((s) => s.isActive);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const quota = remainingQuota();

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isThinking]);

  const onSend = async (content?: string) => {
    const t = (content ?? text).trim();
    if (!t || sending) return;
    if (!canSend() && !isPro) {
      router.push('/subscription');
      return;
    }
    setText('');
    setSending(true);
    try {
      await send(t);
    } finally {
      setSending(false);
    }
  };

  const onAction = async (action: AIAction) => {
    switch (action.type) {
      case 'navigate': {
        const path = String(action.payload?.path ?? '/(tabs)');
        router.push(path as never);
        break;
      }
      case 'add_food': {
        const foodId = String(action.payload?.foodId ?? '');
        const weightG = Number(action.payload?.weightG ?? 100);
        const mealType = (action.payload?.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack') ?? 'lunch';
        if (foodId) {
          await addFoodToMeal({ mealType, foodId, weightG });
          router.push('/(tabs)/nutrition');
        }
        break;
      }
      case 'start_workout': {
        await startTodayWorkout();
        router.push('/workout/session');
        break;
      }
      case 'apply_plan':
        router.push('/(tabs)/workout');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI 教练</Text>
          <Text style={styles.sub}>
            今日剩余 {isPro ? '无限' : `${quota}/${AppConfig.freeAiMessagesPerDay}`} 次
            {isPro ? ' · Pro' : ''}
          </Text>
        </View>
        <Pressable onPress={clearChat} hitSlop={8} style={styles.clearBtn}>
          <Trash2 size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            messages.length === 0 ? (
              <View style={styles.welcome}>
                <Text style={styles.welcomeTitle}>你好，我是 FitAI</Text>
                <Text style={styles.welcomeBody}>
                  可以问训练、饮食、恢复相关问题。以下为模拟回复，不构成医疗建议。
                </Text>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable key={s} style={styles.chip} onPress={() => void onSend(s)}>
                      <Text style={styles.chipText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => <MessageBubble msg={item} onAction={onAction} />}
          ListFooterComponent={
            isThinking ? (
              <View style={styles.thinking}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.thinkingText}>思考中…</Text>
              </View>
            ) : null
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="问点什么…"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={() => void onSend()}
            disabled={!text.trim() || sending}
          >
            <Send size={18} color={Colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  msg,
  onAction,
}: {
  msg: ChatMessage;
  onAction: (a: AIAction) => void;
}) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : isSystem ? styles.bubbleSystem : styles.bubbleAi,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{msg.text}</Text>
        {msg.disclaimer ? <Text style={styles.disclaimer}>{msg.disclaimer}</Text> : null}
      </View>
      {msg.cards?.map((c) => (
        <RecoCard key={c.id} card={c} />
      ))}
      {msg.actions && msg.actions.length > 0 ? (
        <View style={styles.actions}>
          {msg.actions.map((a) => (
            <Button
              key={a.id}
              title={a.label}
              size="sm"
              variant={a.type === 'dismiss' ? 'ghost' : 'soft'}
              onPress={() => onAction(a)}
              fullWidth={false}
              style={styles.actionBtn}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RecoCard({ card }: { card: AIRecommendationCardData }) {
  const tone =
    card.type === 'warning'
      ? Colors.danger
      : card.type === 'meal'
        ? Colors.orange
        : card.type === 'workout'
          ? Colors.primary
          : Colors.blue;
  return (
    <Card style={[styles.reco, { borderLeftColor: tone, borderLeftWidth: 3 }]}>
      <Text style={styles.recoTitle}>{card.title}</Text>
      {card.subtitle ? <Text style={styles.recoSub}>{card.subtitle}</Text> : null}
      <Text style={styles.recoBody}>{card.body}</Text>
      {card.metrics?.length ? (
        <View style={styles.metrics}>
          {card.metrics.map((m) => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.metricVal}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h2 },
  sub: { ...Typography.caption, marginTop: 2 },
  clearBtn: { padding: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  welcome: { paddingVertical: Spacing.xxl },
  welcomeTitle: { ...Typography.h2, marginBottom: Spacing.sm },
  welcomeBody: { ...Typography.caption, marginBottom: Spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipText: { ...Typography.captionMedium, color: Colors.primary },
  bubbleWrap: { marginBottom: Spacing.md, alignItems: 'flex-start', maxWidth: '92%' },
  bubbleWrapUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    maxWidth: '100%',
  },
  bubbleUser: { backgroundColor: Colors.primary },
  bubbleAi: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  bubbleSystem: { backgroundColor: Colors.primarySoft },
  bubbleText: { ...Typography.body },
  bubbleTextUser: { color: Colors.white },
  disclaimer: { ...Typography.label, marginTop: Spacing.sm, fontStyle: 'italic' },
  reco: { marginTop: Spacing.sm, width: '100%' },
  recoTitle: { ...Typography.bodyMedium },
  recoSub: { ...Typography.caption, marginTop: 2 },
  recoBody: { ...Typography.caption, marginTop: Spacing.sm, color: Colors.textPrimary },
  metrics: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.lg },
  metric: { alignItems: 'center' },
  metricVal: { ...Typography.captionMedium, color: Colors.primary },
  metricLabel: { ...Typography.label },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { paddingHorizontal: Spacing.lg },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  thinkingText: { ...Typography.caption },
  error: { ...Typography.caption, color: Colors.danger, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
