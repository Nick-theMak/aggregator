// Interactions.js
import { ethers } from 'ethers';

import {
  setProvider,
  setNetwork,
  setAccount
} from './reducers/provider';

import {
  setContracts,
  setSymbols,
  balancesLoaded
} from './reducers/tokens';

import {
  setContract,
  selectAmm,
  sharesLoaded,
  swapsLoaded,
  depositRequest,
  depositSuccess,
  depositFail,
  withdrawRequest,
  withdrawSuccess,
  withdrawFail,
  swapRequest,
  swapSuccess,
  swapFail
} from './reducers/amm';

import {
  setAggregatorContract,
  updateAmmData,
} from './reducers/aggregator';

import TOKEN_ABI from '../abis/Token.json';
import AMM_ABI from '../abis/AMM.json';
import AGGREGATOR_ABI from '../abis/Aggregator.json'; 
import config from '../config.json';

export const loadProvider = (dispatch) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  dispatch(setProvider(provider));

  return provider;
};

export const loadNetwork = async (provider, dispatch) => {
  const { chainId } = await provider.getNetwork();
  dispatch(setNetwork(chainId));

  return chainId;
};

export const loadAccount = async (dispatch) => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = ethers.utils.getAddress(accounts[0]);
  dispatch(setAccount(account));

  return account;
};

// Load Contracts
export const loadTokens = async (provider, chainId, dispatch) => {
  const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider);
  const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider);

  dispatch(setContracts([dapp, usd]));
  dispatch(setSymbols([await dapp.symbol(), await usd.symbol()]));
};

export const loadAMM = async (provider, chainId, ammNumber, dispatch) => {
  // Ensure ammNumber is either 'amm1' or 'amm2'
  if (!['amm1', 'amm2'].includes(ammNumber)) {
    console.error(`Invalid AMM number: ${ammNumber}`);
    return;
  }

  const ammAddress = config[chainId][ammNumber]?.address;
  if (!ammAddress) {
    console.error(`AMM address not found for ${ammNumber} on chain ${chainId}`);
    return;
  }

  const ammContract = new ethers.Contract(ammAddress, AMM_ABI, provider);
  dispatch(setContract({ ammNumber, contract: ammContract }));
};



export const loadAggregator = async (provider, chainId, dispatch) => {
  const aggregatorAddress = config[chainId].aggregator.address;
  const aggregator = new ethers.Contract(aggregatorAddress, AGGREGATOR_ABI, provider);

  dispatch(setAggregatorContract(aggregator));
};


// Load Balances & Shares
export const loadBalances = async (amm, tokens, account, dispatch) => {
  const balance1 = await tokens[0].balanceOf(account);
  const balance2 = await tokens[1].balanceOf(account);

  dispatch(balancesLoaded([
    ethers.utils.formatUnits(balance1.toString(), 'ether'),
    ethers.utils.formatUnits(balance2.toString(), 'ether')
  ]));

  const shares = await amm.shares(account);
  dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')));
};

// Add Liquidity
export const addLiquidity = async (provider, amm, tokens, amounts, dispatch) => {
  try {
    dispatch(depositRequest());

    const signer = provider.getSigner();

    await tokens[0].connect(signer).approve(amm.address, amounts[0]);
    await tokens[1].connect(signer).approve(amm.address, amounts[1]);

    const transaction = await amm.connect(signer).addLiquidity(amounts[0], amounts[1]);
    await transaction.wait();

    dispatch(depositSuccess(transaction.hash));
  } catch (error) {
    console.error('Add liquidity failed:', error);
    dispatch(depositFail());
  }
};

// Remove Liquidity
export const removeLiquidity = async (provider, amm, shares, dispatch) => {
  try {
    dispatch(withdrawRequest());

    const signer = provider.getSigner();
    const transaction = await amm.connect(signer).removeLiquidity(shares);
    await transaction.wait();

    dispatch(withdrawSuccess(transaction.hash));
  } catch (error) {
    console.error('Withdraw failed:', error);
    dispatch(withdrawFail());
  }
};


// Swap
export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
  try {
    dispatch(swapRequest());

    const signer = provider.getSigner();

    // Approve the AMM contract to spend the token
    await token.connect(signer).approve(amm.address, amount);

    let transaction;
    if (symbol === "DAPP") {
      transaction = await amm.connect(signer).swapToken1(amount);
    } else {
      transaction = await amm.connect(signer).swapToken2(amount);
    }

    await transaction.wait();

    dispatch(swapSuccess(transaction.hash));

  } catch (error) {
    console.error('Swap failed:', error);
    dispatch(swapFail());
  }
};


// Load All Swaps
export const loadAllSwaps = async (provider, amm, dispatch) => {
  const block = await provider.getBlockNumber();

  const swapStream = await amm.queryFilter('Swap', 0, block);
  const swaps = swapStream.map(event => ({
    hash: event.transactionHash,
    args: event.args
  }));

  dispatch(swapsLoaded(swaps));
};




// Load Balances from both AMMs for Aggregator
export const loadAggregatorBalances = async (amm1, amm2, tokens, provider) => {
  try {
    // Connect to AMM contracts with the provider
    const amm1Contract = new ethers.Contract(amm1.address, AMM_ABI, provider);
    const amm2Contract = new ethers.Contract(amm2.address, AMM_ABI, provider);

    // Fetch balances from both AMMs
    const balancesAmm1 = await Promise.all([
      amm1Contract.token1Balance(),
      amm1Contract.token2Balance()
    ]);

    const balancesAmm2 = await Promise.all([
      amm2Contract.token1Balance(),
      amm2Contract.token2Balance()
    ]);

    // Format balances
    const formattedBalancesAmm1 = balancesAmm1.map(balance => ethers.utils.formatUnits(balance.toString(), 'ether'));
    const formattedBalancesAmm2 = balancesAmm2.map(balance => ethers.utils.formatUnits(balance.toString(), 'ether'));

    return {
      amm1: {
        token1Balance: formattedBalancesAmm1[0],
        token2Balance: formattedBalancesAmm1[1]
      },
      amm2: {
        token1Balance: formattedBalancesAmm2[0],
        token2Balance: formattedBalancesAmm2[1]
      }
    };
  } catch (error) {
    console.error('Error loading aggregator balances:', error);
    return { amm1: { token1Balance: '0', token2Balance: '0' }, amm2: { token1Balance: '0', token2Balance: '0' } };
  }
};



// Update selected AMM in redux
export const updateSelectedAmm = (selectedAmmAddress, dispatch) => {
  dispatch(selectAmm(selectedAmmAddress));
};




export const loadAmmData = async (provider, amm1Address, amm2Address, dispatch) => {
  try {
    const amm1Contract = new ethers.Contract(amm1Address, AMM_ABI, provider);
    const amm2Contract = new ethers.Contract(amm2Address, AMM_ABI, provider);

    // Fetch balances and calculate rates for AMM1
    const [token1BalanceAmm1, token2BalanceAmm1] = await Promise.all([
      amm1Contract.token1Balance(),
      amm1Contract.token2Balance(),
    ]);
    const rate1to2Amm1 = token2BalanceAmm1 / token1BalanceAmm1;
    const rate2to1Amm1 = token1BalanceAmm1 / token2BalanceAmm1;

    // Fetch balances and calculate rates for AMM2
    const [token1BalanceAmm2, token2BalanceAmm2] = await Promise.all([
      amm2Contract.token1Balance(),
      amm2Contract.token2Balance(),
    ]);
    const rate1to2Amm2 = token2BalanceAmm2 / token1BalanceAmm2;
    const rate2to1Amm2 = token1BalanceAmm2 / token2BalanceAmm2;

    // Dispatch actions to update aggregator reducer
    dispatch(updateAmmData({
      ammNumber: 'amm1',
      data: {
        token1Balance: ethers.utils.formatUnits(token1BalanceAmm1.toString(), 'ether'),
        token2Balance: ethers.utils.formatUnits(token2BalanceAmm1.toString(), 'ether'),
        rate1to2: rate1to2Amm1,
        rate2to1: rate2to1Amm1
      }
    }));
    dispatch(updateAmmData({
      ammNumber: 'amm2',
      data: {
        token1Balance: ethers.utils.formatUnits(token1BalanceAmm2.toString(), 'ether'),
        token2Balance: ethers.utils.formatUnits(token2BalanceAmm2.toString(), 'ether'),
        rate1to2: rate1to2Amm2,
        rate2to1: rate2to1Amm2
      }
    }));
  } catch (error) {
    console.error('Error loading balances and rates from AMMs:', error);
  }
};

export const aggregatorSwap = async (provider, selectedBestAmm, ammContracts, tokenContract, tokenSymbol, amount, dispatch) => {
  try {
    dispatch(swapRequest());

    const signer = provider.getSigner();
    const ammContract = selectedBestAmm === 'amm1' ? ammContracts.amm1 : ammContracts.amm2;

    // Approve the AMM contract to spend the token
    await tokenContract.connect(signer).approve(ammContract.address, amount);

    let transaction;
    if (tokenSymbol === "DAPP") {
      transaction = await ammContract.connect(signer).swapToken1(amount);
    } else {
      transaction = await ammContract.connect(signer).swapToken2(amount);
    }

    await transaction.wait();

    dispatch(swapSuccess(transaction.hash));

  } catch (error) {
    console.error('Aggregator swap failed:', error);
    dispatch(swapFail());
  }
};
