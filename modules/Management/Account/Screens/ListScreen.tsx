import { useStagger } from "@/components/animations/UseStagger";
import { SectionLabel } from "@/components/SectionLabel";
import { SortOptionSheet } from "@/components/SortOptionSheet";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { CategoryTile } from "@/modules/Management/Category/Components/CategoryTile";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Animated, Pressable, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import type { MD3Theme } from "react-native-paper";
import { Text, TouchableRipple } from "react-native-paper";
import { AccountModalHeader } from "../Components/ModalHeader";
import { PROTECTED_ACCOUNTS } from "../Constants";

interface AccountListScreenProps {
  management: ReturnType<typeof useAccountManagement>;
  selectedAccount?: string;
  onSelectAccount?: (account: string) => void;
  showBack?: boolean;
  hideCloseButton?: boolean;
  listHeight: number;
  onBack: () => void;
  onClose: () => void;
  theme: MD3Theme;
  useSettingsHeader?: boolean;
}

type AccountSortField = "name" | "usage";
type AccountSortDirection = "asc" | "desc";

const ACCOUNT_SORT_OPTIONS: {
  id: AccountSortField;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "name",
    label: "Name",
    description: "Sort account names",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Sort by transaction count",
    icon: "chart-bar",
  },
];

export function AccountListScreen({
  management,
  selectedAccount,
  onSelectAccount,
  showBack = false,
  hideCloseButton = false,
  listHeight,
  onBack,
  onClose,
  theme,
  useSettingsHeader = false,
}: AccountListScreenProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const c = theme.colors;
  const accounts = management.activeAccounts;
  const isPickerMode = Boolean(onSelectAccount);
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const workspaceDefaults = getWorkspaceDefaults(activeWorkspace?.id ?? "personal");
  const [sortField, setSortField] = useState<AccountSortField>(
    workspaceDefaults.accountSortField,
  );
  const [sortDirection, setSortDirection] = useState<AccountSortDirection>(
    workspaceDefaults.accountSortDirection,
  );
  React.useEffect(() => {
    setSortField(workspaceDefaults.accountSortField);
    setSortDirection(workspaceDefaults.accountSortDirection);
  }, [workspaceDefaults.accountSortDirection, workspaceDefaults.accountSortField]);
  const animatedOnceRef = React.useRef(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleAccounts = useMemo(() => {
    const filtered = normalizedQuery
      ? accounts.filter((name) =>
          [
            name,
            management.getAccountIcon(name),
            `${management.accountStats[name]?.count ?? 0} transactions`,
            PROTECTED_ACCOUNTS.has(name) ? "default" : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : accounts;

    return [...filtered].sort((a, b) => {
      const result =
        sortField === "name"
          ? a.localeCompare(b)
          : (management.accountStats[a]?.count ?? 0) -
            (management.accountStats[b]?.count ?? 0);
      return sortDirection === "asc" ? result : -result;
    });
  }, [accounts, management, normalizedQuery, sortDirection, sortField]);

  const { getAnimStyle } = useStagger({
    count: visibleAccounts.length,
    stagger: 70,
    distance: 20,
    duration: 550,
    dataKey: "accounts-first-mount",
    autoPlay: !animatedOnceRef.current,
    replayOnCountChange: false,
  });

  React.useEffect(() => {
    animatedOnceRef.current = true;
  }, []);

  const rows = Array.from(
    { length: Math.ceil(visibleAccounts.length / 2) },
    (_, i) => visibleAccounts.slice(i * 2, i * 2 + 2),
  );
  const accountHasActivity = useMemo(
    () =>
      Object.values(management.accountStats).some((stats) => stats.count > 0),
    [management.accountStats],
  );
  const headerSearchWidth = Math.min(240, Math.max(150, width - 190));

  const sortAccessory = !isPickerMode ? (
    <TouchableRipple
      onPress={() => setSortOpen(true)}
      borderless
      style={{
        width: 32,
        height: 32,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.outlineVariant,
      }}
      accessibilityLabel="Sort accounts"
    >
      <MaterialCommunityIcons
        name="sort"
        size={18}
        color={c.onSurfaceVariant}
      />
    </TouchableRipple>
  ) : undefined;

  return (
    <View
      style={
        isPickerMode
          ? { height: listHeight + 116, flexShrink: 0 }
          : { flex: 1 }
      }
    >
      {useSettingsHeader ? (
        <SettingsHeader
          title="Accounts"
          onBack={onBack}
          query={query}
          onQueryChange={setQuery}
          searchOpen={searchOpen}
          onSearchOpenChange={setSearchOpen}
          searchPlaceholder="Search accounts"
          rightAccessoryBeforeSearch={sortAccessory}
          modal={isPickerMode}
        />
      ) : (
        <AccountModalHeader
          title="Accounts"
          subtitle={`${management.counts.accounts} available`}
          iconName="wallet-outline"
          showBack={showBack}
          rightAccessory={
            <View style={{ flexDirection: "row", gap: 8 }}>
              <UniversalSearchBar
                bg={c.elevation.level1}
                value={query}
                onChangeText={setQuery}
                placeholder="Search accounts"
                autoFocus={searchOpen}
                containerStyle={{
                  height: 36,
                  borderRadius: 10,
                }}
                animation={{
                  expanded: searchOpen,
                  onExpandedChange: (expanded) => {
                    setSearchOpen(expanded);
                    if (!expanded) setQuery("");
                  },
                  mode: "right",
                  collapsedWidth: 36,
                  expandedWidth: headerSearchWidth,
                  duration: 240,
                  clearOnCollapse: true,
                }}
              />
              {!isPickerMode ? (
                <TouchableRipple
                  onPress={() => setSortOpen(true)}
                  borderless
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: c.elevation.level1,
                    borderWidth: 0.5,
                    borderColor: c.outlineVariant,
                  }}
                  accessibilityLabel="Sort accounts"
                >
                  <MaterialCommunityIcons
                    name="sort"
                    size={18}
                    color={c.onSurfaceVariant}
                  />
                </TouchableRipple>
              ) : null}
            </View>
          }
          onBack={onBack}
          onClose={onClose}
          hideCloseButton={hideCloseButton}
          theme={theme}
        />
      )}

      <SectionLabel label={"Payment Accounts"} />

      <View style={{ flex: 1, marginHorizontal: 20 }}>
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {rows.length === 0 ? (
            <View
              style={{
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                gap: 10,
                backgroundColor: c.elevation.level1,
                borderWidth: 0.5,
                borderColor: c.outlineVariant,
              }}
            >
              <MaterialCommunityIcons
                name="magnify-close"
                size={24}
                color={c.onSurfaceVariant}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: c.onSurfaceVariant,
                }}
              >
                No matching accounts
              </Text>
            </View>
          ) : (
            rows.map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: "row", gap: 8 }}>
                {row.map((name, itemIndex) => {
                  const animatedIndex = rowIndex * 2 + itemIndex;
                  return (
                    <Animated.View
                      key={name}
                      style={[
                        { flex: 1, maxWidth: "50%" },
                        getAnimStyle(animatedIndex),
                      ]}
                    >
                      <CategoryTile
                        name={name}
                        icon={management.getAccountIcon(name)}
                        color={management.getAccountColor(name)}
                        transactionCount={
                          management.accountStats[name]?.count ?? 0
                        }
                        showTransactionLabel={accountHasActivity}
                        iconColorOverride={
                          minimalIconsEnabled ? theme.colors.primary : undefined
                        }
                        isSelected={isPickerMode && selectedAccount === name}
                        pickerMode={isPickerMode}
                        onPress={() => {
                          if (onSelectAccount) {
                            onSelectAccount(name);
                            onClose();
                            return;
                          }
                          management.handleEditAccount(name);
                        }}
                        theme={theme}
                      />
                    </Animated.View>
                  );
                })}
                {row.length === 1 && (
                  <View style={{ flex: 1, maxWidth: "50%" }} />
                )}
              </View>
            ))
          )}
        </KeyboardAwareScrollView>
      </View>

      {!isPickerMode && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            marginTop: "auto",
          }}
        >
          <Pressable
            onPress={management.handleAddNewAccount}
            disabled={management.iconOptions.length === 0}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 14,
              backgroundColor: c.primary,
              opacity: pressed
                ? 0.75
                : management.iconOptions.length === 0
                  ? 0.4
                  : 1,
            })}
          >
            <MaterialCommunityIcons name="plus" size={20} color={c.onPrimary} />
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 14,
                color: c.onPrimary,
              }}
            >
              Add new account
            </Text>
          </Pressable>
        </View>
      )}
      <SortOptionSheet
        visible={sortOpen}
        onDismiss={() => setSortOpen(false)}
        title="Sort accounts"
        subtitle="Choose how the account grid is ordered."
        options={ACCOUNT_SORT_OPTIONS}
        value={sortField}
        direction={sortDirection}
        resetDirection="asc"
        onChange={(value) => setSortField(value as AccountSortField)}
        onDirectionChange={(direction) => setSortDirection(direction)}
      />
    </View>
  );
}
