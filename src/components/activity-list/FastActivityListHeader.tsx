import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rainbow-me/design-system';

const cx = StyleSheet.create({
  activityListHeader: {
    paddingBottom: 18,
    paddingHorizontal: 19,
    paddingTop: 21,
  },
});

const ActivityListHeader = ({ title }: { title: string }) => (
  <View style={cx.activityListHeader}>
    <Text size="20px" weight="bold">
      {title}
    </Text>
  </View>
);

export default React.memo(ActivityListHeader);
