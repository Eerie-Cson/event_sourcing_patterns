import { AggregateType, Event } from '../../../events';
import EventStore from '../library/eventstore';
import Projection from '../library/projection';
import { AccountAlreadyExistsError, AccountNotFoundError, InsufficientFundError } from '../library/errors';
import mongoose from 'mongoose';



export const AccountSchema = new mongoose.Schema({
    id: String,
    username: String,
    fullName: String,
    password: String,
    email: String,
    balance: Number,
    totalApprovedWithdrawalAmount: Number,
    totalApprovedDepositAmount: Number,
    totalCounter: Number,
    counterId: String
},
)

export const accountModel = mongoose.model('Account', AccountSchema)

export default class AccountProjection extends Projection {
  public constructor(eventStore: EventStore) {
    super(
      eventStore,
      [
        { aggregateType: AggregateType.Account },
        { aggregateType: AggregateType.Deposit },
        { aggregateType: AggregateType.Withdrawal },
      ],
    );
  }

  protected async apply(event: Event) {
    
    const account = await accountModel.findOne({id: event.aggregateId});
    
    if (event.aggregateType === 100) {
      if(!account){
        if(event.type !== 'AccountCreated') throw new AccountNotFoundError(event.aggregateId);

        const input = {      
          id: event.aggregateId,
          data: {
            ...event.body,
            balance: 0,
            totalApprovedWithdrawalAmount: 0,
            totalApprovedDepositAmount: 0,
            totalCounter: 0,
            depositId: null,
            counterId: null
          }
        }
        await accountModel.create({...input.data, id: input.id});
        return;
      };

      if(event.type==='AccountCreated'){ 
        throw new AccountAlreadyExistsError(event.aggregateId)
      };

      if(event.type === 'AccountUpdated'){
        await accountModel.findOneAndUpdate({id: event.aggregateId, ...event.body});
        return;
      }

      if (event.type === 'BalanceCredited') {
        const balance: number = account.balance + event.body.amount;
        await accountModel.findOneAndUpdate({id: event.aggregateId, balance: balance});
        return;
      }

      if(event.type === 'BalanceDebited' && event.aggregateType === 100) {
        const balance: number = account.balance as number - event.body.amount;
        
        if (balance < 0) throw new InsufficientFundError(event.aggregateId);
        await accountModel.findOneAndUpdate({id: event.aggregateId, balance: balance});
        return;
      }
    }
    
    if(event.aggregateType === 101) {
 
      
      if(event.type === 'DepositCreated')
      { 
        const accountDeposit = await accountModel.findOne({id: event.body.account});
        let total: number;

        if(!accountDeposit) throw new AccountNotFoundError(event.body.account);


        if(accountDeposit.totalCounter === 0) total = accountDeposit.totalApprovedDepositAmount as number - event.body.amount;
        total = event.body.amount + accountDeposit.totalCounter;
        
        await accountModel.findOneAndUpdate({id: accountDeposit.id}, { $set: {totalCounter: total, counterId: event.aggregateId} });
        return
      }

      if(event.type === 'DepositApproved')
      {
        const deposit = await accountModel.findOne({counterId: event.aggregateId});

        if(deposit) {
          await accountModel.findOneAndUpdate({id: deposit.id}, { $set: {totalApprovedDepositAmount: deposit.totalCounter, totalCounter: 0, counterId: null} })
          return
        }
        return
      } 
    }

    if(event.type === 'WithdrawalCreated') {
      const accountWithdraw = await accountModel.findOne({id: event.body.account});
      let total: number;

      if(!accountWithdraw) throw new AccountNotFoundError(event.body);

      (accountWithdraw.totalCounter === 0) ? 
        total = accountWithdraw.totalApprovedDepositAmount as number - event.body.amount:
        total = accountWithdraw.totalCounter as number - event.body.amount;

      await accountModel.findOneAndUpdate({id: accountWithdraw.id}, { $set: {totalCounter: total, counterId: event.aggregateId} });
      return
    }
    
    if(event.type === 'WithdrawalApproved') {
      const withdrawal = await accountModel.findOne({counterId: event.aggregateId});

      if(withdrawal) {
        await accountModel.findOneAndUpdate({id: withdrawal.id}, { $set: {totalApprovedWithdrawalAmount: withdrawal.totalCounter, totalCounter: 0, counterId: null} })
        return
      }
      return
    }
    return
    // if(event.type === 'DepositCreated')
    // { 
    //   const accountDeposited = await accountModel.findOne({id: event.body.account});
    //   if(!accountDeposited) throw new AccountNotFoundError(event.body.account);
      
    //   if(!account) {
    //     deposits.push({id: event.aggregateId, total: accountDeposited.totalApprovedDepositAmount as number}); //initialize 1
    //     return
    //   }
      
    //   const index = deposits.findIndex(deposit => deposit.id === event.aggregateId); //find index of deposit u want to update
    //   deposits[index].total = deposits[index].total + event.body.amount; // update the total of the deposit sa nkita nga index
    //   return;
    // }

    // if(event.type === 'DepositApproved'){
    //   const index = deposits.findIndex(deposit => deposit.id === event.aggregateId)
    //   const totalAccountDeposit = deposits[index];
    //   console.log(totalAccountDeposit);
    //   await accountModel.findOneAndUpdate({id: totalAccountDeposit.id, totalApprovedDepositAmount: totalAccountDeposit.total});
    //   return
      
    // }

 
    
    // TODO: Implement this method, to maintain a state in your database.
    // You can choose any database of your own, but suggested is MongoDB.
  }
}