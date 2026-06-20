import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { accountChips } from "../Styles";

interface AccountOption {
  name: string;
  icon: string;
  color: string;
}

interface AccountChipsProps {
  value: string;
  options: AccountOption[];
  onSelect?: (name: string) => void; // ← new
}

export function AccountChips({ value, options, onSelect }: AccountChipsProps) {
  const theme = useTheme<MD3Theme>();
  const { minimalIconsEnabled } = useAddonPrefs();
  const visibleOptions = React.useMemo(() => {
    const selectedIndex = options.findIndex((o) => o.name === value);

    if (selectedIndex <= 1) {
      // Selected is already in first two — just show first two as-is
      return options.slice(0, 2);
    }

    // Selected is beyond slot 1 — show it in slot 0, keep slot 1 as options[1]
    return [options[selectedIndex], options[1]];
  }, [options, value]);

  return (
    <View style={accountChips.container}>
      {visibleOptions.map((opt) => {
        const active = value === opt.name;
        return (
          <Pressable
            key={opt.name}
            onPress={(e) => {
              e.stopPropagation();
              onSelect?.(opt.name);
            }}
            style={({ pressed }) => [
              accountChips.chip,
              {
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.elevation.level5,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={accountChips.chipContent}>
              <MaterialCommunityIcons
                name={opt.icon as any}
                size={14}
                color={
                  active
                    ? minimalIconsEnabled
                      ? theme.colors.primary
                      : opt.color
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                variant="labelSmall"
                style={[
                  accountChips.chipLabel,
                  {
                    color: theme.colors.onSurface, // ← text matches icon color
                    fontWeight: active ? "700" : "400", // ← subtle weight bump for active
                  },
                ]}
              >
                {opt.name}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
