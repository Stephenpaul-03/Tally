import React from "react";
import { Pressable, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  openDraftModal,
  selectTransactionDrafts,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { sortedHomeDrafts } from "./homeAttentionModel";
import { useClassicHome } from "./HomeCardContext";
import { HomeDraftPicker } from "./HomeDraftPicker";

export function HomeDraftAction({
  active,
  currency,
  symbol,
}: {
  active: boolean;
  currency: string;
  symbol: string;
}) {
  const { colors: c } = useTheme();
  const classic = useClassicHome();
  const dispatch = useAppDispatch();
  const drafts = useAppSelector(selectTransactionDrafts);
  const workspace = useAppSelector(selectActiveWorkspace);
  const ordered = React.useMemo(() => sortedHomeDrafts(drafts), [drafts]);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    setOpen(false);
  }, [active, workspace?.id]);
  if (!ordered.length) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Continue a draft, ${ordered.length} ${ordered.length === 1 ? "unfinished entry" : "unfinished entries"}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: classic ? "transparent" : c.surfaceVariant,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Icon name="file-document-edit-outline" size={21} color={c.primary} />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 1,
            right: 0,
            minWidth: 14,
            height: 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.primary,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: c.onPrimary }}>
            {ordered.length}
          </Text>
        </View>
      </Pressable>
      <HomeDraftPicker
        visible={active && open}
        drafts={ordered}
        currency={currency}
        symbol={symbol}
        onClose={() => setOpen(false)}
        onChoose={(id) => {
          setOpen(false);
          dispatch(openDraftModal(id));
        }}
      />
    </>
  );
}
