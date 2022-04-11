import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { assertErrorMessage, hasEmittedEvent } from './helpers/utils';
import { Factory } from './fixtures/contracts';
import { MyBaseContract } from '../src/types/';

describe(`Tests of MyBaseContract logic`, async() => {
    
    let admin : SignerWithAddress;
    let gary : SignerWithAddress;
    let drock : SignerWithAddress;
    let contract : MyBaseContract;

    beforeEach(async() => {
        contract = <any> await Factory["MyBaseContract"]();
        [ admin, gary, drock ] = await ethers.getSigners();
    });

    it("Should deploy proxy and initialize the state of Base Contract", async function () {

        expect(await contract.name()).to.be.equal("NiceToken");
        expect(await contract.symbol()).to.be.equal("NTK");
        expect(await contract.totalSupply()).to.be.equal(21000000);

    });

    it("Allow simple transfers", async() => {
        const tx = contract.connect(admin).transfer(gary.address, 1000);
        const result = await (await tx).wait();
                    
        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "Transfer", [admin.address, gary.address, 1000]);

        const senderBalance = await contract.balanceOf(admin.address);
        expect(senderBalance).to.be.equal(20999000);
        
        const recipientBalance = await contract.balanceOf(gary.address);
        expect(recipientBalance).to.be.equal(1000);

    });

    it('Don`t allow transfering more than you have', async() => {
              
        const tx = contract.connect(admin).transfer(gary.address, 21000001);
        await assertErrorMessage(tx, 'Transfer amount exceeds balance');

    });
    
    it('Don`t allow transfering 0', async() => {
        
        const tx = contract.connect(admin).transfer(gary.address, 0);
        await assertErrorMessage(tx, '0 money transfer not allowed');

    });

    it('Approve funds to be allowed', async() => {

        const tx = contract.connect(admin).approve(gary.address, 1000);
        const result = await (await tx).wait();

        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "Approval", [admin.address, gary.address, 1000]);

        const allowance = await contract.allowance(admin.address, gary.address);
        expect(allowance).to.be.equal(1000);

    });

    it('Transfer allowed amount', async() => {

        const tx = contract.connect(admin).approve(gary.address, 3000000);
        const result = await (await tx).wait();

        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "Approval", [admin.address, gary.address, 3000000]);

        const tx2 = contract.connect(gary).transferFrom(admin.address, drock.address, 1000000);
        const result2 = await (await tx).wait();

        await hasEmittedEvent(tx2, "Transfer", [admin.address, drock.address, 1000000]);

        const aBalance = await contract.balanceOf(admin.address);
        expect(aBalance).to.be.equal(20000000);
        
        const bBalance = await contract.balanceOf(drock.address);
        expect(bBalance).to.be.equal(1000000);

        const allowance = await contract.allowance(admin.address, gary.address);
        expect(allowance).to.be.equal(2000000);

    });

    it('Should not allow transfer unallowed amount', async() => {

        const tx = contract.connect(admin).approve(gary.address, 3000000);
        const result = await (await tx).wait();

        expect(result.status).to.be.equal(1);

        const tx2 = contract.connect(gary).transferFrom(admin.address, drock.address, 3000001);
        await assertErrorMessage(tx2, 'Transfer amount exceeds allowance');

    });

    it('Should not allow transfer amount exceeding balance', async() => {
    
        const tx = contract
            .connect(gary)
            .approve(drock.address, 10000);
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

    
        const tx2 = contract
            .connect(admin)
            .transfer(gary.address, 1000);
        const result2 = await (await tx).wait();
        expect(result2.status).to.be.equal(1);


        const tx3 = contract
            .connect(drock)
            .transferFrom(gary.address, drock.address, 1001);
        await assertErrorMessage(tx3, 'Transfer amount exceeds balance');
    });

});
