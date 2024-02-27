import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

import Alert from './Alert';
import {loadBalances, aggregatorSwap } from '../store/interactions';

const Aggregator = () => {
  const [inputToken, setInputToken] = useState(null);
  const [outputToken, setOutputToken] = useState(null);
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutputAmount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedBestAmm, setSelectedBestAmm] = useState('');
  const [amm1Rate, setAmm1Rate] = useState('Loading...');
  const [amm2Rate, setAmm2Rate] = useState('Loading...');


  const provider = useSelector(state => state.provider.connection);
  const account = useSelector(state => state.provider.account);
  const tokens = useSelector(state => state.tokens.contracts);
  const symbols = useSelector(state => state.tokens.symbols);
  const balances = useSelector(state => state.tokens.balances);


  const selectedAmm = useSelector(state => state.amm.selectedAmm);
  const ammContracts = useSelector(state => state.amm.contracts);
  const amm = ammContracts[selectedAmm];

  const aggregatorData = useSelector(state => state.aggregator.ammData);

  const isSwapping = useSelector(state => state.amm.swapping.isSwapping);
  const isSuccess = useSelector(state => state.amm.swapping.isSuccess);
  const transactionHash = useSelector(state => state.amm.swapping.transactionHash);

  const dispatch = useDispatch();


  const inputHandler = async (e) => {
    if (!inputToken || !outputToken) {
      window.alert('Please select token');
      return;
    }
  
    if (inputToken === outputToken) {
      window.alert('Invalid token pair');
      return;
    }
  
    const input = e.target.value;
    setInputAmount(input);
  
    // Convert input amount to BigNumber using ethers for better precision
    const inputAmountBigNumber = ethers.utils.parseUnits(input, 'ether');
  
    if (selectedBestAmm && aggregatorData[selectedBestAmm]) {
      const ammRates = aggregatorData[selectedBestAmm];
      const rate = inputToken === 'DAPP' ? ammRates.rate1to2 : ammRates.rate2to1;
      const outputAmountBigNumber = inputAmountBigNumber.mul(ethers.utils.parseUnits(rate.toString(), 'ether')).div(ethers.constants.WeiPerEther);
      const outputAmountFormatted = ethers.utils.formatUnits(outputAmountBigNumber, 'ether');
      setOutputAmount(outputAmountFormatted);
    }
  };

  // Logic to determine the best AMM for swap
  useEffect(() => {
    if (inputToken && outputToken && aggregatorData.amm1 && aggregatorData.amm2) {
      // Calculate which AMM has the best rate
      const rateAmm1 = inputToken === 'DAPP' ? aggregatorData.amm1.rate1to2 : aggregatorData.amm1.rate2to1;
      const rateAmm2 = inputToken === 'DAPP' ? aggregatorData.amm2.rate1to2 : aggregatorData.amm2.rate2to1;

      const bestAmm = rateAmm1 > rateAmm2 ? 'amm1' : 'amm2';
      setSelectedBestAmm(bestAmm);
    }
  }, [inputToken, outputToken, aggregatorData]);

  useEffect(() => {
    if (inputToken && outputToken) {
      const displayRatesAmm1 = inputToken === 'DAPP' ? aggregatorData.amm1.rate1to2 : aggregatorData.amm1.rate2to1;
      const displayRatesAmm2 = inputToken === 'DAPP' ? aggregatorData.amm2.rate1to2 : aggregatorData.amm2.rate2to1;

      // Set the rates for display
      setAmm1Rate(displayRatesAmm1);
      setAmm2Rate(displayRatesAmm2);
    }
  }, [inputToken, outputToken, selectedBestAmm, aggregatorData]);

  const swapHandler = async (e) => {
    e.preventDefault();
    setShowAlert(false);
  
    if (inputToken === outputToken) {
      window.alert('Invalid Token Pair');
      return;
    }
  
    const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether');
    const tokenContract = inputToken === 'DAPP' ? tokens[0] : tokens[1];
    const tokenSymbol = inputToken;
  
    // Execute aggregator swap on the selected AMM
    await aggregatorSwap(provider, selectedBestAmm, ammContracts, tokenContract, tokenSymbol, _inputAmount, dispatch);
  
    // Optionally reload balances after the swap
    await loadBalances(amm, tokens, account, dispatch);
  
    setShowAlert(true);
  };



  const getRateAndBalance = (token1, token2, ammData) => {
    if (token1 === 'DAPP' && token2 === 'USD') {
      return { rate: ammData.rate1to2, balance1: ammData.token1Balance, balance2: ammData.token2Balance };
    } else if (token1 === 'USD' && token2 === 'DAPP') {
      return { rate: ammData.rate2to1, balance1: ammData.token2Balance, balance2: ammData.token1Balance };
    } else {
      return { rate: 0, balance1: 0, balance2: 0 };
    }
  };



  return (
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4 card-style'>
        {account ? (

          <Form onSubmit={swapHandler} style={{ maxWidth: '450px', margin: '50px auto' }} className='form-control'>

            <Row className='my-3'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Input:</strong></Form.Label>
                <Form.Text style={{color:"white"}}>
                  Wallet Balance: {
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>

              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  onChange={(e) => inputHandler(e)}
                  disabled={!inputToken}
                  className='input-group-custom'
                />
                <DropdownButton
                  variant="outline-secondary"
                  title={inputToken ? inputToken : "Select Token"}
                  className='dropdown-menu'
                >
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >DAPP</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >USD</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>

            <Row className='my-4'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Output:</strong></Form.Label>
                <Form.Text style={{color:"white"}}>
                Wallet Balance: {
                    outputToken === symbols[0] ? (
                      balances[0]
                    ) : outputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>

              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  value={outputAmount === 0 ? "" : outputAmount}
                  disabled
                  className='input-group-custom'

                />
                <DropdownButton
                  variant="outline-secondary"
                  title={outputToken ? outputToken : "Select Token"}
                >
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>DAPP</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>USD</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>

            <hr />
            <h5 >Aggregator Info</h5>

            <br></br>


            <p>
              Currency Pair:     <b> {inputToken} / {outputToken} </b>
            </p>

            Exchange Rate on <strong>AMM 1:</strong> {amm1Rate}
            <Form.Text style={{color:"white"}} >
              <br></br>
              {inputToken} Liquidity: {
                getRateAndBalance(inputToken, outputToken, aggregatorData.amm1).balance1
              }
            </Form.Text>

            <Form.Text style={{color:"white"}} >
              <br></br>
              {outputToken} Liquidity: {
                getRateAndBalance(inputToken, outputToken, aggregatorData.amm1).balance2
              }
            </Form.Text>
            <br /><br />


            Exchange Rate on <strong>AMM 2:</strong>  {amm2Rate}
            <Form.Text style={{color:"white"}}>
              <br></br>
              {inputToken} Liquidity: {
                getRateAndBalance(inputToken, outputToken, aggregatorData.amm2).balance1
              }
            </Form.Text>

            <Form.Text style={{color:"white"}}>
              <br></br>
              {outputToken} Liquidity: {
                getRateAndBalance(inputToken, outputToken, aggregatorData.amm2).balance2
              }
            </Form.Text>

            <Row className='my-3'>
              {isSwapping ? (
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ) : (
                <Button type='submit' className='btn-custom'>Swap on: {selectedBestAmm.toUpperCase()}</Button>
              )}


            </Row>

          </Form>

        ) : (
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>

      {isSwapping ? (
        <Alert
          message={'Swap Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (
        <Alert
          message={'Swap Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (
        <Alert
          message={'Swap Failed'}
          transactionHash={null}
          variant={'danger'}
          setShowAlert={setShowAlert}
        />
      ) : (
        <></>
      )}

    </div>
  );
}

export default Aggregator;
