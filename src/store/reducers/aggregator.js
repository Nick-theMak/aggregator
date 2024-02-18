// Aggregator.js (Redux Reducer)
import { createSlice } from '@reduxjs/toolkit';

export const aggregator = createSlice({
  name: 'aggregator',
  initialState: {
    contract: null,
    ammData: {
      amm1: {
        token1Balance: '0',
        token2Balance: '0',
        rate1to2: '0',
        rate2to1: '0'
      },
      amm2: {
        token1Balance: '0',
        token2Balance: '0',
        rate1to2: '0',
        rate2to1: '0'
      }
    },
    
  },
  reducers: {
    setAggregatorContract: (state, action) => {
      state.contract = action.payload;
    },
    
    updateAmmData: (state, action) => {
      const { ammNumber, data } = action.payload;
      state.ammData[ammNumber] = { ...state.ammData[ammNumber], ...data };
    },
  }
});

export const { setAggregatorContract, updateAmmData, setPrices } = aggregator.actions;
export default aggregator.reducer;
