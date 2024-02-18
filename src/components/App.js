import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import config from '../config';



// Components
import Navigation from './Navigation';
import Tabs from './Tabs';
import Swap from './Swap';
import Deposit from './Deposit';
import Withdraw from './Withdraw';
import Charts from './Charts';
import Aggregator from './Aggregator';
import StockTicker from './StockTicker';

// Blockchain interactions
import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM,
  loadAggregator,
  loadAmmData
} from '../store/interactions';

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    const provider = loadProvider(dispatch);
    const chainId = await loadNetwork(provider, dispatch);

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch);
    });

    await loadTokens(provider, chainId, dispatch);

    await loadAMM(provider, chainId, 'amm1', dispatch); // Load AMM1
    await loadAMM(provider, chainId, 'amm2', dispatch); // Load AMM2
    await loadAggregator(provider, chainId, dispatch); // Load Aggregator

    // Load AMM Data  into Aggregator Store
    const amm1 = config[chainId].amm1.address;
    const amm2 = config[chainId].amm2.address;
    await loadAmmData(provider, amm1, amm2, dispatch);

  };

  useEffect(() => {
    loadBlockchainData();
  }, [dispatch]);

  return (
    <Container>
      <HashRouter>
        <StockTicker />
        <Navigation />
        <hr style={{color:"beige"}}/>
        <Tabs />

        <Routes>
          <Route path="/Aggregator" element={<Aggregator />} />
          <Route exact path="/" element={<Swap />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/charts" element={<Charts />} />

        </Routes>
      </HashRouter>
    </Container>
  );
}

export default App;
