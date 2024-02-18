const hre = require("hardhat");
const config = require('../src/config.json');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

async function main() {
  // Fetch accounts
  console.log(`Fetching accounts & network \n`);
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const investor1 = accounts[1];
  const investor2 = accounts[2];
  const investor3 = accounts[3];
  const investor4 = accounts[4];

  // Fetch Network
  const { chainId } = await ethers.provider.getNetwork();

  // Fetch Tokens
  const dapp = await ethers.getContractAt('Token', config[chainId].dapp.address);
  const usd = await ethers.getContractAt('Token', config[chainId].usd.address);

  // Fetch AMMs
  const amm1 = await ethers.getContractAt('AMM', config[chainId].amm1.address);
  const amm2 = await ethers.getContractAt('AMM', config[chainId].amm2.address);

  // Add liquidity to both AMMs
  let amount = tokens(1000);
  await dapp.connect(deployer).approve(amm1.address, amount);
  await usd.connect(deployer).approve(amm1.address, amount);
  await amm1.connect(deployer).addLiquidity(amount, amount);

  await dapp.connect(deployer).approve(amm2.address, amount);
  await usd.connect(deployer).approve(amm2.address, amount);
  await amm2.connect(deployer).addLiquidity(amount, amount);

  // Distribute Tokens to Investors
  await dapp.connect(deployer).transfer(investor1.address, tokens(100));
  await usd.connect(deployer).transfer(investor2.address, tokens(100));
  await dapp.connect(deployer).transfer(investor3.address, tokens(100));
  await usd.connect(deployer).transfer(investor4.address, tokens(100));

  // Investors Swap on AMM 1
  for (let i = 0; i < 6; i++) {
    let swapAmount = tokens(1 + i); // Increment swap amount
    await dapp.connect(investor1).approve(amm1.address, swapAmount);
    await amm1.connect(investor1).swapToken1(swapAmount);

    await usd.connect(investor2).approve(amm1.address, swapAmount);
    await amm1.connect(investor2).swapToken2(swapAmount);
  }

  // Investors Swap on AMM 2 with different amounts
  for (let i = 0; i < 6; i++) {
    let swapAmount = tokens(2 + i); // Different increment for swap amount
    await dapp.connect(investor3).approve(amm2.address, swapAmount);
    await amm2.connect(investor3).swapToken1(swapAmount);

    await usd.connect(investor4).approve(amm2.address, swapAmount);
    await amm2.connect(investor4).swapToken2(swapAmount);
  }

  console.log(`Seeding completed.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
