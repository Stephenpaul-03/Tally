// ============================================================
// TALLY - GuidedChat v2  (UI revamp)
// ============================================================

import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { financeDb } from "@/modules/Common/Repository/SQLiteRepo";
import { withOpacity } from "@/modules/Common/Utils/Helpers";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
    ChatMessage,
    ComparisonData,
    Option,
    PATH_OPTIONS,
    QueryState,
    ResultCard,
    buildComparisonCard,
    buildFollowUps,
    buildResultCard,
    formatINR,
    formatTransactionDate,
    getAvailableMonthOptions,
    getCategoryOptions,
    getGreeting,
    getTitleOptions,
    parseMonthValue,
    queryCategorySpend,
    queryPaymentsTo,
} from "./TallyQueryEngine";

// ============================================================
// PROPS
// ============================================================
interface GuidedChatProps {
  userName?: string;
}

// ============================================================
// COMPONENT
// ============================================================
export default function GuidedChat({ userName = "there" }: GuidedChatProps) {
  const db = financeDb;
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryState, setQueryState] = useState<QueryState>({
    step: "greeting",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pushBotMessage(getGreeting(userName), PATH_OPTIONS, "tile");
    setQueryState({ step: "select_path" });
  }, [userName]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  // ── Message helpers ──────────────────────────────────────

  function pushBotMessage(
    text: string,
    options?: Option[],
    optionStyle?: ChatMessage["optionStyle"],
    resultCard?: ResultCard,
  ) {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        from: "bot",
        text,
        options,
        optionStyle,
        resultCard,
      },
    ]);
  }

  function pushUserMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()) + "u", from: "user", text },
    ]);
  }

  // ── Reset ────────────────────────────────────────────────

  function resetChat() {
    setMessages([]);
    setQueryState({ step: "greeting" });
    pushBotMessage(getGreeting(userName), PATH_OPTIONS, "tile");
    setQueryState({ step: "select_path" });
  }

  // ── Run a query ──────────────────────────────────────────

  async function runQuery(
    state: QueryState,
  ): Promise<{ result: any; card: ResultCard }> {
    let result: any;
    let card: ResultCard;

    if (state.path === "title") {
      result = await queryPaymentsTo(
        db,
        state.title!,
        state.monthStr!,
        state.year!,
      );
      card = buildResultCard("title", state, result);
    } else {
      result = await queryCategorySpend(
        db,
        state.category_id!,
        state.monthStr!,
        state.year!,
      );
      card = buildResultCard("category", state, result);
    }

    return { result, card };
  }

  async function loadMonthOptions(
    state: QueryState,
    excludeValue?: string,
  ): Promise<Option[]> {
    return getAvailableMonthOptions(db, {
      title: state.path === "title" ? state.title : undefined,
      categoryId: state.path === "category" ? state.category_id : undefined,
      excludeValue,
    });
  }

  // ── Main flow handler ────────────────────────────────────

  async function handleOptionSelect(option: Option) {
    if (
      option.value !== "__view_all__" &&
      option.value !== "__compare__" &&
      option.value !== "__pick_month__" &&
      option.value !== "__reset__"
    ) {
      pushUserMessage(option.label);
    }
    setLoading(true);

    try {
      const state = queryState;

      if (state.step === "select_path") {
        const path = option.value as QueryState["path"];
        if (path === "title") {
          const titles = await getTitleOptions(db);
          pushBotMessage(
            "Who or what are you looking for?",
            titles,
            "search_list",
          );
          setQueryState({ step: "select_title", path });
        } else {
          const cats = await getCategoryOptions(db);
          pushBotMessage("Which category?", cats, "category_grid");
          setQueryState({ step: "select_category", path });
        }
        return;
      }

      if (state.step === "select_title") {
        const nextState = { ...state, title: option.value };
        const chips = await loadMonthOptions(nextState);
        pushBotMessage("Which month?", chips, "chip");
        setQueryState({ ...nextState, step: "select_month" });
        return;
      }

      if (state.step === "select_category") {
        const nextState = {
          ...state,
          category_id: parseInt(option.value),
          category_name: option.label,
        };
        const chips = await loadMonthOptions(nextState);
        pushBotMessage("Which month?", chips, "chip");
        setQueryState({ ...nextState, step: "select_month" });
        return;
      }

      if (state.step === "select_month") {
        const { year, monthStr } = parseMonthValue(option.value);
        const updatedState: QueryState = {
          ...state,
          year,
          monthStr,
          step: "result",
        };
        const { result, card } = await runQuery(updatedState);
        const followUps = buildFollowUps("result", result, updatedState.path);
        pushBotMessage("Here's what I found:", followUps, "actions", card);
        setQueryState({ ...updatedState, lastResult: result });
        return;
      }

      if (option.value === "__compare__") {
        const currentValue = `${queryState.year}-${queryState.monthStr}`;
        const chips = await loadMonthOptions(queryState, currentValue);
        pushBotMessage("Compare against which month?", chips, "chip");
        setQueryState({ ...queryState, step: "select_compare_month" });
        return;
      }

      if (state.step === "select_compare_month") {
        const { year: prevYear, monthStr: prevMonthStr } = parseMonthValue(
          option.value,
        );
        const thisResult = queryState.lastResult;
        let prevResult: any;

        if (state.path === "title") {
          prevResult = await queryPaymentsTo(
            db,
            state.title!,
            prevMonthStr,
            prevYear,
          );
        } else {
          prevResult = await queryCategorySpend(
            db,
            state.category_id!,
            prevMonthStr,
            prevYear,
          );
        }

        const compCard = buildComparisonCard(
          state.path ?? "category",
          state,
          thisResult,
          prevResult,
          prevYear,
          prevMonthStr,
        );

        const followUps = buildFollowUps(
          "result_comparison",
          queryState.lastResult,
          state.path,
        );
        pushBotMessage(
          "Here's the comparison:",
          followUps,
          "actions",
          compCard,
        );
        setQueryState({ ...state, step: "result_comparison" });
        return;
      }

      if (option.value === "__pick_month__") {
        const currentValue = `${queryState.year}-${queryState.monthStr}`;
        const chips = await loadMonthOptions(queryState, currentValue);
        pushBotMessage("Which month?", chips, "chip");
        setQueryState({ ...queryState, step: "select_month" });
        return;
      }

      if (option.value === "__view_all__") {
        const txns = queryState.lastResult?.transactions ?? [];
        if (txns.length === 0) {
          pushBotMessage(
            "No transactions to show.",
            buildFollowUps("result_breakdown", null, queryState.path),
            "actions",
          );
          return;
        }

        const followUps = buildFollowUps(
          "result_breakdown",
          queryState.lastResult,
          queryState.path,
        );
        pushBotMessage(
          `Here are the ${txns.length} transactions:`,
          followUps,
          "actions",
          {
            kind: "breakdown",
            amount: "",
            label: "",
            sublabel: "",
            transactions: txns.map((t: any) => ({
              title: t.title,
              amount: formatINR(t.amount),
              date: t.date ? formatTransactionDate(t.date) : "",
              account: t.account ?? "",
            })),
          },
        );
        setQueryState({ ...queryState, step: "result_breakdown" });
        return;
      }

      if (option.value === "__reset__") {
        resetChat();
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────

  const lastMsgId = messages[messages.length - 1]?.id;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.headerTitle,
              typography.editorial.sectionLabel,
              { color: theme.colors.primary },
            ]}
          >
            ASK TALLY
          </Text>
          <View
            style={[
              styles.betaPill,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="flask-outline"
              size={11}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.betaPillText, { color: theme.colors.primary }]}
            >
              Beta
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={resetChat}
          style={[
            styles.resetBtn,
            {
              borderColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.elevation.level1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={13}
            color={theme.colors.onSurfaceVariant}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[styles.resetText, { color: theme.colors.onSurfaceVariant }]}
          >
            Start over
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, index) => (
          <View key={msg.id} style={styles.messageGroup}>
            {/* Sender label — only on first bot message in a run */}
            {msg.from === "bot" &&
              (index === 0 || messages[index - 1]?.from !== "bot") && (
                <Text
                  style={[styles.senderLabel, { color: theme.colors.primary }]}
                >
                  TALLY
                </Text>
              )}

            {/* Bubble */}
            <View
              style={[
                styles.bubble,
                msg.from === "bot"
                  ? [
                      styles.botBubble,
                      {
                        backgroundColor: theme.colors.elevation.level2,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]
                  : [
                      styles.userBubble,
                      {
                        backgroundColor: theme.colors.secondaryContainer,
                        borderColor: theme.colors.secondary,
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color:
                      msg.from === "user"
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurface,
                  },
                ]}
              >
                {msg.text}
              </Text>
            </View>

            {/* Result card */}
            {msg.resultCard && (
              <ResultCardView card={msg.resultCard} theme={theme} />
            )}

            {/* Options — only on last message */}
            {msg.options && msg.id === lastMsgId && (
              <OptionsView
                options={msg.options}
                style={msg.optionStyle ?? "list"}
                theme={theme}
                minimalIconsEnabled={minimalIconsEnabled}
                onSelect={handleOptionSelect}
              />
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <View
              style={[
                styles.loadingDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Looking that up…
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// RESULT CARD
// ============================================================
function ResultCardView({ card, theme }: { card: ResultCard; theme: any }) {
  if (card.kind === "comparison" && card.comparison) {
    return <ComparisonCardView data={card.comparison} theme={theme} />;
  }

  const hasTransactions = card.transactions && card.transactions.length > 0;

  return (
    <View
      style={[
        styles.resultCard,
        {
          backgroundColor: theme.colors.elevation.level2,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {card.amount ? (
        <View style={styles.resultHeader}>
          <View
            style={[
              styles.resultAccentBar,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          <View style={styles.resultHeaderText}>
            <Text
              style={[styles.resultAmount, { color: theme.colors.primary }]}
            >
              {card.amount}
            </Text>
            <Text
              style={[styles.resultLabel, { color: theme.colors.onSurface }]}
            >
              {card.label}
            </Text>
            {card.sublabel ? (
              <Text
                style={[
                  styles.resultSublabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {card.sublabel}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {hasTransactions && (
        <View
          style={[
            styles.txnList,
            card.amount ? styles.txnListWithBorder : null,
            card.amount
              ? { borderTopColor: theme.colors.outlineVariant }
              : null,
          ]}
        >
          {card.transactions!.map((t, i) => (
            <View
              key={i}
              style={[
                styles.txnRow,
                i < card.transactions!.length - 1 && styles.txnRowBorder,
                i < card.transactions!.length - 1 && {
                  borderBottomColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.txnLeft}>
                <Text
                  style={[styles.txnTitle, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
                <Text
                  style={[
                    styles.txnMeta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t.date}
                  {t.account ? ` · ${t.account}` : ""}
                </Text>
              </View>
              <Text
                style={[styles.txnAmount, { color: theme.colors.onSurface }]}
              >
                {t.amount}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================
// COMPARISON CARD
// ============================================================
function ComparisonCardView({
  data,
  theme,
}: {
  data: ComparisonData;
  theme: any;
}) {
  const isUp = data.direction === "up";
  const isSame = data.direction === "same";

  const deltaBackground = isSame
    ? theme.colors.surfaceVariant
    : isUp
      ? theme.colors.errorContainer
      : theme.colors.tertiaryContainer;
  const deltaText = isSame
    ? theme.colors.onSurfaceVariant
    : isUp
      ? theme.colors.onErrorContainer
      : theme.colors.onTertiaryContainer;

  const arrow = isSame ? "—" : isUp ? "↑" : "↓";

  return (
    <View
      style={[
        styles.resultCard,
        {
          backgroundColor: theme.colors.elevation.level2,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Delta pill */}
      <View style={styles.comparisonPillRow}>
        <View
          style={[styles.comparisonPill, { backgroundColor: deltaBackground }]}
        >
          <Text style={[styles.comparisonPillText, { color: deltaText }]}>
            {arrow}{" "}
            {isSame
              ? "No change"
              : `${data.deltaAmount} (${data.deltaPercent})`}
          </Text>
        </View>
      </View>

      {/* Two-column amounts */}
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonCol}>
          <Text
            style={[styles.comparisonAmount, { color: theme.colors.primary }]}
          >
            {data.thisAmount}
          </Text>
          <Text
            style={[
              styles.comparisonPeriod,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {data.thisLabel}
          </Text>
        </View>

        <View
          style={[
            styles.comparisonDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        <View style={styles.comparisonCol}>
          <Text
            style={[styles.comparisonAmount, { color: theme.colors.onSurface }]}
          >
            {data.prevAmount}
          </Text>
          <Text
            style={[
              styles.comparisonPeriod,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {data.prevLabel}
          </Text>
        </View>
      </View>

      {data.subContext ? (
        <Text
          style={[
            styles.comparisonSub,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {data.subContext}
        </Text>
      ) : null}
    </View>
  );
}

// ============================================================
// OPTIONS VIEW
// ============================================================
function OptionsView({
  options,
  style,
  theme,
  minimalIconsEnabled,
  onSelect,
}: {
  options: Option[];
  style: ChatMessage["optionStyle"];
  theme: any;
  minimalIconsEnabled: boolean;
  onSelect: (o: Option) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSearchResults, setShowAllSearchResults] = useState(false);

  useEffect(() => {
    setShowAllSearchResults(false);
    setSearchQuery("");
  }, [options, style]);

  // ── TILE (path select) ───────────────────────────────────
  if (style === "tile") {
    return (
      <View style={styles.pathSection}>
        <View style={styles.tilesRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.tile,
                styles.pathTile,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.7}
            >
              {opt.icon ? (
                <View
                  style={[
                    styles.tileIconWrap,
                    { backgroundColor: theme.colors.elevation.level3 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              ) : null}
              <Text
                style={[styles.tileLabel, { color: theme.colors.onSurface }]}
              >
                {opt.label}
              </Text>
              {opt.sublabel && (
                <Text
                  style={[
                    styles.tileSublabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {opt.sublabel}
                </Text>
              )}
              <View style={styles.tileChevronWrap}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming soon card */}
        <View
          style={[
            styles.comingSoonCard,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View
            style={[
              styles.comingSoonIconWrap,
              { backgroundColor: theme.colors.elevation.level2 },
            ]}
          >
            <MaterialCommunityIcons
              name="flask-outline"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.comingSoonText}>
            <Text
              style={[
                styles.comingSoonTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              More on the way
            </Text>
            <Text
              style={[
                styles.comingSoonSub,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Budgets · trends · smart summaries
            </Text>
          </View>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={18}
            color={theme.colors.outlineVariant}
          />
        </View>
      </View>
    );
  }

  // ── CHIPS (month select) ─────────────────────────────────
  if (style === "chip") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.elevation.level2,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: theme.colors.onSurface }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── CATEGORY GRID ────────────────────────────────────────
  if (style === "category_grid") {
    return (
      <View style={styles.categoryGrid}>
        {options.map((opt) => {
          const iconColor = minimalIconsEnabled
            ? theme.colors.primary
            : opt.color || theme.colors.primary;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.categoryIconWrap,
                  {
                    backgroundColor: minimalIconsEnabled
                      ? theme.colors.surfaceVariant
                      : withOpacity(iconColor, "16"),
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={(opt.icon || "shape-outline") as any}
                  size={18}
                  color={iconColor}
                />
              </View>
              <View style={styles.categoryTextWrap}>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
                {opt.sublabel ? (
                  <Text
                    style={[
                      styles.categorySublabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.sublabel}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── ACTIONS ──────────────────────────────────────────────
  if (style === "actions") {
    const primaryOptions = options.filter(
      (opt) => opt.value === "__compare__" || opt.value === "__pick_month__",
    );
    const secondaryOptions = options.filter(
      (opt) => opt.value !== "__compare__" && opt.value !== "__pick_month__",
    );

    return (
      <View style={styles.actionsWrap}>
        {primaryOptions.length > 0 && (
          <View style={styles.actionsRow}>
            {primaryOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {secondaryOptions.length > 0 && (
          <View style={styles.secondaryActionsRow}>
            {secondaryOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.secondaryAction,
                  {
                    backgroundColor: "transparent",
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.secondaryActionText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  // ── SEARCH LIST ──────────────────────────────────────────
  if (style === "search_list") {
    const filtered = searchQuery.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;
    const visible =
      searchQuery.trim() || showAllSearchResults
        ? filtered
        : filtered.slice(0, 5);

    return (
      <View style={styles.searchListWrap}>
        <View
          style={[
            styles.searchInputWrap,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search titles…"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listOptions}>
          {visible.length === 0 ? (
            <Text
              style={[
                styles.searchEmpty,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No titles match
            </Text>
          ) : (
            visible.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.listOption,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                <View style={styles.listOptionRow}>
                  {opt.icon ? (
                    <View
                      style={[
                        styles.listOptionIconWrap,
                        { backgroundColor: theme.colors.elevation.level2 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                  ) : null}
                  <View style={styles.listOptionInner}>
                    <Text
                      style={[
                        styles.listOptionLabel,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.sublabel && (
                      <Text
                        style={[
                          styles.listOptionSublabel,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {opt.sublabel}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={14}
                    color={theme.colors.outlineVariant}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {!searchQuery.trim() && filtered.length > 5 && !showAllSearchResults ? (
          <TouchableOpacity
            style={[
              styles.viewMoreButton,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            onPress={() => setShowAllSearchResults(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewMoreText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              View more
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // ── DEFAULT LIST ─────────────────────────────────────────
  return (
    <View style={styles.listOptions}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.listOption,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.7}
        >
          <View style={styles.listOptionRow}>
            {opt.icon ? (
              <View
                style={[
                  styles.listOptionIconWrap,
                  { backgroundColor: theme.colors.elevation.level2 },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            ) : null}
            <View style={styles.listOptionInner}>
              <Text
                style={[
                  styles.listOptionLabel,
                  { color: theme.colors.onSurface },
                ]}
              >
                {opt.label}
              </Text>
              {opt.sublabel && (
                <Text
                  style={[
                    styles.listOptionSublabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {opt.sublabel}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color={theme.colors.outlineVariant}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    letterSpacing: 2,
  },
  betaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  betaPillText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetText: { fontSize: 12 },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 4 },

  // ── Message group ────────────────────────────────────────
  messageGroup: { gap: 8, marginBottom: 12 },

  senderLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: -2,
    paddingLeft: 2,
  },

  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  botBubble: { alignSelf: "flex-start" },
  userBubble: { alignSelf: "flex-end" },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  // ── Loading ──────────────────────────────────────────────
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 4,
    marginTop: 4,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  loadingText: { fontSize: 13 },

  // ── Result card ──────────────────────────────────────────
  resultCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  resultHeader: {
    flexDirection: "row",
    padding: 16,
    gap: 14,
  },
  resultAccentBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: "stretch",
    flexShrink: 0,
  },
  resultHeaderText: {
    flex: 1,
    gap: 2,
  },
  resultAmount: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  resultLabel: { fontSize: 14, fontWeight: "500" },
  resultSublabel: { fontSize: 13 },

  txnList: { gap: 0 },
  txnListWithBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  txnRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txnLeft: { flex: 1, gap: 2 },
  txnTitle: { fontSize: 14, fontWeight: "500" },
  txnMeta: { fontSize: 12 },
  txnAmount: { fontSize: 14, fontWeight: "600" },

  // ── Comparison card ──────────────────────────────────────
  comparisonPillRow: {
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  comparisonPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  comparisonPillText: { fontSize: 13, fontWeight: "600" },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  comparisonCol: { flex: 1, gap: 3 },
  comparisonDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginHorizontal: 16,
    marginVertical: 4,
  },
  comparisonAmount: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  comparisonPeriod: { fontSize: 12 },
  comparisonSub: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  // ── Path tiles ───────────────────────────────────────────
  pathSection: { gap: 10 },
  tilesRow: { flexDirection: "row", gap: 8 },
  tile: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  pathTile: { flex: 1 },
  tileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: { fontSize: 15, fontWeight: "600" },
  tileSublabel: { fontSize: 12 },
  tileChevronWrap: {
    marginTop: 4,
  },

  // ── Coming soon card ─────────────────────────────────────
  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  comingSoonIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  comingSoonText: { flex: 1, gap: 2 },
  comingSoonTitle: { fontSize: 14, fontWeight: "500" },
  comingSoonSub: { fontSize: 12 },

  // ── Chips ────────────────────────────────────────────────
  chipsRow: { gap: 8, paddingRight: 8 },
  chip: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 14 },

  // ── Category grid ────────────────────────────────────────
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryCard: {
    width: "48.5%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  categoryTextWrap: { flex: 1, minWidth: 0, gap: 2 },
  categoryLabel: { fontSize: 14, fontWeight: "500" },
  categorySublabel: { fontSize: 11 },

  // ── Actions ──────────────────────────────────────────────
  actionsWrap: { gap: 8 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  secondaryActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  secondaryAction: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryActionText: { fontSize: 13 },

  // ── List options ─────────────────────────────────────────
  listOptions: { gap: 6 },
  listOption: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  listOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listOptionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listOptionInner: { gap: 2, flex: 1 },
  listOptionLabel: { fontSize: 15 },
  listOptionSublabel: { fontSize: 12 },

  // ── Search list ──────────────────────────────────────────
  searchListWrap: { gap: 8 },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  viewMoreButton: {
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  viewMoreText: { fontSize: 13 },
  searchEmpty: { fontSize: 14, paddingVertical: 8, textAlign: "center" },
});
