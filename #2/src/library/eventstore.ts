import cloneDeep from 'clone-deep';
import EventEmitter from 'events';
import { AggregateType, Event } from '../../../events';

/**
 * EventStore manages all the events of the aggregates. It stores the chronological order of the events.
 */
export default class EventStore extends EventEmitter {
  private _events: Event<any, any>[] = [];

  public constructor(initialEvents: Event<any, any>[] = []) {
    super();

    this._events = cloneDeep(initialEvents);
  }

  public getEvents(filter?: { aggregateId: string; afterVersion: number }) {
    if (filter) {
      return cloneDeep(this._events.filter((event) =>
        event.aggregateId === filter.aggregateId && event.version > filter.afterVersion));
    }
    return cloneDeep(this._events);
  }

  public createEvent(event: Event<any, any>) {
    this._events.push(event);
    this.emit('event', event);
  }

  public subscribe(eventTypes: { type?: string; aggregateType: AggregateType }[]) {
    const emitter = new EventEmitter();

    this.on('event', (event: Event<any, any>) => {
      for (const filter of eventTypes) {
        if (event.aggregateType !== filter.aggregateType) {
          continue;
        }

        if (filter.type && event.type !== filter.type) {
          continue;
        }

        emitter.emit('event', event);
        break;
      }
    });

    return emitter;
  }
}