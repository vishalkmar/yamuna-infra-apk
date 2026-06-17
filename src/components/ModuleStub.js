import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from './ScreenContainer';
import Card from './Card';
import StatusChip from './StatusChip';
import { palette, spacing, typography } from '../theme';

export default function ModuleStub({ title, description, apiEndpoints = [] }) {
  return (
    <ScreenContainer>
      <Card style={{ marginBottom: spacing.md }}>
        <StatusChip label="COMING SOON" variant="warning" />
        <Text style={[typography.h2, { marginTop: spacing.sm }]}>{title}</Text>
        <Text style={[typography.bodyMuted, { marginTop: 6 }]}>{description}</Text>
      </Card>

      {apiEndpoints.length > 0 ? (
        <Card>
          <Text style={typography.h3}>API Endpoints</Text>
          <View style={{ marginTop: spacing.sm }}>
            {apiEndpoints.map((e, i) => (
              <View key={i} style={styles.endpointRow}>
                <Text style={styles.method}>{e.method}</Text>
                <Text style={styles.path}>{e.path}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  endpointRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
  },
  method: {
    width: 56,
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary,
  },
  path: { flex: 1, fontSize: 12, color: palette.textMuted, fontFamily: 'monospace' },
});
