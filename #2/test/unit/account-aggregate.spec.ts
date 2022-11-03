import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AccountEvents, AggregateType, Event } from '../../../events';
import { AccountAlreadyExistsError, AccountNotFoundError, InsufficientFundError } from '../../src/library/errors';
import EventStore from '../../src/library/eventstore';
import AccountAggregate from '../../src/aggregate/account';

chai.use(chaiAsPromised);

describe('AccountAggregate', function () {
  beforeEach(function () {
    this.eventStore = new EventStore(AccountEvents);
  });

  describe('#fold', function () {
    // BONUS: Add test, that asserts whether the EventStore.getEvents has been called
    // and the `apply` method has been called with the correct event.
    //
    // See stubs and spies.
  });

  describe('#findById', function () {
    describe('GIVEN account has already existing events', function () {
      beforeEach(function () {
        this.aggregate = AccountAggregate.findById('60329145-ba86-44fb-8fc8-519e1e427a60', this.eventStore);
      });

      it('SHOULD be able to get the account information', function () {
        expect(this.aggregate.state).to.be.ok;
        expect(this.aggregate.state).to.have.property('username', 'jdoe');
        expect(this.aggregate.state).to.have.property('fullName', 'johndoe');
        expect(this.aggregate.state).to.have.property('email', 'email@ml.com');
      });

      it('SHOULD be to get the current balance of the account', function () {
        expect(this.aggregate.state).to.have.property('balance', 23);
      });
    });

    describe('GIVEN account does not have any events', function () {
      before(function () {
        this.aggregate = AccountAggregate.findById('nonexistentid', new EventStore([]));
      });

      it('SHOULD return null', function () {
        expect(this.aggregate.state).to.be.null;
      });
    });

    describe('GIVEN account does not have account events for the AggregateType Balance', function () {
      before(function () {
        this.aggregate = AccountAggregate.findById('0bec2908-02eb-4c35-9a58-5a72183f986f', this.eventStore);
      });

      it('SHOULD be able to get the account information', function () {
        expect(this.aggregate.state).to.be.ok;
        expect(this.aggregate.state).to.have.property('username', 'janedoe');
        expect(this.aggregate.state).to.have.property('fullName', 'janedoe');
        expect(this.aggregate.state).to.have.property('email', 'jemail@ml.com');
      });

      it('SHOULD have a balance defaults to 0', function () {
        expect(this.aggregate.state).to.have.property('balance', 0);
      });
    });
  });

  describe('#createAccount', function () {
    describe('GIVEN account already exists', function () {
      it('SHOULD throw AccountAlreadyExistsError', async function () {
        expect(async() => AccountAggregate.createAccount(
          'd5dedb98-1894-4cf5-9b42-edb755b16f04',
          {
            email: 'email@ami.lo',
            fullName: 'cherry',
            password: '123password',
            username: 'cherryp',
          },
          this.eventStore,
        )).to.be.rejected
        //The description is to throw AccountAlreadyExistsError
      });
    });

    describe('GIVEN account does not exists yet', function () {
      it('SHOULD be able to create the account', function () {
        const aggregateId = 'be128cb5-b405-4a99-a583-6c10bc5f1233';
        expect(AccountAggregate.createAccount(
          aggregateId,
          {
            email: 'email@ami.lo',
            fullName: 'cherry',
            password: '123password',
            username: 'cherryp',
          },
          this.eventStore,
        )).to.be.ok;

        const event = this.eventStore.getEvents({ aggregateId, afterVersion: 0 });
        expect(event).to.have.length(1);
      });
    });
  });

  describe('#updateAccount', function () {
    describe('GIVEN account exists', function () {
      it('SHOULD be able to update the account', function () {
        const account = AccountAggregate.findById('60329145-ba86-44fb-8fc8-519e1e427a60', this.eventStore);
        expect(account.updateAccount({ username: 'storm' })).to.be.ok;

        expect(account.state).to.have.property('username', 'storm');
      });
    });

    describe('GIVEN account does not exists', function () {
      it('SHOULD throw an AccountNotFoundError', function () {
        const account = AccountAggregate.findById('nonexistent', this.eventStore);
        expect(() => account.updateAccount({ username: 'iexists' })).to.throw(AccountNotFoundError);

        const event = this.eventStore.getEvents().filter((event: Event) => event.body.username === 'iexists');
        expect(event).to.have.length(0); 
      });
    });
  });

  describe('#creditBalance', function () {
    describe('GIVEN account does not exists', function () {
      it('SHOULD throw an AccountNotFoundError AND no event will be added', function () {
        const eventStore = new EventStore([]);
        const account = AccountAggregate.findById('nonexistent', eventStore);
        expect(account).to.be.ok;

        expect(() => account!.creditBalance(10)).to.throw(AccountNotFoundError);
        expect(eventStore.getEvents()).to.have.length(0);
      });
    });

    describe('GIVEN account exists', function () {
      beforeEach(function () {
        this.aggregateId = 'd5dedb98-1894-4cf5-9b42-edb755b16f04';
        const account = AccountAggregate.findById(this.aggregateId, this.eventStore);
        assert(account);

        this.amountCredited = Math.floor(Math.random() * 100_000);
        expect(account.creditBalance(this.amountCredited)).to.be.true;

        this.account = account;
      });

      it('SHOULD be able to add the correct balance', function () {
        expect(this.account.state).to.have.property('balance', this.amountCredited);
      });

      it('SHOULD be able to add the event to the EventStore', function () {
        const creditEvent = this.eventStore.getEvents()
          .filter((event: Event<any, any>) => event.aggregateType === AggregateType.Account
            && event.aggregateId === this.aggregateId
            && event.body.amount === this.amountCredited);

        expect(creditEvent).to.have.length(1);
      });
    });
  });

  describe('#debitBalance', function () {
    describe('GIVEN account does not exists', function () {
      it('SHOULD throw an AccountNotFoundError AND no event will be added', function () {
        const eventStore = new EventStore([]);
        const account = AccountAggregate.findById('nonexistent', eventStore);
        expect(account).to.be.ok;

        expect(() => account!.debitBalance(10)).to.throw(AccountNotFoundError);
        expect(eventStore.getEvents()).to.have.length(0);
      });
    });

    describe('GIVEN account exists', function () {
      describe('GIVEN account has enough funds to debit', function () {
        beforeEach(function () {
          this.aggregateId = '60329145-ba86-44fb-8fc8-519e1e427a60';
          const account = AccountAggregate.findById(this.aggregateId, this.eventStore);
          assert(account);
          expect(account.debitBalance(3)).to.be.true;

          this.account = account;
        });

        it('SHOULD be able to debit the amount', function () {
          expect(this.account.state).to.have.property('balance', 20);
        });

        it('SHOULD be able to add the event to the EventStore', function () {
          const debitEvent = this.eventStore.getEvents()
            .filter((event: Event<any, any>) => event.aggregateType === AggregateType.Account
              && event.aggregateId === this.aggregateId
              && event.type === 'BalanceDebited'
              && event.body.amount === 3);

          expect(debitEvent).to.have.length(1);
        });
      });

      describe('GIVEN account does not have enough funds', function () {
        it('SHOULD throw an InsufficientFundsError', function () {
          const aggregateId = '60329145-ba86-44fb-8fc8-519e1e427a60';
          const previousTotalEvents = this.eventStore.getEvents().length;
          const account = AccountAggregate.findById(aggregateId, this.eventStore);
          assert(account);

          expect(() => account.debitBalance(1000)).to.throw(InsufficientFundError);
          expect(this.eventStore.getEvents()).to.have.length(previousTotalEvents);
        });
      });
    });
  });
});
