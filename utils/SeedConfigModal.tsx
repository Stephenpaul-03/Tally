// Requires: @react-native-community/slider
// expo install @react-native-community/slider

import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { withOpacity } from "@/utils/Helpers";
import {
  AccountConfig,
  CategoryConfig,
  DEFAULT_SEED_CONFIG,
  Lifestyle,
  SeedConfig,
  applyLifestylePreset,
  buildAccountConfigs,
  buildCategoryConfigs,
} from "./seedGenerator";

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: SeedConfig) => void;
  userCategories: { name: string; type: "income" | "expense" }[];
  userAccounts: { name: string }[];
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "presets" | "core" | "categories" | "accounts" | "advanced";

const TABS: { id: Tab; label: string }[] = [
  { id: "presets", label: "Presets" },
  { id: "core", label: "Core" },
  { id: "categories", label: "Categories" },
  { id: "accounts", label: "Accounts" },
  { id: "advanced", label: "Advanced" },
];

const LIFESTYLE_META: {
  id: Lifestyle;
  label: string;
  description: string;
  icon: string;
}[] = [
  { id: "student",    label: "Student",    description: "Low income, irregular small spends",        icon: "🎓" },
  { id: "salaried",   label: "Salaried",   description: "Steady bi-weekly income, moderate spend",   icon: "💼" },
  { id: "freelancer", label: "Freelancer", description: "Irregular income, varied expenses",          icon: "💻" },
  { id: "retiree",    label: "Retiree",    description: "Fixed monthly income, conservative spend",   icon: "🏡" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Two-layout Row:
 *   horizontal=true  → label (flex 1) on left, children on right (good for Switch)
 *   horizontal=false → label on top, children below (good for Slider / SegmentedControl)
 */
function Row({
  label,
  hint,
  children,
  horizontal = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: 11,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.outline,
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "stretch",
        justifyContent: horizontal ? "space-between" : undefined,
        gap: horizontal ? 0 : 8,
      }}
    >
      <View style={{ flex: horizontal ? 1 : undefined, paddingRight: horizontal ? 12 : 0 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: theme.colors.onSurface }}>
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 15 }}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "600",
        color: theme.colors.onSurfaceVariant,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        paddingTop: 16,
        paddingBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function RNToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{
        false: theme.colors.outline,
        true: withOpacity(theme.colors.primary, "60"),
      }}
      thumbColor={value ? theme.colors.primary : theme.colors.onSurfaceVariant}
    />
  );
}

function RNSlider({
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Slider
        style={{ flex: 1, height: 32 }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.outline}
        thumbTintColor={theme.colors.primary}
      />
      <Text
        style={{
          fontSize: 11,
          color: theme.colors.onSurfaceVariant,
          minWidth: 48,
          textAlign: "right",
        }}
      >
        {format ? format(value) : value}
      </Text>
    </View>
  );
}

function RNSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 2,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
        padding: 2,
        alignSelf: "flex-start",
      }}
    >
      {options.map((o) => {
        const isActive = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: isActive ? theme.colors.surface : "transparent",
              borderWidth: isActive ? 0.5 : 0,
              borderColor: theme.colors.outline,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: isActive ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                fontWeight: isActive ? "500" : "400",
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RNRangeInput({
  value,
  onChange,
  prefix,
}: {
  value: { min: number; max: number };
  onChange: (v: { min: number; max: number }) => void;
  prefix?: string;
}) {
  const theme = useTheme();
  const inputStyle = {
    width: 72,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurface,
  } as const;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {prefix ? (
        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>{prefix}</Text>
      ) : null}
      <TextInput
        style={inputStyle}
        value={String(value.min)}
        keyboardType="numeric"
        onChangeText={(t) => onChange({ ...value, min: Number(t) || 0 })}
      />
      <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant }}>–</Text>
      <TextInput
        style={inputStyle}
        value={String(value.max)}
        keyboardType="numeric"
        onChangeText={(t) => onChange({ ...value, max: Number(t) || 0 })}
      />
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function SeedConfigModal({
  open,
  onClose,
  onConfirm,
  userCategories,
  userAccounts,
}: Props) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [config, setConfig] = useState<SeedConfig>(() => ({
    ...DEFAULT_SEED_CONFIG,
    categories: buildCategoryConfigs(userCategories),
    accounts: buildAccountConfigs(userAccounts),
  }));
  const [activeTab, setActiveTab] = useState<Tab>("presets");
  const [appliedPreset, setAppliedPreset] = useState<Lifestyle | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const set = useCallback(<K extends keyof SeedConfig>(key: K, value: SeedConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyPreset = (lifestyle: Lifestyle) => {
    setConfig((prev) => applyLifestylePreset(prev, lifestyle));
    setAppliedPreset(lifestyle);
  };

  const getCategoryKey = (category: Pick<CategoryConfig, "name" | "type">) =>
    `${category.type}:${category.name}`;

  const updateCategory = (
    name: string,
    type: CategoryConfig["type"],
    patch: Partial<CategoryConfig>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.name === name && c.type === type ? { ...c, ...patch } : c,
      ),
    }));
  };

  const updateAccount = (name: string, patch: Partial<AccountConfig>) => {
    setConfig((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.name === name ? { ...a, ...patch } : a)),
    }));
  };

  const { colors } = theme;
  const bg      = colors.surface;
  const outline = colors.outline;
  const text    = colors.onSurface;
  const muted   = colors.onSurfaceVariant;
  const accent  = colors.primary;

  const numericInput = {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: outline,
    backgroundColor: colors.surfaceVariant,
    color: text,
    width: 80,
  } as const;

  const enabledExpenseCount = config.categories.filter((c) => c.type === "expense" && c.enabled).length;
  const enabledIncomeCount  = config.categories.filter((c) => c.type === "income"  && c.enabled).length;
  const sheetHeight = Math.round(windowHeight * 0.92);

  return (
    <AnimatedPaperModal
      visible={open}
      onDismiss={onClose}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderColor: outline,
        borderTopWidth: 0.5,
        height: sheetHeight,
        overflow: "hidden",
      }}
      keyboardAware
      dismissable={false}
    >
      <View style={{ flex: 1 }}>
        {/* Drag handle */}
        <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: withOpacity(muted, "40"),
            }}
          />
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: text }}>Seed test data</Text>
              <Text style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                {enabledExpenseCount} expense {enabledExpenseCount === 1 ? "category" : "categories"}{" "}
                · {enabledIncomeCount} income{" "}
                · {config.accounts.filter((a) => a.weight > 0).length} accounts
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                backgroundColor: withOpacity(muted, "14"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: muted, lineHeight: 20 }}>×</Text>
            </Pressable>
          </View>

          {/* Tab bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? text : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: isActive ? text : muted,
                      fontWeight: isActive ? "500" : "400",
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Header/content divider */}
        <View style={{ height: 0.5, backgroundColor: outline }} />

        {/* Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: 24,
            paddingTop: 4,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

        {/* ── Presets ───────────────────────────────────────────────── */}
        {activeTab === "presets" && (
          <View style={{ paddingTop: 16 }}>
            <Text style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
              Presets fill all knobs at once. Fine-tune on other tabs after applying.
            </Text>

            {/* 2-column preset cards */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {LIFESTYLE_META.map((lm) => {
                const isActive = appliedPreset === lm.id;
                return (
                  <Pressable
                    key={lm.id}
                    onPress={() => handleApplyPreset(lm.id)}
                    style={{
                      width: "47%",
                      padding: 14,
                      borderRadius: 12,
                      borderWidth: isActive ? 2 : 0.5,
                      borderColor: isActive ? accent : outline,
                      backgroundColor: isActive
                        ? withOpacity(accent, "10")
                        : colors.surfaceVariant,
                    }}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 6 }}>{lm.icon}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: text }}>{lm.label}</Text>
                    <Text style={{ fontSize: 11, color: muted, marginTop: 3 }}>{lm.description}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick settings */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.secondary,
                marginTop: 20,
                marginBottom: 4,
              }}
            >
              Quick settings
            </Text>
            <Row label="Date from" hint="Start of transaction range (YYYY-MM-DD)">
              <TextInput
                style={numericInput}
                value={config.dateRange.from}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={muted}
                onChangeText={(t) => set("dateRange", { ...config.dateRange, from: t })}
              />
            </Row>
            <Row label="Date to" hint="End of transaction range (YYYY-MM-DD)">
              <TextInput
                style={numericInput}
                value={config.dateRange.to}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={muted}
                onChangeText={(t) => set("dateRange", { ...config.dateRange, to: t })}
              />
            </Row>
            <Row label="Locale" hint="Affects merchant names">
              <RNSegmentedControl
                value={config.locale}
                onChange={(v) => set("locale", v)}
                options={[
                  { value: "en-IN", label: "India" },
                  { value: "en-US", label: "US" },
                ]}
              />
            </Row>
          </View>
        )}

        {/* ── Core ─────────────────────────────────────────────────── */}
        {activeTab === "core" && (
          <View>
            <SectionLabel>Spending</SectionLabel>
            <Row label="Density" hint="How often optional expense categories appear">
              <RNSegmentedControl
                value={config.density}
                onChange={(v) => set("density", v)}
                options={[
                  { value: "light",    label: "Light"    },
                  { value: "moderate", label: "Moderate" },
                  { value: "heavy",    label: "Heavy"    },
                ]}
              />
            </Row>
            <Row label="Transactions / day — min" hint="Min expense entries per active day">
              <RNSlider
                value={config.transactionsPerDay.min}
                min={1}
                max={config.transactionsPerDay.max}
                onChange={(v) =>
                  set("transactionsPerDay", { ...config.transactionsPerDay, min: v })
                }
              />
            </Row>
            <Row label="Transactions / day — max" hint="Max expense entries per active day">
              <RNSlider
                value={config.transactionsPerDay.max}
                min={config.transactionsPerDay.min}
                max={20}
                onChange={(v) =>
                  set("transactionsPerDay", { ...config.transactionsPerDay, max: v })
                }
              />
            </Row>
            <Row label="Expense skew" hint="When in the month does spending cluster?">
              <RNSegmentedControl
                value={config.expenseSkew}
                onChange={(v) => set("expenseSkew", v)}
                options={[
                  { value: "start-heavy", label: "Start"  },
                  { value: "balanced",    label: "Even"   },
                  { value: "end-heavy",   label: "End"    },
                  { value: "random",      label: "Random" },
                ]}
              />
            </Row>
            <Row label="Weekend spend" hint="Multiplier on amount and count on Sat/Sun">
              <RNSlider
                value={config.weekendMultiplier}
                min={0.5}
                max={3}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(v) => set("weekendMultiplier", v)}
              />
            </Row>
            <Row label="Missed day chance" hint="Probability a day has zero transactions">
              <RNSlider
                value={config.missedDayProbability}
                min={0}
                max={0.5}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => set("missedDayProbability", v)}
              />
            </Row>
            <Row label="Burst day chance" hint="Probability of unusually high spend day">
              <RNSlider
                value={config.burstDayProbability}
                min={0}
                max={0.3}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => set("burstDayProbability", v)}
              />
            </Row>
            <Row label="Burst multiplier" hint="Amount multiplier applied on burst days">
              <RNSlider
                value={config.burstMultiplier}
                min={1.5}
                max={10}
                step={0.5}
                format={(v) => `${v}×`}
                onChange={(v) => set("burstMultiplier", v)}
              />
            </Row>

            <SectionLabel>Amounts</SectionLabel>
            <Row label="Default amount range" hint="Applied to categories without a custom range">
              <RNRangeInput
                value={config.globalAmountRange}
                onChange={(v) => set("globalAmountRange", v)}
                prefix="₹"
              />
            </Row>
            <Row label="Amount variance" hint="How spread out random amounts are within the range">
              <RNSegmentedControl
                value={config.amountVariance}
                onChange={(v) => set("amountVariance", v)}
                options={[
                  { value: "tight",  label: "Tight"  },
                  { value: "medium", label: "Medium" },
                  { value: "wide",   label: "Wide"   },
                ]}
              />
            </Row>

            <SectionLabel>Income</SectionLabel>
            <Row label="Include income" horizontal>
              <RNToggle value={config.includeIncome} onChange={(v) => set("includeIncome", v)} />
            </Row>
            {config.includeIncome && (
              <>
                <Row label="Frequency" hint="How often income transactions appear">
                  <RNSegmentedControl
                    value={config.incomeFrequency}
                    onChange={(v) => set("incomeFrequency", v)}
                    options={[
                      { value: "weekly",    label: "Weekly"    },
                      { value: "biweekly",  label: "Bi-weekly" },
                      { value: "monthly",   label: "Monthly"   },
                      { value: "irregular", label: "Irregular" },
                    ]}
                  />
                </Row>
                {(config.incomeFrequency === "biweekly" ||
                  config.incomeFrequency === "monthly") && (
                  <Row label="Pay days" hint="Day(s) of month income lands">
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {config.payDays.map((d, i) => (
                        <TextInput
                          key={i}
                          style={{ ...numericInput, width: 48, textAlign: "center" }}
                          value={String(d)}
                          keyboardType="numeric"
                          onChangeText={(t) => {
                            const days = [...config.payDays];
                            days[i] = Number(t) || 1;
                            set("payDays", days);
                          }}
                        />
                      ))}
                    </View>
                  </Row>
                )}
                <Row label="Salary jitter" hint="Salary varies slightly each occurrence (±8%)" horizontal>
                  <RNToggle value={config.salaryJitter} onChange={(v) => set("salaryJitter", v)} />
                </Row>
                <Row label="Bonus month" hint="One random month gets an extra lump-sum" horizontal>
                  <RNToggle value={config.bonusMonth} onChange={(v) => set("bonusMonth", v)} />
                </Row>
                {config.bonusMonth && (
                  <Row label="Bonus range" hint="Amount range for the bonus transaction">
                    <RNRangeInput
                      value={config.bonusAmountRange}
                      onChange={(v) => set("bonusAmountRange", v)}
                      prefix="₹"
                    />
                  </Row>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Categories ───────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <View style={{ paddingTop: 8 }}>
            {(["expense", "income"] as const).map((type) => {
              const cats = config.categories.filter((c) => c.type === type);
              if (cats.length === 0) return null;
              return (
                <View key={type} style={{ marginBottom: 16 }}>
                  <SectionLabel>
                    {type === "expense" ? "Expense categories" : "Income categories"}
                  </SectionLabel>
                  {cats.map((cat) => {
                    const categoryKey = getCategoryKey(cat);
                    const isExpanded = expandedCategory === categoryKey;
                    return (
                      <View
                        key={categoryKey}
                        style={{ borderBottomWidth: 0.5, borderBottomColor: outline }}
                      >
                        {/* Category row */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            paddingVertical: 10,
                          }}
                        >
                          <RNToggle
                            value={cat.enabled}
                            onChange={(v) =>
                              updateCategory(cat.name, cat.type, { enabled: v })
                            }
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 13,
                              color: cat.enabled ? text : muted,
                            }}
                          >
                            {cat.name}
                          </Text>
                          {cat.enabled && (
                            <>
                              {/* Compact weight slider */}
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={{ fontSize: 10, color: muted }}>wt</Text>
                                <Slider
                                  style={{ width: 60, height: 28 }}
                                  value={cat.weight}
                                  minimumValue={1}
                                  maximumValue={10}
                                  step={1}
                                  onValueChange={(v) =>
                                    updateCategory(cat.name, cat.type, { weight: v })
                                  }
                                  minimumTrackTintColor={accent}
                                  maximumTrackTintColor={outline}
                                  thumbTintColor={accent}
                                />
                                <Text style={{ fontSize: 11, color: muted, minWidth: 14 }}>
                                  {cat.weight}
                                </Text>
                              </View>
                              <Pressable
                                onPress={() =>
                                  setExpandedCategory(isExpanded ? null : categoryKey)
                                }
                                hitSlop={8}
                              >
                                <Text style={{ fontSize: 13, color: muted }}>
                                  {isExpanded ? "▴" : "▾"}
                                </Text>
                              </Pressable>
                            </>
                          )}
                        </View>

                        {/* Expanded options */}
                        {isExpanded && cat.enabled && (
                          <View
                            style={{
                              backgroundColor: colors.surfaceVariant,
                              borderRadius: 8,
                              padding: 12,
                              marginBottom: 8,
                            }}
                          >
                            <Row label="Custom amount range" hint="Overrides global range">
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <RNToggle
                                  value={cat.amountRange !== null}
                                  onChange={(v) =>
                                    updateCategory(cat.name, cat.type, {
                                      amountRange: v ? { min: 100, max: 5000 } : null,
                                    })
                                  }
                                />
                                {cat.amountRange && (
                                  <RNRangeInput
                                    value={cat.amountRange}
                                    onChange={(v) =>
                                      updateCategory(cat.name, cat.type, {
                                        amountRange: v,
                                      })
                                    }
                                    prefix="₹"
                                  />
                                )}
                              </View>
                            </Row>
                            <Row
                              label="Recurring"
                              hint="Same amount every time (e.g. rent)"
                              horizontal
                            >
                              <RNToggle
                                value={cat.isRecurring}
                                onChange={(v) =>
                                  updateCategory(cat.name, cat.type, { isRecurring: v })
                                }
                              />
                            </Row>
                            {cat.isRecurring && (
                              <Row label="Fixed amount" hint="Exact amount used every occurrence" horizontal>
                                <TextInput
                                  style={numericInput}
                                  value={cat.recurringAmount ? String(cat.recurringAmount) : ""}
                                  placeholder="e.g. 1500"
                                  placeholderTextColor={muted}
                                  keyboardType="numeric"
                                  onChangeText={(t) =>
                                    updateCategory(cat.name, cat.type, {
                                      recurringAmount: Number(t) || null,
                                    })
                                  }
                                />
                              </Row>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            {config.categories.length === 0 && (
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: muted, textAlign: "center" }}>
                  No categories found. Add some categories in your app first.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Accounts ─────────────────────────────────────────────── */}
        {activeTab === "accounts" && (
          <View style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
              Weight controls how often each account is selected. Set to 0 to exclude it.
            </Text>
            {config.accounts.length === 0 && (
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: muted, textAlign: "center" }}>
                  No accounts found. Add some accounts in your app first.
                </Text>
              </View>
            )}
            {config.accounts.map((acc) => {
              const total = config.accounts.reduce((s, a) => s + a.weight, 0);
              return (
                <Row
                  key={acc.name}
                  label={acc.name}
                  hint={
                    acc.weight === 0
                      ? "Excluded"
                      : `~${Math.round((acc.weight / total) * 100)}% of transactions`
                  }
                >
                  <RNSlider
                    value={acc.weight}
                    min={0}
                    max={10}
                    step={1}
                    format={(v) => (v === 0 ? "off" : String(v))}
                    onChange={(v) => updateAccount(acc.name, { weight: v })}
                  />
                </Row>
              );
            })}
          </View>
        )}

        {/* ── Advanced ─────────────────────────────────────────────── */}
        {activeTab === "advanced" && (
          <View>
            <SectionLabel>Realism</SectionLabel>
            <Row label="Round number bias" hint="Chance amount is rounded to nearest ₹50 or ₹100">
              <RNSlider
                value={config.roundNumberBias}
                min={0}
                max={1}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => set("roundNumberBias", v)}
              />
            </Row>
            <Row label="Inflation drift" hint="Amounts slowly increase each month">
              <RNSlider
                value={config.inflationDrift}
                min={0}
                max={0.1}
                step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}%/mo`}
                onChange={(v) => set("inflationDrift", v)}
              />
            </Row>
            <Row label="Anomaly rate" hint="Chance a transaction is a random outlier (5–10× amount)">
              <RNSlider
                value={config.anomalyRate}
                min={0}
                max={0.1}
                step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}%`}
                onChange={(v) => set("anomalyRate", v)}
              />
            </Row>
            <Row label="Merchant repetition" hint="Reuse realistic merchant names (Swiggy, Uber…)" horizontal>
              <RNToggle
                value={config.merchantRepetition}
                onChange={(v) => set("merchantRepetition", v)}
              />
            </Row>
            <Row label="Split transaction chance" hint="Chance one expense splits into 2–3 smaller entries">
              <RNSlider
                value={config.splitTransactionProbability}
                min={0}
                max={0.3}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => set("splitTransactionProbability", v)}
              />
            </Row>

            <SectionLabel>Reproducibility</SectionLabel>
            <Row label="Random seed" hint="Same number → identical data every run. Blank = random." horizontal>
              <TextInput
                style={numericInput}
                value={config.randomSeed !== null ? String(config.randomSeed) : ""}
                placeholder="e.g. 42"
                placeholderTextColor={muted}
                keyboardType="numeric"
                onChangeText={(t) => set("randomSeed", t === "" ? null : Number(t))}
              />
            </Row>
          </View>
        )}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderTopWidth: 0.5,
            borderTopColor: outline,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: bg,
          }}
        >
          <Pressable
            onPress={() =>
              setConfig({
                ...DEFAULT_SEED_CONFIG,
                categories: buildCategoryConfigs(userCategories),
                accounts: buildAccountConfigs(userAccounts),
              })
            }
            hitSlop={8}
          >
            <Text style={{ fontSize: 13, color: muted }}>Reset</Text>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={onClose}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: outline,
              }}
            >
              <Text style={{ fontSize: 13, color: muted }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(config)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: accent,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.onPrimary }}>
                Generate data
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedPaperModal>
  );
}
