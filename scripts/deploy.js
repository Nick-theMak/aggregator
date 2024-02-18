// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory('Token')

  // Deploy Token 1
  let dapp = await Token.deploy('Dapp Token', 'DAPP', '1000000') // 1 million tokens
  await dapp.deployed()
  console.log(`Dapp Token deployed to: ${dapp.address}\n`)

  // Deploy Token 2
  const usd = await Token.deploy('USD Token', 'USD', '1000000') // 1 million tokens
  await usd.deployed()
  console.log(`USD Token deployed to: ${usd.address}\n`)

  // Deploy AMM 1
  const AMM1 = await hre.ethers.getContractFactory('AMM')
  const amm1 = await AMM1.deploy(dapp.address, usd.address)

  console.log(`AMM 1 contract deployed to: ${amm1.address}\n`)

  // Deploy AMM 2
  const AMM2 = await hre.ethers.getContractFactory('AMM')
  const amm2 = await AMM2.deploy(dapp.address, usd.address)

  console.log(`AMM 2 contract deployed to: ${amm2.address}\n`)

  // Deploy Aggregator
const Aggregator = await hre.ethers.getContractFactory('Aggregator')
const aggregator = await Aggregator.deploy(amm1.address, amm2.address)

console.log(`Aggregator contract deployed to: ${aggregator.address}\n`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
