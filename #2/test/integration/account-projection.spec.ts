import waitForExpect from 'wait-for-expect';

import AccountProjection from '../../src/projection/account';

import { AccountEvents, AggregateType } from '../../../events';
import EventStore from '../../src/library/eventstore';
import { expect } from 'chai';


async function findById(id: string): Promise<{
  username: string;
  fullName: string;
  email: string;
  balance: number;
} | null> {
  // TODO: Implement this function to retrieve the account information by account id.

  return null;
}

describe('AccountProjection', function () {
  describe('#start', function () {
    before(async function () {
      this.eventStore = new EventStore(AccountEvents);
      this.projection = new AccountProjection(this.eventStore);
      this.aggregateId = '60329145-ba86-44fb-8fc8-519e1e427a60';

      await this.projection.start();

      this.account = await findById(this.aggregateId);
    });

    after(function () {
      // TODO: Destroy test data/models
    });

    it('SHOULD project the data to the correctly to the database', function () {
      expect(this.account).to.deep.equal({
        username: 'jdoe',
        fullName: 'johndoe',
        email: 'email@ml.com',
        balance: 27,
        totalApprovedWithdrawalAmount: 3,
        totalApprovedDepositAmount: 10,
      });
    });

    describe('WHEN there is a new event', function () {
      before(async function () {
        await this.eventStore.createEvent({
          aggregateType: AggregateType.Account,
          type: 'BalanceDebited',
          aggregateId: this.aggregateId,
          body: { amount: 7 },
        });
      });

      it('SHOULD be able to apply new events to the model', async function () {
        await waitForExpect(async () => {
          const account = await findById(this.aggregateId);
          expect(account).to.have.property('balance', 20);
        });
      });
    });
  });
});
