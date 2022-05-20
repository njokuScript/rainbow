import lang from 'i18n-js';
import { compact, get, startCase, toLower } from 'lodash';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, View } from 'react-native';
import { Text } from '../text';
import { useTheme } from '../../context/ThemeContext';
import { getRandomColor } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import CoinName from './CoinName';
import { TransactionStatusTypes, TransactionTypes } from '@rainbow-me/entities';
import TransactionActions from '@rainbow-me/helpers/transactionActions';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '@rainbow-me/helpers/transactions';
import { isValidDomainFormat } from '@rainbow-me/helpers/validators';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import { RenderProfiler } from '@rainbow-me/performance/utils';
import FastTransactionStatusBadge from './FastTransactionStatusBadge';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import TruncatedText from '../text/TruncatedText';

const cx = StyleSheet.create({
  wholeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
    paddingVertical: 10,
  },
  column: {
    flex: 1,
    marginLeft: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
});

const BottomRow = ({
  description,
  native,
  status,
  type,
}: {
  description: string;
  native: string;
  status: keyof typeof TransactionStatusTypes;
  type: keyof typeof TransactionTypes;
}) => {
  const { colors } = useTheme();
  const isFailed = status === TransactionStatusTypes.failed;
  const isReceived =
    status === TransactionStatusTypes.received ||
    status === TransactionStatusTypes.purchased;
  const isSent = status === TransactionStatusTypes.sent;

  const isOutgoingSwap = status === TransactionStatusTypes.swapped;
  const isIncomingSwap =
    status === TransactionStatusTypes.received &&
    type === TransactionTypes.trade;

  let coinNameColor = colors.dark;
  if (isOutgoingSwap) coinNameColor = colors.alpha(colors.blueGreyDark, 0.5);

  let balanceTextColor = colors.alpha(colors.blueGreyDark, 0.5);
  if (isReceived) balanceTextColor = colors.green;
  if (isSent) balanceTextColor = colors.dark;
  if (isIncomingSwap) balanceTextColor = colors.swapPurple;
  if (isOutgoingSwap) balanceTextColor = colors.dark;

  const nativeDisplay = get(native, 'display');
  const balanceText = nativeDisplay
    ? compact([isFailed || isSent ? '-' : null, nativeDisplay]).join(' ')
    : '';

  return (
    <View style={cx.topRow}>
      <CoinName color={coinNameColor}>{description}</CoinName>
      <Text
        align="right"
        color={balanceTextColor || colors.dark}
        size="lmedium"
        weight={isReceived ? 'medium' : null}
      >
        {balanceText}
      </Text>
    </View>
  );
};

const TopRow = ({
  balance,
  pending,
  status,
  title,
}: {
  balance: string;
  pending: boolean;
  status: keyof typeof TransactionStatusTypes;
  title: string;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <FastTransactionStatusBadge
        pending={pending}
        status={status}
        title={title}
      />
      <TruncatedText
        size="smedium"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        align="right"
      >
        {get(balance, 'display', '')}
      </TruncatedText>
    </View>
  );
};

export default function TransactionCoinRow({ item, ...props }: { item: any }) {
  const { contact } = item;
  const { accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();

  const onPressTransaction = useCallback(async () => {
    const { hash, from, minedAt, pending, to, status, type, network } = item;

    const date = getHumanReadableDate(minedAt);
    const isSent =
      status === TransactionStatusTypes.sending ||
      status === TransactionStatusTypes.sent;
    const showContactInfo = hasAddableContact(status, type);

    const isOutgoing = toLower(from) === toLower(accountAddress);
    const canBeResubmitted = isOutgoing && !minedAt;
    const canBeCancelled =
      canBeResubmitted && status !== TransactionStatusTypes.cancelling;

    const headerInfo = {
      address: '',
      divider: isSent
        ? lang.t('exchange.coin_row.to_divider')
        : lang.t('exchange.coin_row.from_divider'),
      type: status.charAt(0).toUpperCase() + status.slice(1),
    };

    const contactAddress = isSent ? to : from;
    let contactColor = 0;

    if (contact) {
      headerInfo.address = contact.nickname;
      contactColor = contact.color;
    } else {
      headerInfo.address = isValidDomainFormat(contactAddress)
        ? contactAddress
        : abbreviations.address(contactAddress, 4, 10);
      contactColor = getRandomColor();
    }

    const blockExplorerAction = lang.t('exchange.coin_row.view_on', {
      blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
    });
    if (hash) {
      let buttons = [
        ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
        ...(canBeCancelled ? [TransactionActions.cancel] : []),
        blockExplorerAction,
        ...(ios ? [TransactionActions.close] : []),
      ];
      if (showContactInfo) {
        buttons.unshift(
          contact
            ? TransactionActions.viewContact
            : TransactionActions.addToContacts
        );
      }

      showActionSheetWithOptions(
        {
          cancelButtonIndex: buttons.length - 1,
          options: buttons,
          title: pending
            ? `${headerInfo.type}${
                showContactInfo
                  ? ' ' + headerInfo.divider + ' ' + headerInfo.address
                  : ''
              }`
            : showContactInfo
            ? `${headerInfo.type} ${date} ${headerInfo.divider} ${headerInfo.address}`
            : `${headerInfo.type} ${date}`,
        },
        (buttonIndex: number) => {
          const action = buttons[buttonIndex];
          switch (action) {
            case TransactionActions.viewContact:
            case TransactionActions.addToContacts:
              navigate(Routes.MODAL_SCREEN, {
                address: contactAddress,
                asset: item,
                color: contactColor,
                contact,
                type: 'contact_profile',
              });
              break;
            case TransactionActions.speedUp:
              navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
                tx: item,
                type: 'speed_up',
              });
              break;
            case TransactionActions.cancel:
              navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
                tx: item,
                type: 'cancel',
              });
              break;
            case TransactionActions.close:
              return;
            case blockExplorerAction:
              ethereumUtils.openTransactionInBlockExplorer(hash, network);
              break;
            default: {
              return;
            }
          }
        }
      );
    }
  }, [accountAddress, contact, item, navigate]);

  const mainnetAddress = useSelector(
    state =>
      state.data.accountAssetsData?.[`${item.address}_${item.network}`]
        ?.mainnet_address
  );

  const theme = useTheme();

  return (
    <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
      <RenderProfiler name="CoinRow" update>
        <View style={cx.wholeRow}>
          <FastCoinIcon
            address={mainnetAddress || item.address}
            symbol={item.symbol}
            assetType={item.assetType}
            theme={theme}
          />
          <View style={cx.column}>
            <TopRow {...item} />
            <BottomRow {...item} />
          </View>
        </View>
      </RenderProfiler>
    </ButtonPressAnimation>
  );
}
