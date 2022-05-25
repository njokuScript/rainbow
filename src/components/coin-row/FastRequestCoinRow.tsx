import { addHours, differenceInMinutes, isPast } from 'date-fns';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { RequestCoinIcon } from '../coin-icon';
import { Emoji } from '../text';
import { Text } from '@rainbow-me/design-system';
import { useNavigation } from '@rainbow-me/navigation';
import { removeRequest } from '@rainbow-me/redux/requests';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';

const cx = StyleSheet.create({
  bottomRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  topRow: {
    flexDirection: 'row',
  },
  wholeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
  },
});

const getPercentageOfTimeElapsed = (startDate: Date, endDate: Date) => {
  const originalDifference = differenceInMinutes(endDate, startDate);
  const currentDifference = differenceInMinutes(endDate, Date.now());

  return Math.floor((currentDifference * 100) / originalDifference);
};

const ClockEmoji = styled(Emoji).attrs({
  name: 'clock4',
  size: 'tiny',
})({
  marginTop: 1.75,
});

export default React.memo(function RequestCoinRow({
  item,
  theme,
}: {
  item: any;
  theme: ReturnType<typeof useTheme>;
}) {
  const buttonRef = useRef();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [expirationColor, setExpirationColor] = useState<string>('');
  const [percentElapsed, setPercentElapsed] = useState<number>(0);
  const { colors } = theme;

  const minutes = expiresAt && differenceInMinutes(expiresAt, Date.now());

  useEffect(() => {
    if (item?.displayDetails?.timestampInMs) {
      const _createdAt = new Date(item.displayDetails.timestampInMs);
      const _expiresAt = addHours(_createdAt, 1);
      const _percentElapsed = getPercentageOfTimeElapsed(
        _createdAt,
        _expiresAt
      );
      setExpiresAt(_expiresAt);
      setPercentElapsed(_percentElapsed);
      setExpirationColor(
        _percentElapsed > 25 ? colors.appleBlue : colors.orange
      );
    }
  }, [colors, item]);

  const handleExpiredRequests = useCallback(() => {
    if (expiresAt && isPast(expiresAt)) {
      dispatch(removeRequest(item.requestId));
    }
  }, [dispatch, expiresAt, item.requestId]);

  const handlePressOpen = useCallback(() => {
    navigate(Routes.CONFIRM_REQUEST, {
      transactionDetails: item,
    });
  }, [item, navigate]);

  useEffect(() => {
    handleExpiredRequests();
  }, [expiresAt, handleExpiredRequests]);

  return (
    <ButtonPressAnimation
      onPress={handlePressOpen}
      scaleTo={0.98}
      waitFor={buttonRef}
    >
      <View style={cx.wholeRow}>
        <RequestCoinIcon
          dappName={item.dappName}
          expirationColor={expirationColor}
          imageUrl={item.imageUrl}
          percentElapsed={percentElapsed}
        />
        <View style={cx.column}>
          <View style={cx.topRow}>
            <ClockEmoji />
            <Text
              color={{ custom: expirationColor }}
              size="14px"
              weight="semibold"
            >
              {lang.t('exchange.coin_row.expires_in', {
                minutes: minutes || 0,
              })}
            </Text>
          </View>
          <View style={cx.bottomRow}>
            <Text
              color={{ custom: expirationColor }}
              size="16px"
              weight="semibold"
            >
              {item.dappName}
            </Text>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
});
