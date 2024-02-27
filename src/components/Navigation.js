import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Blockies from 'react-blockies';
import logo from '../Hummingbird_Logo.png';

import { loadAccount, loadBalances } from '../store/interactions';
import { selectAmm } from '../store/reducers/amm';

import config from '../config.json'


const Navigation = () => {
  const chainId = useSelector(state => state.provider.chainId);
  const account = useSelector(state => state.provider.account);
  const tokens = useSelector(state => state.tokens.contracts);
  const amms = useSelector(state => state.amm.contracts); // Assuming 'contracts' holds both AMM instances
  const selectedAmm = useSelector(state => state.amm.selectedAmm); // The key for the currently selected AMM

  const dispatch = useDispatch();

  const connectHandler = async () => {
    const loadedAccount = await loadAccount(dispatch);
    // Use the selected AMM contract instance for balance loading
    const currentAmmContract = amms[selectedAmm];
    if (currentAmmContract && tokens.length === 2) {
      await loadBalances(currentAmmContract, tokens, loadedAccount, dispatch);
    } else {
      console.error('AMM contract is not loaded yet or tokens are not set.');
    }
  };

  const networkHandler = async (e) => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: e.target.value }],
    });
  };

  const ammHandler = async (e) => {
    dispatch(selectAmm(e.target.value));
    // Optionally, refresh balances for the new AMM if the account is already loaded
    if (account && tokens.length === 2) {
      const newAmmContract = amms[e.target.value];
      if (newAmmContract) {
        await loadBalances(newAmmContract, tokens, account, dispatch);
      }
    }
  };

  return (
    <Navbar className='my-3 navbar-custom' expand="lg">
      <img
        alt="logo"
        src={logo}
        width="100"
        height="100"
        className="d-inline-block align-top mx-3"
      />
      <Navbar.Brand className='text-white' >Hummingbird Finance </Navbar.Brand>

      <Navbar.Toggle aria-controls="nav" className='navbar-toggler-custom' />
      <Navbar.Collapse id="nav" className="justify-content-end">

        <div className="d-flex justify-content-center mt-3"> 
          <Form.Select
            aria-label="AMM Selector"
            value={selectedAmm}
            onChange={ammHandler}
            style={{ maxWidth: '200px', marginLeft: '20px' }}
          >
            <option value="amm1">AMM 1</option>
            <option value="amm2">AMM 2</option>
          </Form.Select>

          <Form.Select
            aria-label="Network Selector"
            value={config[chainId] ? `0x${chainId.toString(16)}` : `0`}
            onChange={networkHandler}
            style={{ maxWidth: '200px', marginRight: '20px' }}
          >
            <option value="0" disabled>Select Network</option>
            <option value="0x7A69">Localhost</option>
            <option value="0x5">Goerli</option>
          </Form.Select>

          {account ? (
            <Navbar.Text className='d-flex align-items-center text-white'>
              {account.slice(0, 5) + '...' + account.slice(38, 42)}
              <Blockies
                seed={account}
                size={10}
                scale={3}
                color="#2187D0"
                bgColor="#F1F2F9"
                spotColor="#767F92"
                className="identicon mx-2"

              />
            </Navbar.Text>
          ) : (
            <Button onClick={connectHandler} className='btn-custom'>Connect</Button>
          )}



        </div>

      </Navbar.Collapse>
    </Navbar>
  );
}

export default Navigation;