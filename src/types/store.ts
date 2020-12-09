import { CompilationResult, IAccount, TransactionResult } from './solidityTypes';

export interface IAccStore {
  currAccount: IAccount | null;
  balance: number;
  accounts: IAccount[];
}

export interface IDebugStore {
  testNetId: string;
  processMsg: string;
  error: Error | null;
}

export interface IContractStore {
  compiledResult: CompilationResult | null;
  callResult: { [key: string]: string };
  testNetCallResult: { [key: string]: string };
  deployedResult: TransactionResult | null;
}

export type GlobalStore = {
  test: {
    testResults: Array<any>;
    testResult: { [key: string]: string };
  };
  contractsStore: IContractStore;
  accountStore: IAccStore;
  debugStore: IDebugStore;
  txStore: {
    unsignedTx: string;
    deployedResult: TransactionResult;
  };
};
