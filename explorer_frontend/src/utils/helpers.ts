// src/utils/helpers.ts

import axios from 'axios';


export const getBitcoinPrice = async (): Promise<number> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=aud');
    return response.data.bitcoin.aud;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0; // Return 0 or some default value in case of an error
  }
};

export const calculateBTCAmount = (audAmount: number, btcPrice: number): number => {
  return audAmount / btcPrice;
};