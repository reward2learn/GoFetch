import { ethers } from "hardhat";

async function main() {
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  console.log("🚀 Deploying Escrow contract...");
  console.log(`   USDC: ${usdcAddress}`);
  console.log(`   Network: baseSepolia`);

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(usdcAddress);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`\n✅ Escrow deployed to: ${address}`);
  console.log(`   Transaction: ${escrow.deploymentTransaction()?.hash}`);

  console.log(`\n📋 Update .env.local:`);
  console.log(`   NEXT_PUBLIC_ESCROW_ADDRESS=${address}`);

  console.log(`\n📋 Update contracts.ts:`);
  console.log(`   export const ESCROW_ADDRESS = "${address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
