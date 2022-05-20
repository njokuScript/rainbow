import React from 'react';
import { format } from 'date-fns';
import { get, groupBy, isEmpty, map, toLower } from 'lodash';
import { createSelector } from 'reselect';
import { FastTransactionCoinRow, RequestCoinRow } from '../components/coin-row';
import {
  thisMonthTimestamp,
  thisYearTimestamp,
  todayTimestamp,
  yesterdayTimestamp,
} from './transactions';
import { TransactionStatusTypes } from '@rainbow-me/entities';
import { RenderProfiler } from '@rainbow-me/performance/utils';

const contactsSelector = state => state.contacts;
const requestsSelector = state => state.requests;
const transactionsSelector = state => {
  return state.transactions.map(item => {
    return {
      ...item,
      mainnetAddress:
        state.data.accountAssetsData?.[`${item.address}_${item.network}`]
          ?.mainnet_address,
    };
  });
};
const focusedSelector = state => state.isFocused;
const initializedSelector = state => state.initialized;

const groupTransactionByDate = ({ pending, minedAt }) => {
  if (pending) return 'Pending';

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return 'Today';
  if (ts > yesterdayTimestamp) return 'Yesterday';
  if (ts > thisMonthTimestamp) return 'This Month';

  return format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`);
};

const addContactInfo = contacts => txn => {
  const { from, to, status } = txn;
  const isSent = status === TransactionStatusTypes.sent;
  const contactAddress = isSent ? to : from;
  const contact = get(contacts, `${[toLower(contactAddress)]}`, null);
  return {
    ...txn,
    contact,
  };
};

const buildTransactionsSections = (
  contacts,
  requests,
  transactions,
  isFocused,
  initialized
) => {
  if (!isFocused && !initialized) {
    return { sections: [] };
  }

  let sectionedTransactions = [];

  const transactionsWithContacts = map(transactions, addContactInfo(contacts));

  if (!isEmpty(transactionsWithContacts)) {
    const transactionsByDate = groupBy(
      transactionsWithContacts,
      groupTransactionByDate
    );
    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section],
      renderItem: ({ item }) => (
        <RenderProfiler name="TransactionCoinRow" update every mount>
          <FastTransactionCoinRow item={item} />
        </RenderProfiler>
      ),
      title: section,
    }));
    const pendingSectionIndex = sectionedTransactions.findIndex(
      ({ title }) => title === 'Pending'
    );
    if (pendingSectionIndex > 0) {
      const pendingSection = sectionedTransactions.splice(
        pendingSectionIndex,
        1
      );
      sectionedTransactions.unshift(pendingSection[0]);
    }
  }

  let requestsToApprove = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [
      {
        data: requests,
        renderItem: ({ item }) => <RequestCoinRow item={item} />,
        title: 'Requests',
      },
    ];
  }
  return {
    sections: [...requestsToApprove, ...sectionedTransactions],
  };
};

export const buildTransactionsSectionsSelector = createSelector(
  [
    contactsSelector,
    requestsSelector,
    transactionsSelector,
    focusedSelector,
    initializedSelector,
  ],
  buildTransactionsSections
);
