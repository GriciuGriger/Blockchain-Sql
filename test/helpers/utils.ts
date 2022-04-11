import { ContractReceipt } from '@ethersproject/contracts/src.ts/index';
import { ContractTransaction, Event } from 'ethers';
import { expect } from 'chai';

export async function hasEmittedEvent (promise: Promise<ContractTransaction>, expectedEvent: string, expectedParams = {}): Promise<void> {
    promise.catch(() => { }) // Avoids uncaught promise rejections in case an input validation causes us to return early
  
    if (!expectedEvent) {
      throw Error('No event specified')
    }
  
    const receipt = await (await promise).wait()
    let eventNamePresent = false
    if (receipt.events !== undefined) {
      for (const event of receipt.events) {
        if (event.event === expectedEvent) {
          eventNamePresent = true
          for (const [index, param] of Object.entries(expectedParams)) {
            expect(event.args, 'Emmited event "' + expectedEvent + '" doesn\'t contain expected property "' + index + '" with value "' + param + '"')
              .to.has.property(index)
              .that.is.eq(param)
          }
          break
        }
      }
    }
  
    expect(eventNamePresent).to.equal(true, 'Transaction didn\'t emit "' + expectedEvent + '" event')
  }

export async function assertErrorMessage (
    tx : Promise<ContractTransaction>,
    message : string
) : Promise<void>
{
    return tx.then(
        (value) => {
            console.log(value);
            expect.fail(`Found value instead of error: ${value}`);
        },
        (reason) => {
            expect(reason.message).to.contain(message);
        }
    );
}