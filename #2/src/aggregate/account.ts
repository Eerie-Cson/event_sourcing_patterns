import { AccountCreatedEvent, AccountUpdatedEvent, AggregateType, CreditedEvent, DebitEvent } from '../../../events';
import EventStore from '../library/eventstore';
import Aggregate from '../library/aggregate';
import { InsufficientFundError,  AccountNotFoundError, AccountAlreadyExistsError } from '../library/errors';

export type Account = {
  username: string;
  fullName: string;
  password: string;
  email: string;
  balance: number;
};

export type AccountState = Account | null;

type AccountAggregateEvents = AccountCreatedEvent | AccountUpdatedEvent | CreditedEvent | DebitEvent;

export default class AccountAggregate extends Aggregate<AccountState> {

  public static findById(id: string, eventStore: EventStore): AccountAggregate {
    const account = new AccountAggregate(id, eventStore);
    account.fold();
    return account;
  }

  public get aggregateType() {
    return AggregateType.Account;
  }

  constructor (id: string, eventStore: EventStore) {
    super(id, null, eventStore);
  }

  /**
   * This method will be called for each event that will be processed by the aggregate
   * that is from the eventstore.
   * @param event 
   * @returns 
   */
  protected apply(event: AccountAggregateEvents): AccountState {
    // TODO: Implement this method
        
    let currentState: AccountState = this.state;
    
    if(!currentState){
      
      if(event.type !== 'AccountCreated') throw new AccountNotFoundError(event.aggregateId)        

      currentState = {
        ...event.body,
        balance: 0
      }
      
      return currentState;
      
    }

    switch(event.type) {
      case 'AccountCreated': throw new AccountAlreadyExistsError(event.aggregateId);
      
      case 'AccountUpdated': {
        const currentStateObj = currentState;
        Object.keys(currentState).forEach(key => {
          currentStateObj[key] = (event.body[key]) ? event.body[key] : currentStateObj[key] 
        });
  
        currentState = currentStateObj;
        return currentState;
      }

      case 'BalanceCredited': {
        currentState = {
          ...currentState,
          balance: currentState.balance + event.body.amount
        }
        return currentState;
      }

      case 'BalanceDebited': {
        const balance = currentState.balance - event.body.amount;
      
        if (balance < 0) throw new InsufficientFundError(event.aggregateId) 
        
        currentState = {
          ...currentState,
          balance: balance
        }
      }

      default: return currentState;
      
    }

  }
 
  public static createAccount(id: string, info: Omit<Account, 'balance'>, eventStore: EventStore) {
    const account = this.findById(id, eventStore);
    account.createEvent('AccountCreated', info);
    return id;
  }

  public updateAccount(info: Partial<Omit<Account, 'balance'>>) {
    this.createEvent('AccountUpdated', info);
    return true;
  }

  public creditBalance(amount: number) {
    this.createEvent('BalanceCredited', { amount });
    return true;
  }

  public debitBalance(amount: number) {
    this.createEvent('BalanceDebited', { amount });
    return true;
  }
}
