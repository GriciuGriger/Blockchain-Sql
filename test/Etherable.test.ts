import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { assertErrorMessage, hasEmittedEvent } from './helpers/utils';
import { Factory, etherPriceForToken, initialSupply } from './fixtures/contracts';
import { Etherable } from "../src/types";


describe('Tests of Etherable logic', async() => {

    let admin : SignerWithAddress;
    let gary : SignerWithAddress;
    let drock : SignerWithAddress;
    let contract : Etherable;

    beforeEach(async() => {
        <any> await Factory["MyBaseContract"]();
        <any> await Factory["Mintable"]();
        contract = <any> await Factory["Etherable"]();
        [ admin, gary, drock ] = await ethers.getSigners();


    });

    it('Should initiate with proper values', async() => {
        const initialPrice = await contract.price();
        expect(initialPrice).to.be.equal(ethers.utils.parseEther('1'));
        
        const payoutTarget = await contract.payoutTarget();
        expect(payoutTarget).to.be.equal(admin.address);
    });

    it('Allow changing payout target only to the ones privileged', async() => {

        {
            const tx = contract.connect(gary)
                .changePayoutTarget(drock.address);
            await assertErrorMessage(tx, "Caller doesn't have a privilege to set price nor changing payout target.");
        }

        {
            const tx = await contract.connect(admin)
                .changePayoutTarget(gary.address);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

    });

    it('Properly changes payout target', async() => {

        const tx = await contract.connect(admin)
            .changePayoutTarget(gary.address);
        const result = await tx.wait();
        expect(result.status).to.be.equal(1);

        const payoutTarget = await contract.payoutTarget();
        expect(payoutTarget).to.be.equal(gary.address);
    });

    it('Allow changing price only to the ones privileged', async() => {

        {
        const tx = contract.connect(gary)
            .changePrice(ethers.utils.parseEther('2'));
        await assertErrorMessage(tx, "Caller doesn't have a privilege to set price nor changing payout target.");
        }

        {
        const tx = await contract.connect(admin)
            .changePrice(ethers.utils.parseEther('2'));
        const result = await tx.wait();
        expect(result.status).to.be.equal(1);
        }
    });

    it('Properly changes price', async() => {

        {
        const tx = contract.connect(admin)
            .changePrice(ethers.utils.parseEther('2'));
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

        const price = await contract.price();
        expect(price).to.be.equal(ethers.utils.parseEther('2'));

        await hasEmittedEvent(tx, "TokenPriceChanged", [admin.address, ethers.utils.parseEther('2')]);
        }

        // again (no event)
        {
        const tx = await contract.connect(admin)
            .changePrice(ethers.utils.parseEther('2'));
        const result = await tx.wait();
        expect(result.status).to.be.equal(1);
        expect(result.events?.length).to.be.equal(0);
        }

        {
        const tx = contract.connect(admin).changePrice(0);
        await assertErrorMessage(tx, "Invalid Price.");
        }
    });

    it('Properly handles buying', async() => {

        // buy
        {
        const tx = contract.connect(admin)
            .buyTokens(16);
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

        await hasEmittedEvent(tx, "TokenPurchase", [admin.address, 16, ethers.utils.parseEther(`${etherPriceForToken}`)]);
        await hasEmittedEvent(tx, "Transfer", [ethers.constants.AddressZero, admin.address, 16])

        const balance = await contract.balanceOf(admin.address);
        expect(balance).to.be.equal(initialSupply + 16);
        }

        // change price
        {
        const tx = await contract.connect(admin)
            .changePrice(ethers.utils.parseEther('2'));

        const result = await tx.wait();
        expect(result.status).to.be.equal(1);
        }

        // buy again
        {
        const tx = contract.connect(admin)
            .buyTokens(16);
        const result = await (await tx).wait();
        expect(result.status).to.be.equal(1);

        const currentPrice = await contract.price();

        await hasEmittedEvent(tx, "TokenPurchase", [admin.address, 16, currentPrice]);
        await hasEmittedEvent(tx, "Transfer", [ethers.constants.AddressZero, admin.address, 16])

        const balance = await contract.balanceOf(admin.address);
        expect(balance).to.be.equal(initialSupply + 32);
        
        }
    }); 

    it('Should not allow buying 0', async() => {
        const tx = contract.connect(admin)
            .buyTokens(0);
        await assertErrorMessage(tx, 'Invalid Amount Sent.');
    });

})