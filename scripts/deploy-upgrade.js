const { ethers, upgrades } = require("hardhat");

async function main() {

    const contractUpdate = "Etherable"

    const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const toBeUpgraded = await ethers.getContractFactory(contractUpdate);
    await upgrades.upgradeProxy(proxyAddress, toBeUpgraded, {call: "initialize"});
    console.log("Contract Upgraded");

}

  // We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});