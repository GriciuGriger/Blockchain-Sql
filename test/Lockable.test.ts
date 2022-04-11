import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { assertErrorMessage, hasEmittedEvent } from './helpers/utils';
import { Factory } from './fixtures/contracts';
import { Lockable } from "../src/types";

// function delay(ms: number) {
//     return new Promise( resolve => setTimeout(resolve, ms) );
// }

describe(`Tests of Lockable logic`, async() => {
    
    let admin : SignerWithAddress;
    let gary : SignerWithAddress;
    let drock : SignerWithAddress;
    let contract : Lockable;

    beforeEach(async() => {
        <any> await Factory["MyBaseContract"]();
       // <any> await Factory["Mintable"]();
        contract = <any> await Factory["Lockable"]();
        [ admin, gary, drock ] = await ethers.getSigners();

        {
            const tx = contract.connect(admin)
                .transfer(gary.address, 10000);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);
        }

        {
            const tx = await contract.connect(admin)
                .transfer(drock.address, 10000);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

    });


    it("Allow locking only to privileged users", async function () {

        {
            const tx = contract.connect(gary)
                .setGlobalLock(true);
            await assertErrorMessage(tx, 'This account has no locking privilege.');
        }
        {
            const tx = contract.connect(gary)
                .lockFunds(drock.address);
            await assertErrorMessage(tx, 'This account has no locking privilege.');
        }
        {
            const tx = contract.connect(admin)
                .setGlobalLock(true);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);
        }
        {
            const tx = await contract.connect(admin)
                .lockFunds(gary.address);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
        }

    });

    it("Proper locking execution", async function () {
        //lock global
        {
            const tx = contract.connect(admin)
                .setGlobalLock(true)
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "GlobalLockChanged", [admin.address, true]);
        }
        
        // lock global again (no event)
        {

            const tx = await contract.connect(admin)
                .setGlobalLock(true);
            const result = await tx.wait();
            expect(result.status).to.be.equal(1);
            expect(result.events?.length).to.be.equal(0);

        }

        // unlock global
        {
            const tx = contract.connect(admin)
                .setGlobalLock(false);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);
            
            await hasEmittedEvent(tx, "GlobalLockChanged", [admin.address, false]);

        }

        // lock account
        {
            const tx = contract.connect(admin)
                .lockFunds(gary.address);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);
            
            await hasEmittedEvent(tx, "FundsLockedStatus", [admin.address, gary.address, true]);

        }

        // lock account again (no event)
        {
            const tx = await contract.connect(admin)
                .lockFunds(gary.address);
            const result =  await tx.wait();
            expect(result.status).to.be.equal(1);
            expect(result.events?.length).to.be.equal(0);
        }

        //unlock account
        {
            const tx = contract.connect(admin)
                .unlockFunds(gary.address);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);
            
            await hasEmittedEvent(tx, "FundsLockedStatus", [admin.address, gary.address, false]);

        }

    });

    it("Grant and deprive locking privilege", async function () {
        
         // grant
        {
            const tx = contract.connect(admin)
                .grantLockingPrivilege(gary.address);
            const result =  await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "LockingPrivilegeStatus", [admin.address, gary.address, true]);
        }

        // lockFunds by new admin
        {
            const tx = contract.connect(gary)
                .lockFunds(drock.address);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "FundsLockedStatus", [gary.address, drock.address, true]);
        }

        // unlockFunds by new admin
        {
            const tx = contract.connect(gary)
                .unlockFunds(drock.address);
            const result = await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "FundsLockedStatus", [gary.address, drock.address, false]);
        }

        // deprive
        {
            const tx = contract.connect(admin)
                .depriveLockingPrivilege(gary.address);
            const result =  await (await tx).wait();
            expect(result.status).to.be.equal(1);

            await hasEmittedEvent(tx, "LockingPrivilegeStatus", [admin.address, gary.address, false]);
        }
    });

    it("Try to transfer funds while globally locked", async function () {

       // lock
        {
            const tx = await contract.connect(admin)
                .setGlobalLock(true);
            const result =  await tx.wait();
            expect(result.status).to.be.equal(1);
        }

        // transfer while globally locked
        {
            const tx = contract.connect(gary)
                .transfer(drock.address, 6000);
            await assertErrorMessage(tx, 'All funds are globally locked.');
        }

        //transferFrom while globally locked
        {
            const tx = contract.connect(admin)
                .transferFrom(gary.address, drock.address, 6000);
            await assertErrorMessage(tx, 'All funds are globally locked.');
        }

    });

    it("Try to transfer funds while locally locked", async function () {

        // lock
         {
             const tx = await contract.connect(admin)
                 .lockFunds(gary.address);
             const result =  await tx.wait();
             expect(result.status).to.be.equal(1);  
         }
 
         // transfer while sender's funds locally locked
        {
            const tx = contract.connect(gary)
                .transfer(drock.address, 6000);
            await assertErrorMessage(tx, "Sender's account is locked.");
        }

         // transfer while recipient's funds locally locked
         {
            const tx = contract.connect(admin)
                .transfer(gary.address, 6000);
            await assertErrorMessage(tx, "Recipient's account is locked.");
         }

         //transferFrom while allowance caller locally locked
         {
            const tx = contract.connect(gary)
                .transferFrom(admin.address, drock.address, 6000);
            await assertErrorMessage(tx, "Allowance caller's account is locked.");
         }

        //transferFrom while sender locally locked
        {
            const tx = contract.connect(admin)
                .transferFrom(gary.address, drock.address, 6000);
            await assertErrorMessage(tx, "Sender's account is locked.");
         }

        //transferFrom while recipient locally locked

         {
            const tx = contract.connect(admin)
                .transferFrom(drock.address, gary.address, 6000);
            await assertErrorMessage(tx, "Recipient's account is locked.");
         }

     });
    

});