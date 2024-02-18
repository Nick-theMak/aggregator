// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './AMM.sol';
import './Token.sol';

contract Aggregator {
    AMM public amm1;
    AMM public amm2;

    constructor(AMM _amm1, AMM _amm2) {
        amm1 = _amm1;
        amm2 = _amm2;
    }

    function getBestPrice(uint256 amount) public view returns (uint256, address) {
        uint256 price1 = amm1.getPrice(amount);
        uint256 price2 = amm2.getPrice(amount);

        if (price1 > price2) {
            return (price1, address(amm1));
        } else {
            return (price2, address(amm2));
        }
    }

    function getBestReversePrice(uint256 amount) public view returns (uint256, address) {
        uint256 price1 = amm1.getReversePrice(amount);
        uint256 price2 = amm2.getReversePrice(amount);

        if (price1 > price2) {
            return (price1, address(amm1));
        } else {
            return (price2, address(amm2));
        }
    }

    function executeSwap(
        address tokenGive,
        uint256 tokenGiveAmount,
        uint256 minTokenGetAmount
    ) external returns (uint256 tokenGetAmount) {
        uint256 price1;
        uint256 price2;
        bool isToken1;

        // Check which token is being given and call the appropriate price function
        if (tokenGive == address(amm1.token1()) || tokenGive == address(amm2.token1())) {
            price1 = amm1.calculateToken1Swap(tokenGiveAmount);
            price2 = amm2.calculateToken1Swap(tokenGiveAmount);
            isToken1 = true;
        } else {
            price1 = amm1.calculateToken2Swap(tokenGiveAmount);
            price2 = amm2.calculateToken2Swap(tokenGiveAmount);
            isToken1 = false;
        }

        AMM selectedAMM = (price1 > price2) ? amm1 : amm2;
        Token tokenContract = Token(tokenGive);

        // Transfer tokens from the user to the aggregator contract
        require(tokenContract.transferFrom(msg.sender, address(this), tokenGiveAmount), "Token transfer failed");
        
        // Approve the AMM to use the tokens
        tokenContract.approve(address(selectedAMM), tokenGiveAmount);

        // Execute the swap
        if (isToken1) {
            tokenGetAmount = selectedAMM.swapToken1(tokenGiveAmount);
        } else {
            tokenGetAmount = selectedAMM.swapToken2(tokenGiveAmount);
        }

        require(tokenGetAmount >= minTokenGetAmount, "Slippage exceeded");

        // Transfer the swapped tokens back to the user
        Token tokenToTransfer = isToken1 ? selectedAMM.token2() : selectedAMM.token1();
        require(tokenToTransfer.transfer(msg.sender, tokenGetAmount), "Failed to transfer swapped tokens");
    }



}
