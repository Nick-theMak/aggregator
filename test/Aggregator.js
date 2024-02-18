const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Aggregator', () => {
    let deployer, investor1, investor2, token1, token2, amm1, amm2, aggregator;

    beforeEach(async () => {
        // Setup Accounts
        [deployer, investor1, investor2] = await ethers.getSigners();

        // Deploy Tokens
        const Token = await ethers.getContractFactory('Token');
        token1 = await Token.deploy('Token 1', 'TK1', '1000000');
        token2 = await Token.deploy('Token 2', 'TK2', '1000000');

        // Deploy AMMs
        const AMM = await ethers.getContractFactory('AMM');
        amm1 = await AMM.deploy(token1.address, token2.address);
        amm2 = await AMM.deploy(token1.address, token2.address);

        // Deploy Aggregator
        const Aggregator = await ethers.getContractFactory('Aggregator');
        aggregator = await Aggregator.deploy(amm1.address, amm2.address);

        // Distribute Tokens and Add Liquidity
        await token1.transfer(investor1.address, tokens(10000));
        await token2.transfer(investor2.address, tokens(10000));

        // Add liquidity to both AMMs
        await token1.approve(amm1.address, tokens(5000));
        await token2.approve(amm1.address, tokens(5000));
        await amm1.addLiquidity(tokens(5000), tokens(5000));

        await token1.approve(amm2.address, tokens(5000));
        await token2.approve(amm2.address, tokens(5000));
        await amm2.addLiquidity(tokens(5000), tokens(5000));
    });

    describe('Deployment', () => {
        it('tracks the AMM addresses', async () => {
            expect(await aggregator.amm1()).to.equal(amm1.address);
            expect(await aggregator.amm2()).to.equal(amm2.address);
        });
    });

    describe('Creating Price Discrepancy', () => {
        it('creates different prices on AMM1 and AMM2', async () => {
            // Process swaps on AMM1 to create a price discrepancy
            await token1.connect(investor1).approve(amm1.address, tokens(100));
            await amm1.connect(investor1).swapToken1(tokens(100));

            const priceAMM1 = await amm1.getPrice(tokens(1));
            const priceAMM2 = await amm2.getPrice(tokens(1));

            expect(priceAMM1).to.not.equal(priceAMM2);
            console.log('Price AMM1: ', priceAMM1.toString());
            console.log('Price AMM2: ', priceAMM2.toString());
        });

        describe('Executing Swaps through Aggregator', () => {
            it('executes swap with the best rate', async () => {
                // Add liquidity to both AMMs
                await token1.approve(amm1.address, tokens(5000));
                await token2.approve(amm1.address, tokens(5000));
                await amm1.addLiquidity(tokens(5000), tokens(5000));

                await token1.approve(amm2.address, tokens(5000));
                await token2.approve(amm2.address, tokens(5000));
                await amm2.addLiquidity(tokens(5000), tokens(5000));

                // Approve Aggregator to spend tokens
                await token1.connect(investor1).approve(aggregator.address, tokens(100));

                // Execute Swap through Aggregator
                const token2InitialBalance = await token2.balanceOf(investor1.address);
                await aggregator.connect(investor1).executeSwap(token1.address, tokens(100), tokens(90)); // Swap 100 DAPP for at least 90 USD
                const token2FinalBalance = await token2.balanceOf(investor1.address);

                expect(token2FinalBalance.sub(token2InitialBalance)).to.be.at.least(tokens(90));
            });

            it('fails to execute swap with insufficient balance', async () => {
                // Attempt to swap more tokens than the investor1 has
                await token1.connect(investor1).approve(aggregator.address, tokens(20000)); // Investor1 has only 10000 tokens

                await expect(
                    aggregator.connect(investor1).executeSwap(token1.address, tokens(20000), tokens(18000))
                ).to.be.reverted;
            });

            it('fails to execute swap with unacceptable slippage', async () => {
                // Set a very high minimum token get amount (to simulate unacceptable slippage)
                await token1.connect(investor1).approve(aggregator.address, tokens(100));
                await expect(
                    aggregator.connect(investor1).executeSwap(token1.address, tokens(100), tokens(200))
                ).to.be.revertedWith('Slippage exceeded');
            });

        });
    })
})

