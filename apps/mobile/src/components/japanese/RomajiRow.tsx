import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, typography } from '../../theme';

type Size = keyof typeof typography.pinyin;

type Props = {
  romaji: string;
  size?: Size;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
};

export function RomajiRow({ romaji, size = 'md', style, align = 'center' }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          justifyContent:
            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <Text style={[typography.pinyin[size], styles.text, style]}>{romaji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  text: { color: colors.text.secondary },
});
