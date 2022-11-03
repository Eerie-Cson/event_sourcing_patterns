For this exercise, you will be implementing the `calculateAccountBalance` and the `getAccountInformation`.


### calculateAccountBalance
The `calculateAccountBalance` will basically calculates the account's balance that is from the event that is passed as the first parameter of the function.

When there is a `BalanceCredited` event, it means to add a balance to the account and `BalanceDebited` to deduct.


### getAccountInformation
This will compute the events that is passed as the first parameter of the function, 
and will return the computed account information.

There are `AccountCreated` and `AccountUpdated` event. When there is an `AccountCreated`, it means that whatever that is on the `body` are considered new
properties of the account, and when there is `AccountUpdated` it means to updated
the existing fields that is on the body to the current account's properties.

For the `totalApprovedDepositAmount` and `totalApprovedWithdrawalAmount`, you need to keep track of the `account` property in the `body` of `DepositCreated` or `WithdrawalCreated` as the owner of the deposit/withdrawal, then only add the amount when there is a `DepositApproved` / `WithdrawalApproved`. Any deposit / withdrawal that has been made without an `approved` event should not be included.
