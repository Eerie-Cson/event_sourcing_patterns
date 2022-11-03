import { AccountEvents } from '../../events';

export function calculateAccountBalance(events: typeof AccountEvents, accountId: string): number {

  /**
   * This filter all the events of this account relevant to balance, then process it by using a reducer that adds all the remaining balance and 
   * the balance input if the type of event is BalanceCredited, and otherwise for BalanceDebited
   */
  
  const balance = events
    .filter((account) =>
      (account.aggregateId === accountId) &&
      (account.type === 'BalanceCredited' || account.type === 'BalanceDebited')
    )
    .reduce((bal, acc) => 
      (acc.type === 'BalanceCredited' ) ? 
        bal + (acc.body.amount as number) : 
        bal - (acc.body.amount as number) , 0
    )
  return balance;
  
}

export function getAccountInformation(events: typeof AccountEvents, accountId: string) {

  /**
 * Get all the events of the accountID with the event types AccountCreated and AccountUpdated to process Account information.
 * If no events have been obtained, then return null
 * Now that all the events relevant to account information have been obtained, a reducer will check if there is an update in the body of the event,
 * then changes the state of the account information.
 * The way the reducer works is that it iterates over keys of the body of the AccountCreated event and checks if the value paired to the current key of the
 *  AccountUpdated body exists in the key of AccountCreated and changes it if true
 */

  const accountEvents = events                    
    .filter((accountEvent) => 
      (accountEvent.aggregateId === accountId) &&
      (accountEvent.type === 'AccountCreated' || accountEvent.type === 'AccountUpdated') 
    );
  
  if (!accountEvents.length) return null         

  const body = accountEvents.reduce((prevEvent, event) => {
    const updatedBody = {};

    Object.keys(prevEvent.body).forEach(key => {
      updatedBody[key] = (event.body[key]) ? event.body[key] : prevEvent.body[key]
    });

    const result = {
      ...prevEvent,
      body: updatedBody
    };

    return result
  });

  /**
 * For the approvedActions of deposit and withdrawal, check if the account from the event is the same as the accountID 
 * Then get all the events based on the ID of the withdrawal/deposit created to be checked if the DepositCreated/WithdrawalCreated event has been encountered
 * If yes, then process all the amounts accumulated
 */
  
  const approvedEvents = events                
    .filter((event, __, arr) => 
      (event.aggregateType === 101 || event.aggregateType === 102) &&
      event.body.account === accountId &&
      arr.filter(x=>x.aggregateId === event.aggregateId ).length>1
    )

  const actionsTotal = approvedEvents.reduce((tot, accum) => {
    if (accum.type === 'DepositCreated' && accum.body.amount) {
      const total = tot.totalApprovedDepositAmount + accum.body.amount
      return {
        ...tot,
        totalApprovedDepositAmount: total
      }
    }
    else if (accum.type === 'WithdrawalCreated' && accum.body.amount) {
      const total =  tot.totalApprovedDepositAmount - accum.body.amount
      return {
        ...tot,
        totalApprovedWithdrawalAmount: total
      }
    }
    return tot
  },{
    totalApprovedWithdrawalAmount: 0,
    totalApprovedDepositAmount: 0
  })
  
//Finally, combine the information of the account as well as the total approved withdrawal/deposits
  return {
    ...body.body,
    ...actionsTotal
  }

}