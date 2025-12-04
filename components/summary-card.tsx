import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SummaryCardProps = {
  value: string | number;
  label: string;
};

export function SummaryCard({ value, label }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <ThemedText type="defaultSemiBold" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  value: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    lineHeight: 34,
    includeFontPadding: false,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    includeFontPadding: false,
  },
});

