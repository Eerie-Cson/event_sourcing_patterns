import Queue from 'p-queue';
import EventEmitter from 'events';

import { AggregateType, Event } from '../../../events';
import EventStore from './eventstore';
import mongoose from 'mongoose';

mongoose.disconnect();
mongoose.connect();

/**
 * Projections are consumers and listeners of the events. This has a set of events that will consume and
 * listen whenever new events are published through `_eventTypes`. This is then processed to calculate/come up a state
 * that will be used for querying. Like keeping track of accounts, deposits, withdrawals, etc. records.
 */
export default abstract class Projection {
  private _queue = new Queue({ concurrency: 1 });
  private _subscriber: EventEmitter | null = null;

  constructor(
    private _eventStore: EventStore,
    private _eventTypes: { type?: string; aggregateType: AggregateType }[]
  ) {}

  public async start() {
    for (const event of this._eventStore.getEvents()) {
      await this.apply(event);
    }

    this._subscriber = this._eventStore.subscribe(this._eventTypes)
      .on('event', async (event: Event) => this._queue.add(() => this.apply(event)));
  }

  public async stop() {
    if (!this._subscriber) {
      return;
    }

    this._subscriber.removeAllListeners();
    this._subscriber = null;
    await this._queue.onIdle();
  }

  protected abstract apply (event: Event): Promise<void>;
}