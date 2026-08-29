import { useStagger } from "@/components/animations/UseStagger";
import { SectionLabel } from "@/components/SectionLabel";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { CategoryTile } from "@/modules/Management/Category/Components/CategoryTile";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import { Text } from "react-native-paper";
import { AccountModalHeader } from "../Components/ModalHeader";

interface AccountDeleteContentProps {
  management: ReturnType<typeof useAccountManagement>;
  deletingName: string;
  deleteDestinations: string[];
  localDest: string;
  canConfirmDelete: boolean;
  onSelectDest: (dest: string) => void;
  onConfirmDelete: () => void;
  footer?: React.ReactNode;
  theme: MD3Theme;
  modal?: boolean;
}

type AccountDeleteScreenProps = AccountDeleteContentProps & {
  onBack: () => void;
  onClose: () => void;
};

type AccountDeleteModalProps = AccountDeleteContentProps & {
  onBack: () => void;
  onClose: () => void;
  hideCloseButton?: boolean;
  visible?: boolean;
  embedded?: boolean;
};

function AccountDeleteContent({
  management,
  deletingName,
  deleteDestinations,
  localDest,
  canConfirmDelete,
  onSelectDest,
  onConfirmDelete,
  footer,
  theme,
  modal = false,
}: AccountDeleteContentProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;
  const divider = c.outlineVariant;

  const deletingIcon = management.getAccountIcon(deletingName);
  const deletingColor = management.getAccountColor(deletingName);
  const rows: string[][] = [];
  for (let i = 0; i < deleteDestinations.length; i += 2) {
    rows.push(deleteDestinations.slice(i, i + 2));
  }

  const { getAnimStyle } = useStagger({
    count: deleteDestinations.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: deleteDestinations.join("|"),
  });

  return (
    <>
      {/* Preview — mirrors category DeleteScreen layout */}
      <View style={{ margin: 12 }}>
        <View
          style={{
            borderRadius: 16,
            backgroundColor: theme.colors.background,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.elevation.level1,
            }}
          >
            <MaterialCommunityIcons
              name={(deletingIcon || "wallet-outline") as any}
              size={96}
              color={minimalIconsEnabled ? c.primary : deletingColor}
            />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {deletingName}
          </Text>
          {management.deleteAffectCount > 0 && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: `${c.onSurface}10`,
                  borderWidth: 0.5,
                  borderColor: divider,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: c.onSurfaceVariant,
                  }}
                >
                  {management.deleteAffectCount} transaction(s) affected
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Reassign destinations */}
      {deleteDestinations.length > 0 && (
        <>
          <SectionLabel label="Move transactions to" />
          <View
            style={{
              flex: modal ? 0 : 1,
              marginHorizontal: 12,
              maxHeight: modal ? 280 : undefined,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            >
              {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: "row", gap: 8 }}>
                  {row.map((dest, itemIndex) => {
                    const animatedIndex = rowIndex * 2 + itemIndex;
                    return (
                      <Animated.View
                        key={dest}
                        style={[
                          { flex: 1, maxWidth: "50%" },
                          getAnimStyle(animatedIndex),
                        ]}
                      >
                        <CategoryTile
                          name={dest}
                          icon={management.getAccountIcon(dest)}
                          color={management.getAccountColor(dest)}
                          iconColorOverride={
                            minimalIconsEnabled
                              ? theme.colors.primary
                              : undefined
                          }
                          transactionCount={
                            management.accountStats[dest]?.count ?? 0
                          }
                          isSelected={localDest === dest}
                          pickerMode
                          onPress={() => onSelectDest(dest)}
                          theme={theme}
                        />
                      </Animated.View>
                    );
                  })}
                  {row.length === 1 ? (
                    <View style={{ flex: 1, maxWidth: "50%" }} />
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {footer ?? (
        <View
          style={{
            flexDirection: "row",
            margin: 12,
            marginTop: modal ? 0 : "auto",
          }}
        >
          <Pressable
            onPress={onConfirmDelete}
            disabled={!canConfirmDelete}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: `${c.error}18`,
              borderWidth: 1,
              borderColor: `${c.error}44`,
              opacity: pressed ? 0.65 : !canConfirmDelete ? 0.4 : 1,
            })}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={18}
              color={c.error}
            />
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 14,
                color: c.error,
              }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

export function AccountDeleteScreen(props: AccountDeleteScreenProps) {
  return (
    <>
      <SettingsHeader title="Delete account" onBack={props.onBack} />
      <AccountDeleteContent {...props} />
    </>
  );
}

export function AccountDeleteModal(props: AccountDeleteModalProps) {
  const {
    theme,
    onBack,
    onClose,
    hideCloseButton = false,
    visible = true,
    embedded = false,
    ...contentProps
  } = props;

  const content = (
    <>
      <AccountModalHeader
        title="Delete account"
        subtitle="Cannot be undone"
        showBack
        accentColor={theme.colors.error}
        iconName="delete-outline"
        onBack={onBack}
        onClose={onClose}
        hideCloseButton={hideCloseButton}
        modal
        theme={theme}
      />
      <AccountDeleteContent
        {...contentProps}
        theme={theme}
        modal
      />
    </>
  );

  if (embedded) return content;

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onBack}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        justifyContent: "flex-start",
        maxHeight: "92%",
        overflow: "hidden",
      }}
    >
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 6 }}>
        <View
          style={{
            backgroundColor: theme.colors.outlineVariant,
            borderRadius: 999,
            height: 4,
            width: 42,
          }}
        />
      </View>
      {content}
    </AnimatedPaperModal>
  );
}
