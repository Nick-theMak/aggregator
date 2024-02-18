// Store.js
import { configureStore } from '@reduxjs/toolkit';
import provider from './reducers/provider';
import tokens from './reducers/tokens';
import amm from './reducers/amm';
import aggregator from './reducers/aggregator'; 

export const store = configureStore({
  reducer: {
    provider,
    tokens,
    amm,
    aggregator, 
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});
