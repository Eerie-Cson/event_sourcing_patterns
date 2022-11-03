export class AccountNotFoundError extends Error {
  public constructor(id: string) {
    super(`Account ${id} does not exists.`);
  }
}

export class InsufficientFundError extends Error {
  public constructor(id: string) {
    super(`Account ${id}, does not have enough funds.`);
  }
}

export class AccountAlreadyExistsError extends Error {
  public constructor(id: string) {
    super(`Account with ${id} already exists.`);
  }
}