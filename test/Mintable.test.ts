import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { assertErrorMessage, hasEmittedEvent } from './helpers/utils';
import { Factory, initialSupply } from './fixtures/contracts';
import { Mintable } from "../src/types";


describe(`Tests of Mintable logic`, async() => {
    
    let admin : SignerWithAddress;
    let gary : SignerWithAddress;
    let drock : SignerWithAddress;
    let contract : Mintable;

    beforeEach(async() => {
        <any> await Factory["MyBaseContract"]();
        contract = <any> await Factory["Mintable"]();
        [ admin, gary, drock ] = await ethers.getSigners();

    });

    it("Allow minting only to privileged users", async function () {

        {
            const tx = contract.connect(gary).mint(drock.address, 1000);
            await assertErrorMessage(tx, 'Error, msg.sender does not have a minter role');
        }

        //grant privilege of minting to gary
        {
            const tx = await contract.connect(admin)
                .grantMinterRole(gary.address);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

        //check if gary can mint for drock
        {
            const tx = await contract.connect(gary)
                .mint(drock.address, 1000);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }
         
    });

    it("Proper minting result", async function () {

        const tx = contract.connect(admin)
            .mint(gary.address, 1000);
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "Transfer", [ethers.constants.AddressZero, gary.address, 1000]);
        await hasEmittedEvent(tx, "SupplyChanged", [initialSupply, initialSupply+1000]);
        
        const balance = await contract.balanceOf(gary.address);
        expect(balance).to.be.equal(1000);
        
        const totalSupply = await contract.totalSupply();
        expect(totalSupply).to.be.equal(initialSupply + 1000);

    });

    it('Invalid minting args', async() => {
        const tx = contract.connect(admin)
            .mint(gary.address, 0);
        await assertErrorMessage(tx, 'Cannot mint 0 tokens');
    });

    it('Allow burning only to the ones with privilege', async() => {
        
        // send some funds to drock
        {
            const tx = await contract.connect(admin)
                .transfer(drock.address, 5000);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }
        
        // try to burn drock's funds by gary without privilege
        {
            const tx = contract.connect(gary)
                .burn(drock.address, 1000);
            await assertErrorMessage(tx, 'Error, msg.sender does not have a minter role');
        }
        
        // add ownership to gary
        {
            const tx = await contract.connect(admin)
                .grantMinterRole(gary.address);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }
        
        // burn coins of drock
        {
            const tx = await contract.connect(gary)
                .burn(drock.address, 1000);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }
        
    });

    it('Proper burning result', async() => {

        // send some funds to gary
        {
        const tx = await contract.connect(admin)
            .transfer(gary.address, 5000);
        const result = await tx.wait();
        expect(result.status).to.be.equal(1);
        }
        
        // burn part
        {
        const tx = contract.connect(admin)
            .burn(gary.address, 1000);
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "Transfer", [gary.address, ethers.constants.AddressZero, 1000]);
        await hasEmittedEvent(tx, "SupplyChanged", [initialSupply, initialSupply-1000]);
        
        }
        
        const balance = await contract.balanceOf(gary.address);
        expect(balance).to.be.equal(4000);
        
        const totalSupply = await contract.totalSupply();
        expect(totalSupply).to.be.equal(initialSupply - 1000);
        
    });

    it('Invalid burning args', async() => {

        // send some funds to gary
        {
        const tx = await contract.connect(admin)
            .transfer(gary.address, 5000);
        const result = await tx.wait();
        expect(result.status).to.be.equal(1);
        }

        {
        const tx = contract.connect(admin)
            .burn(gary.address, 6000);
        await assertErrorMessage(tx, 'ERC20: burn amount exceeds balance');
        }

    });

    it("Deprive of granted minter role", async function () {

        //grant privilege of minting to gary
        {
            const tx = await contract.connect(admin)
                .grantMinterRole(gary.address);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

        //mint tokens to drock
        {
            const tx = await contract.connect(gary)
                .mint(drock.address, 1000);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

        //deprive minting role of gary
        {
            const tx = contract.connect(admin)
                .depriveMinterRole(gary.address);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "MinterStatus", [admin.address, gary.address, false]);
        }

        //throw error when gary tries to mint
        {
            const tx = contract.connect(gary).mint(drock.address, 1000);
            await assertErrorMessage(tx, 'Error, msg.sender does not have a minter role');
        }
         
    });

});
