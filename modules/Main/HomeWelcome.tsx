import { useClassicHome } from "./HomeCardContext";
import { typography } from "@/theme/typography";
import { homeGreeting } from "./homeGreeting";
import React from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";

const NAME_KEY = "tally.homeWelcomeName.v1";
export function HomeWelcome({
  active,
  hour,
}: {
  active: boolean;
  hour: number;
}) {
  const { colors: c } = useTheme();
  const classic = useClassicHome();
  const [name, setName] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const touched = React.useRef(false);
  React.useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(NAME_KEY)
      .then((saved) => {
        if (mounted && !touched.current && saved)
          setName(saved.trim().slice(0, 30));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const commit = React.useCallback(() => {
    const next = draft.trim().slice(0, 30);
    setName(next);
    setEditing(false);
    void AsyncStorage.setItem(NAME_KEY, next).catch(() => {});
  }, [draft]);
  React.useEffect(() => {
    if (!active && editing) {
      commit();
      Keyboard.dismiss();
    }
  }, [active, editing, commit]);
  return (
    <View style={{ gap: 0 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: c.onSurface,
          opacity: 0.8,
        }}
      >
        {homeGreeting(hour)},
      </Text>
      {editing ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            accessibilityLabel="Your welcome name"
            autoFocus
            maxLength={30}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            returnKeyType="done"
            placeholder="Your name"
            placeholderTextColor={c.onSurface}
            selectionColor={c.primary}
            style={{
              flex: 1,
              minHeight: 44,
              padding: 0,
              fontFamily: classic
                ? typography.bodyStrong.fontFamily
                : "Figtree-800",
              fontSize: 22,
              color: classic ? c.onSurface : c.onPrimaryContainer,
            }}
          />
          <Text style={{ fontSize: 11, color: c.onSurface }}>
            {draft.length}/30
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save welcome name"
            onPress={() => {
              commit();
              Keyboard.dismiss();
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.secondaryContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={22} color={c.onSecondaryContainer} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            name ? `Edit welcome name, ${name}` : "Add your name"
          }
          onPress={() => {
            touched.current = true;
            setDraft(name);
            setEditing(true);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minHeight: 44,
            alignSelf: "flex-start",
            maxWidth: "100%",
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.2}
            style={{
              fontSize: classic ? 23 : 28,
              fontWeight: classic ? "700" : "800",
              ...(classic ? typography.bodyStrong : {}),
              color: classic ? c.onSurface : c.onPrimaryContainer,
              flexShrink: 1,
            }}
          >
            {name || "Your name"}
          </Text>
          {!name ? (
            <Icon name="pencil-outline" size={18} color={c.primary} />
          ) : null}
        </Pressable>
      )}
    </View>
  );
}
