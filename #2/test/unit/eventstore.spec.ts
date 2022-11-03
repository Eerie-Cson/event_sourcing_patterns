import { expect } from 'chai';
import sinon from 'sinon';
import { AccountEvents, AggregateType, Event } from '../../../events';
import EventStore from '../../src/library/eventstore';

describe('EventStore', function() {
  beforeEach(function() {
    this.eventStore = new EventStore();
    this.sandbox = sinon.createSandbox();
  });

  describe('#createEvent', function() {
    beforeEach(function() {
      this.event = AccountEvents[0];
      
      this.emitStub = this.sandbox.stub(this.eventStore, 'emit');
      this.eventStore.createEvent(this.event);
    });

    afterEach(function () {
      this.sandbox.restore();
    });

    it('SHOULD be able to add the event to the eventstore', function() {
      expect(this.eventStore._events).to.have.length(1);
      expect(this.eventStore._events[0]).to.deep.equal(this.event);
    });

    it('SHOULD emit the event', function() {
      expect(this.emitStub.calledOnce).to.be.true;
      expect(this.emitStub.args[0]).to.deep.equal(['event', this.event]);
    });
  });

  describe('#getEvents', function() {
    it('SHOULD be able to retrieve all the events', function() {
      expect(this.eventStore.getEvents()).to.deep.equal([]);
    });
  });

  describe('#subscribe', function() {
    const test = [
      {
        filter: [{ aggregateType: AggregateType.Account }],
        events: AccountEvents.filter((event) => event.aggregateType === AggregateType.Account)
      },
      {
        filter: [{ aggregateType: AggregateType.Account, type: 'AccountUpdated' }],
        events: AccountEvents.filter((event) => event.aggregateType === AggregateType.Account && event.type === 'AccountUpdated')
      },
      {
        filter: [
          { aggregateType: AggregateType.Account, type: 'AccountUpdated' },
          { aggregateType: AggregateType.Deposit },
        ],
        events: AccountEvents.filter((event) => 
          (event.aggregateType === AggregateType.Account && event.type === 'AccountUpdated')
          || event.aggregateType === AggregateType.Deposit)
      },
    ];

    for (const { filter, events } of test) {
      it('SHOULD be able to publish events correctly', async function() {
        const subscription = this.eventStore.subscribe(filter);
        const receivedEvents: Event[] = [];
        subscription.on('event', (event: Event) => receivedEvents.push(event));

        AccountEvents.forEach((event) => this.eventStore.createEvent(event));

        expect(receivedEvents).to.deep.equal(events);
      });
    }
  });
});
