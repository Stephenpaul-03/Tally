// from categoryManagement Screen
import { useStagger } from "@/components/animations/UseStagger";
import { SectionLabel } from "@/components/SectionLabel";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { CategoryTile } from "../Components/CategoryTile";

type DeleteScreenProps = {
  management: ReturnType<typeof useCategoryManagement>;
  deletingName: string;
  deletingType: "income" | "expense";
  deleteDestinations: string[];
  localDest: string;
  setLocalDest: (v: string) => void;
  canConfirmDelete: boolean;
  theme: MD3Theme;
  onConfirmDelete: () => void;
  footer?: React.ReactNode;
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;
};

export function DeleteScreen({
  management,
  deletingName,
  deletingType,
  deleteDestinations,
  localDest,
  setLocalDest,
  canConfirmDelete,
  theme,
  onConfirmDelete,
  footer,
  renderHeader,
}: DeleteScreenProps) {
  const c = theme.colors;
  const divider = c.outlineVariant;
  const { minimalIconsEnabled } = useAddonPrefs();
  const deletingIcon = management.getCategoryIcon(deletingName, deletingType);
  const deletingColor = management.getCategoryColor(deletingName, deletingType);
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
      {renderHeader({
        title: "Delete category",
        subtitle: "Cannot be undone",
        showBack: true,
        accentColor: c.error,
        iconName: "delete-outline",
      })}

      {/* Preview — mirrors EditScreen layout */}
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
              name={(deletingIcon || "tag-outline") as any}
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
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
          <SectionLabel label="Move transactions to" theme={theme} />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
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
                          icon={management.getCategoryIcon(dest, deletingType)}
                          color={management.getCategoryColor(
                            dest,
                            deletingType,
                          )}
                          iconColorOverride={
                            minimalIconsEnabled
                              ? theme.colors.primary
                              : undefined
                          }
                          transactionCount={
                            management.categoryStats[dest]?.count ?? 0
                          }
                          isSelected={localDest === dest}
                          pickerMode
                          onPress={() => setLocalDest(dest)}
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
            marginTop: "auto",
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
