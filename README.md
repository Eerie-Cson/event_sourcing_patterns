# OneWallet BE Exercises
Before you proceed with the exercise, this assumes that you have already read/knowledgeable when it comes to the event sourcing.

## Events
Events that will be used for all the tests can be found on the `./event.ts`.

Each event has the following properties:
* `aggregateType`: This describes as to what kind of entity it refers to, whether an Account, Deposit, Withdrawal, etc..
* `aggregateId`: The id of the entity that it refers.
* `version`: The version of the event given the `aggregateType` and `aggregateId` took place the moment this event was created. Each mutation on the entity has the version + 1 of the previous version.
* `type`: This defines as to what type of event took place, like `AccountCreated`, `AccountUpdated`, etc..
* `body`: It describes as to what properties has been changed/added that was meant by the `type`. ie:

  * When type is `AccountCreated` with `body: { username: 'johndoe' }`, it means that there is an account that was created with a username `johndoe`.

Clone this repository into a personal private repository in Github and add @djansyle as collaborator of the repository. Implement all functions/method that has a TODO.
Aim to pass all the test scenarios.


**Environment:**

OS: **Linux**

Node: **v12.18.2**

NPM: **6.14.5**
