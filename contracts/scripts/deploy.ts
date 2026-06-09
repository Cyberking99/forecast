import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const usdcAddress = process.env.USDC_ADDRESS ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const oracleAddress = process.env.ORACLE_ADDRESS ?? deployer.address;
  const relayerAddress = process.env.ONESHOT_RELAYER_ADDRESS ?? deployer.address;

  const oracleVerifier = await ethers.deployContract("OracleVerifier", [oracleAddress]);
  await oracleVerifier.waitForDeployment();
  console.log("OracleVerifier:", await oracleVerifier.getAddress());

  const feeCollector = await ethers.deployContract("FeeCollector", [usdcAddress]);
  await feeCollector.waitForDeployment();
  console.log("FeeCollector:", await feeCollector.getAddress());

  const predictionPool = await ethers.deployContract("PredictionPool", [
    usdcAddress,
    await oracleVerifier.getAddress(),
    await feeCollector.getAddress(),
    relayerAddress,
  ]);
  await predictionPool.waitForDeployment();
  console.log("PredictionPool:", await predictionPool.getAddress());

  const sessionKeyModule = await ethers.deployContract("SessionKeyModule");
  await sessionKeyModule.waitForDeployment();
  console.log("SessionKeyModule:", await sessionKeyModule.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
