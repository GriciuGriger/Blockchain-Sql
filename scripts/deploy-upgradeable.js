const { ethers, upgrades } = require("hardhat");

async function main() {

    const BaseContract = await ethers.getContractFactory("BaseContract");
    const proxy = await upgrades.deployProxy(BaseContract, ["NiceToken", "NTK", 21000000], {initializer: "initialize"});
    await proxy.deployed();

    console.log("Proxy of BaseContract deployed to: ", proxy.address)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});