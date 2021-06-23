import axios from 'axios';
import {
  ETH_GAS_STATION_API_KEY,
  ETHERSCAN_API_KEY,
} from 'react-native-dotenv';
import { multiply } from '../helpers/utilities';
import { ethUnits } from '@rainbow-me/references';

/**
 * Configuration for defipulse API
 * @type axios instance
 */
const ethGasstationApi = axios.create({
  baseURL: 'https://data-api.defipulse.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get ethereum gas prices
 * @return {Promise}
 */
export const ethGasStationGetGasPrices = () =>
  ethGasstationApi.get(
    `/api/v1/egs/api/ethgasAPI.json?api-key=${ETH_GAS_STATION_API_KEY}`
  );

/**
 * Configuration for Matic GAS Station API
 * @type axios instance
 */
const maticGasstationApi = axios.create({
  baseURL: 'https://gasstation-mainnet.matic.network',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get Matic gas prices
 * @return {Promise}
 */
export const maticGasStationGetGasPrices = () => maticGasstationApi.get(`/`);

/**
 * Configuration for Etherscan API
 * @type axios instance
 */
const etherscanAPI = axios.create({
  baseURL: 'https://api.etherscan.io',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

/**
 * @desc get ethereum gas prices from Etherscan
 * @return {Promise}
 */
export const etherscanGetGasPrices = () =>
  etherscanAPI.get(
    `/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
  );

/**
 * @desc get matic time estimates
 * @params {data}
 * @return {Promise}
 */
export const maticGetGasEstimates = data => {
  return {
    ...data,
    avgWait: 0.5,
    fastWait: 0.2,
    safeLowWait: 1,
  };
};

/**
 * @desc get ethereum gas prices from Etherscan
 * @params {data}
 * @return {Promise}
 */
export const etherscanGetGasEstimates = async data => {
  const requests = Object.keys(data).map(speed => {
    return new Promise(async resolve => {
      const time = await getEstimatedTimeForGasPrice(data[speed]);
      resolve({
        [`${speed === 'average' ? 'avg' : speed}Wait`]: time,
      });
    });
  });

  let newData = { ...data };

  const estimates = await Promise.all(requests);
  estimates.forEach(estimate => {
    newData = {
      ...newData,
      ...estimate,
    };
  });

  return newData;
};

/**
 * @desc get estimated time for a specific gas price from Etherscan
 * @return {Promise}
 */
export const getEstimatedTimeForGasPrice = async gwei => {
  const priceInWei = multiply(gwei, ethUnits.gwei);
  const { data: response } = await etherscanAPI.get(
    `/api?module=gastracker&action=gasestimate&gasprice=${priceInWei}&apikey=${ETHERSCAN_API_KEY}`
  );
  if (response.status === '0') {
    throw new Error('Etherscan gas estimation request failed');
  }
  return Number(response.result) / 60;
};
