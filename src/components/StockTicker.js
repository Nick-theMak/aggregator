import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './StockTicker.css';

const StockTicker = () => {
  const ammData = useSelector(state => state.aggregator.ammData);
  const [rates, setRates] = useState([]);

  useEffect(() => {
    if (ammData.amm1 && ammData.amm2) {
      setRates([
        {
          amm: 'AMM1',
          usdToDapp: parseFloat(ammData.amm1.rate2to1).toFixed(3),
          dappToUsd: parseFloat(ammData.amm1.rate1to2).toFixed(3),
        },
        {
          amm: 'AMM2',
          usdToDapp: parseFloat(ammData.amm2.rate2to1).toFixed(3),
          dappToUsd: parseFloat(ammData.amm2.rate1to2).toFixed(3),
        },
      ]);
    }
  }, [ammData]);

  return (
    <div className="led-ticker-container">
      <div className="led-ticker">
        {rates.map((rate, index) => (
          <React.Fragment key={index}>
            <div className="stock-item">
              <span className="stock-symbol">{rate.amm}:   </span>
              <span className="stock-price"> USD/DAPP: {rate.usdToDapp}</span>
              <span className="stock-price">DAPP/USD: {rate.dappToUsd}</span>
            </div>
            {index < rates.length - 1 && <div className="stock-divider"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StockTicker;
