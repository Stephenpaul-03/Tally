import { useStagger } from "@/components/animations/UseStagger";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { CategoryTile } from "@/modules/Management/Category/Components/CategoryTile";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
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
  reorderMode: boolean;
  onToggleReorderMode: () => void;
  onBack: () => void;
  onClose: () => void;
  theme: MD3Theme;
}

type DragState = {
  active: boolean;
  fromIndex: number;
  toIndex: number;
};

function reorder(ids: string[], fromIndex: number, toIndex: number): string[] {
  const next = [...ids];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function DraggableAccountList({
  accounts,
  onReorder,
  onDragStart,
  onDragEnd,
  management,
  theme,
  getAnimStyle,
}: {
  accounts: string[];
  onReorder: (next: string[]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  management: ReturnType<typeof useAccountManagement>;
  theme: MD3Theme;
  getAnimStyle: (index: number) => any;
}) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;

  const [dragState, setDragState] = useState<DragState>({
    active: false,
    fromIndex: -1,
    toIndex: -1,
  });

  const dragIndexRef = useRef(-1);
  const currentOrderRef = useRef(accounts);
  currentOrderRef.current = accounts;

  const rowAbsoluteYsRef = useRef<number[]>([]);
  const rowViewRefs = useRef<(View | null)[]>([]);

  const measureRows = useCallback((): Promise<number[]> => {
    return new Promise((resolve) => {
      const len = currentOrderRef.current.length;
      const ys: number[] = new Array(len).fill(0);
      let remaining = len;
      if (remaining === 0) {
        resolve(ys);
        return;
      }
      currentOrderRef.current.forEach((_, i) => {
        const ref = rowViewRefs.current[i];
        if (!ref) {
          remaining--;
          if (remaining === 0) resolve(ys);
          return;
        }
        ref.measure((_x, _y, _w, h, _px, pageY) => {
          ys[i] = pageY + h / 2;
          remaining--;
          if (remaining === 0) resolve(ys);
        });
      });
    });
  }, []);

  const handleGrant = useCallback(
    async (index: number) => {
      dragIndexRef.current = index;
      const ys = await measureRows();
      rowAbsoluteYsRef.current = ys;
      setDragState({ active: true, fromIndex: index, toIndex: index });
      onDragStart();
    },
    [measureRows, onDragStart],
  );

  const indexForPageY = useCallback((pageY: number): number => {
    const ys = rowAbsoluteYsRef.current;
    const len = currentOrderRef.current.length;
    if (ys.length === 0) return dragIndexRef.current;

    let closest = -1;
    let closestDist = Infinity;
    for (let i = 0; i < len; i++) {
      if (i === dragIndexRef.current) continue;
      const dist = Math.abs(pageY - (ys[i] ?? 0));
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest === -1 ? dragIndexRef.current : closest;
  }, []);

  const handleMove = useCallback(
    (pageY: number) => {
      if (dragIndexRef.current < 0) return;
      const toIndex = indexForPageY(pageY);
      setDragState((prev) =>
        prev.toIndex === toIndex ? prev : { ...prev, toIndex },
      );
    },
    [indexForPageY],
  );

  const handleRelease = useCallback(
    (pageY: number) => {
      if (dragIndexRef.current < 0) return;
      const fromIndex = dragIndexRef.current;
      const toIndex = indexForPageY(pageY);

      dragIndexRef.current = -1;
      rowAbsoluteYsRef.current = [];
      setDragState({ active: false, fromIndex: -1, toIndex: -1 });
      onDragEnd();

      if (toIndex !== fromIndex) {
        const next = reorder(currentOrderRef.current, fromIndex, toIndex);
        onReorder(next);
      }
    },
    [indexForPageY, onDragEnd, onReorder],
  );

  const handleTerminate = useCallback(() => {
    dragIndexRef.current = -1;
    rowAbsoluteYsRef.current = [];
    setDragState({ active: false, fromIndex: -1, toIndex: -1 });
    onDragEnd();
  }, [onDragEnd]);

  const displayAccounts = dragState.active
    ? reorder(accounts, dragState.fromIndex, dragState.toIndex)
    : accounts;

  return (
    <View>
      {displayAccounts.map((name, displayIndex) => {
        const originalIndex = accounts.indexOf(name);
        const isDragging =
          dragState.active && originalIndex === dragState.fromIndex;
        const color = management.getAccountColor(name);
        const icon = management.getAccountIcon(name);

        return (
          <Animated.View
            key={name}
            ref={(r) => {
              rowViewRefs.current[originalIndex] = r as View | null;
            }}
            style={[{ marginBottom: 8 }, getAnimStyle(originalIndex)]}
          >
            <View
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => handleGrant(originalIndex)}
              onResponderMove={(e) => handleMove(e.nativeEvent.pageY)}
              onResponderRelease={(e) => handleRelease(e.nativeEvent.pageY)}
              onResponderTerminate={handleTerminate}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: isDragging
                  ? c.elevation.level3
                  : c.elevation.level1,
                borderWidth: isDragging ? 1 : 0.5,
                borderColor: isDragging ? c.primary : c.outlineVariant,
                opacity: isDragging ? 0.5 : 1,
              }}
            >
              {/* Drag handle icon — visual only */}
              <View style={{ paddingRight: 4, paddingVertical: 4 }}>
                <MaterialCommunityIcons
                  name="drag-horizontal-variant"
                  size={20}
                  color={isDragging ? c.primary : c.onSurfaceVariant}
                  style={{ opacity: isDragging ? 1 : 0.5 }}
                />
              </View>

              {/* Icon */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.background,
                }}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={18}
                  color={minimalIconsEnabled ? c.primary : color}
                />
              </View>

              {/* Name + badge */}
              <View style={{ flex: 1, gap: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: c.onSurface,
                  }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                {PROTECTED_ACCOUNTS.has(name) ? (
                  <Text
                    style={{
                      fontSize: 10,
                      color: c.onSurfaceVariant,
                      opacity: 0.7,
                    }}
                  >
                    Default
                  </Text>
                ) : null}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function AccountListScreen({
  management,
  selectedAccount,
  onSelectAccount,
  showBack = false,
  hideCloseButton = false,
  listHeight,
  reorderMode,
  onToggleReorderMode,
  onBack,
  onClose,
  theme,
}: AccountListScreenProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;
  const accounts = management.activeAccounts;
  const isPickerMode = Boolean(onSelectAccount);

  const [localAccounts, setLocalAccounts] = useState<string[]>(accounts);
  const [isDragging, setIsDragging] = useState(false);

  const { getAnimStyle } = useStagger({
    count: accounts.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: `${reorderMode ? "reorder" : "grid"}-${[...accounts].sort().join("|")}`,
  });

  // Keep localAccounts in sync when accounts changes externally
  // (e.g. after add/delete) but not during an active drag
  const prevAccountsRef = useRef(accounts);
  if (
    !isDragging &&
    accounts !== prevAccountsRef.current &&
    accounts.join(",") !== localAccounts.join(",")
  ) {
    prevAccountsRef.current = accounts;
    setLocalAccounts(accounts);
  }

  const handleReorder = useCallback(
    (next: string[]) => {
      setLocalAccounts(next);
      management.handleReorderAccounts(next);
    },
    [management],
  );

  const rows = Array.from({ length: Math.ceil(accounts.length / 2) }, (_, i) =>
    accounts.slice(i * 2, i * 2 + 2),
  );

  return (
    <View style={{ flex: 1 }}>
      <AccountModalHeader
        title="Accounts"
        subtitle={
          reorderMode
            ? "Drag handle to reorder"
            : `${management.counts.accounts} available`
        }
        iconName="wallet-outline"
        showBack={showBack}
        rightAccessory={
          !isPickerMode ? (
            <TouchableRipple
              onPress={onToggleReorderMode}
              borderless
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: reorderMode
                  ? c.primaryContainer
                  : c.elevation.level1,
                borderWidth: 0.5,
                borderColor: reorderMode ? c.primary : c.outlineVariant,
              }}
            >
              <MaterialCommunityIcons
                name={reorderMode ? "check" : "swap-vertical"}
                size={18}
                color={reorderMode ? c.primary : c.onSurfaceVariant}
              />
            </TouchableRipple>
          ) : undefined
        }
        onBack={onBack}
        onClose={onClose}
        hideCloseButton={hideCloseButton}
        theme={theme}
      />

      <View style={{ marginTop: 8, marginBottom: 4, marginHorizontal: 16 }}>
        <Text
          style={{
            color: c.onSurfaceVariant,
            opacity: 0.7,
            ...typography.editorial.sectionLabel,
            fontSize: 12,
          }}
        >
          Payment accounts
        </Text>
      </View>

      <View style={{ height: listHeight, marginHorizontal: 12 }}>
        {reorderMode ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDragging}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <DraggableAccountList
              accounts={localAccounts}
              onReorder={handleReorder}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              management={management}
              theme={theme}
              getAnimStyle={getAnimStyle}
            />
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          >
            {rows.map((row, rowIndex) => (
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
            ))}
          </ScrollView>
        )}
      </View>

      {!reorderMode && !isPickerMode && (
        <View style={{ padding: 12, marginTop: "auto" }}>
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
    </View>
  );
}
