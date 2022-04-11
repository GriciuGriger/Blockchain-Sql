   
import { BigNumberish } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts/src.ts/index';
import { upgrades, ethers } from 'hardhat';
export const coinName : string = 'NiceToken';
export const coinSymbol : string = 'NTK';
export const initialSupply : number = 21000000;
export const etherPriceForToken : number = 1;
var proxyAddress : string;

export const Factory : { [contractName : string]: () => Promise<Contract> }  = {
    MyBaseContract: async() => {
        const [ admin ] = await ethers.getSigners();
        
        const contractFactory = await ethers.getContractFactory('MyBaseContract', admin);
        const contract : Contract = <any> await upgrades.deployProxy(contractFactory, [coinName, coinSymbol, initialSupply], {initializer: "initialize"});
        await contract.deployed();

        proxyAddress = String(contract.address);
        // console.log(proxyAddress);
        
        return contract; 
    },
    Mintable: async() => {
        const [ admin ] = await ethers.getSigners();

        const contractFactory = await ethers.getContractFactory('Mintable', admin);
        const contract : Contract = <any> await upgrades.upgradeProxy(proxyAddress, contractFactory, {call: {fn: "mintableInit", args: [admin.address]}});
        await contract.deployed();
        
        return contract;
    },
    Lockable: async() => {
        const [ admin ] = await ethers.getSigners();

        const contractFactory = await ethers.getContractFactory('Lockable', admin);
        const contract : Contract = <any> await upgrades.upgradeProxy(proxyAddress, contractFactory, {call: {fn: "lockableInit", args: [admin.address]}});
        await contract.deployed();

        return contract;
    },
    Etherable: async() => {
        const [ admin ] = await ethers.getSigners();

        const contractFactory = await ethers.getContractFactory('Etherable', admin);
        const contract : Contract = <any> await upgrades.upgradeProxy(proxyAddress, contractFactory, {call: {fn: "etherableInit", args: [etherPriceForToken, admin.address]}});
        await contract.deployed();

        return contract;
    },
};