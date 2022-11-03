By this point, you already knew what aggregate and projection is. `Aggregate` controls the business logic, while the `projection`, is used for presenting the data, thus, it uses databases such that it will be easily to be queried and presented.

## Eventstore
The eventstore is a library in this case that will store the events, but in
production system, this is a service that will maintain aggregate versions and events.

The eventstore is responsible for storing and providing events for projection and aggregate, it will also publish events that is newly created or stored. These published event are being subscribed by the `projection` such that it will automatically apply those event to the handlers(function that will process the event).

## Exercise
For this exercise you will be tasked to implement the apply that is in `aggregate/account.ts` and `projection/account.ts`.

Both these methods is used to process the events, the only difference is that, their storage is different, aggregate uses a memory, while projection uses a database.
