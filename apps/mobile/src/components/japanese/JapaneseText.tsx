import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, typography } from '../../theme';

type Size = keyof typeof typography.hanzi;

type Props = {
  text: string;
  size?: Size;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
};

export function JapaneseText({ text, size = 'md', align = 'center', style }: Props) {
  return (
    <View
      style={[
        styles.row,
        {
          justifyContent:
            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <Text style={[typography.hanzi[size], styles.text, style]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  text: { color: colors.text.primary },
});
