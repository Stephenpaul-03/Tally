import { useTheme, type MD3Theme } from 'react-native-paper';

type LegacyColorName =
  | 'text'
  | 'background'
  | 'tint'
  | 'icon'
  | 'tabIconDefault'
  | 'tabIconSelected';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: LegacyColorName
) {
  const theme = useTheme<MD3Theme>();
  const colorFromProps = theme.dark ? props.dark : props.light;
  if (colorFromProps) return colorFromProps;

  switch (colorName) {
    case 'text':
      return theme.colors.onBackground;
    case 'background':
      return theme.colors.background;
    case 'tint':
    case 'tabIconSelected':
      return theme.colors.primary;
    case 'icon':
    case 'tabIconDefault':
      return theme.colors.onSurfaceVariant;
    default:
      return theme.colors.onBackground;
  }
}
