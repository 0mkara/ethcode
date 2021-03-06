import React, { useContext, useState, useEffect } from 'react';
import ReactJson, { OnCopyProps } from 'react-json-view';
import { setGanacheAccountsOption, setLocalAccountOption } from '../helper';

import { ABIDescription, IAccount, CompiledContract } from '../types';

import ContractDeploy from './ContractDeploy';
import Deploy from './Deploy';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Account from './Account';
import { AppContext } from '../appContext';

// @ts-ignore
const vscode = acquireVsCodeApi(); // eslint-disable-line

interface ITestNet {
  value: string;
  label: string;
}

export const MainView = () => {
  const [processMessage, setProcessMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [transactionResult, setTransactionResult] = useState('');
  const [localAcc, setLocalAcc] = useState<any[]>([]);
  const [testNetAcc, setTestNetAcc] = useState<any[]>([]);
  const [testNets] = useState<Array<ITestNet>>([
    { value: 'ganache', label: 'Ganache' },
    // { value: '3', label: 'Ropsten' },
    // { value: '4', label: 'Rinkeby' },
    { value: '5', label: 'Görli' },
  ]);
  const [testNet, setTestNet] = useState<ITestNet>(testNets[0]);
  const [abi, setAbi] = useState<Array<ABIDescription>>([]);
  const [bytecode, setBytecode] = useState<string>('');
  // Context
  const {
    currAccount,
    setAccount,
    accounts,
    contract,
    accountBalance,
    setCompiledContract,
    setTestNetID,
    setSelectorAccounts,
    setAccountBalance,
    setCallResult,
    error,
    setError,
  } = useContext(AppContext);

  const mergeAccount = () => {
    // TODO: update reducer
    // merge local accounts and testnet accounts
    if (localAcc.length > 0 && testNetAcc.length > 0) {
      setSelectorAccounts([
        {
          label: 'Ganache',
          options: testNetAcc,
        },
        {
          label: 'Local Accounts',
          options: localAcc,
        },
      ]);
    } else if (localAcc.length > 0) {
      setSelectorAccounts([...localAcc]);
    } else if (testNetAcc.length > 0) {
      setSelectorAccounts([
        {
          label: 'Ganache',
          options: testNetAcc,
        },
      ]);
    } else {
      setSelectorAccounts([]);
    }
  };
  const loadContract = (_contract: any) => {
    try {
      const contract: CompiledContract = _contract;
      setCompiledContract(contract);
    } catch (error) {
      console.error(error);
      setProcessMessage('Error Parsing CompiledContract');
    }
  };

  useEffect(() => {
    mergeAccount();
  }, [localAcc, testNetAcc]);

  useEffect(() => {
    window.addEventListener('message', async (event) => {
      const { data } = event;
      // accounts
      if (data.localAccounts) {
        setLocalAcc(setLocalAccountOption(data.localAccounts));
      }
      if (data.fetchAccounts) {
        const { balance, accounts } = data.fetchAccounts;
        setTestNetAcc(setGanacheAccountsOption(accounts));
        const currAccount: IAccount = {
          label: accounts[0],
          value: accounts[0],
        };
        setAccount(currAccount);
        setAccountBalance(balance);
      }
      if (data.balance) {
        const { balance, account } = data;
        setAccount(account);
        setAccountBalance(balance);
      }
      if (data.contract) {
        loadContract(data.contract);
      }
      if (data.processMessage) {
        const { processMessage } = data;
        setProcessMessage(processMessage);
      }
      if (data.testPanel === 'main') {
        setTabIndex(0);
      }
      if (data.errors) {
        setError(data.errors);
      }
      if (data.callResult) {
        const result = data.callResult;
        setCallResult(result);
      }
      if (data.transactionResult) {
        setTransactionResult(data.transactionResult);
      }
      if (data.networkId) {
        const testnet = testNets.filter((net) => net.value === JSON.stringify(data.networkId));
        setTestNetID(data.networkId);
        setTestNet(testnet[0]);
      }
    });
    // Component mounted start getting gRPC things
    vscode.postMessage({ command: 'get-localAccounts' });
    vscode.postMessage({ command: 'run-getAccounts' });
    vscode.postMessage({ command: 'get-contract' });
    vscode.postMessage({ command: 'get-network' });
  }, []);

  const openAdvanceDeploy = (): void => {
    setTabIndex(2);
  };
  const reactJSONViewStyle = {
    // border: 'solid 1px red',
    maxHeight: '30vh',
    maxWidth: '90vw',
    overflow: 'scroll',
    marginLeft: 'auto',
    marginRight: 'auto',
  };
  const handleCopy = (copy: OnCopyProps) => {
    if (typeof copy.src === 'string') {
      setBytecode(copy.src);
    } else {
      // @ts-ignore
      const abi: Array<ABIDescription> = Object.keys(copy.src).map((key) => copy.src[key]);
      setAbi(abi);
    }
  };
  return (
    <div>
      <div className="selectors">Selected Network: {testNet.label}</div>
      {transactionResult && (
        <div className="tx-info">
          <span>Last transaction:</span>
          <pre>{transactionResult}</pre>
        </div>
      )}
      <div className="tabs-container">
        <Tabs
          selectedIndex={tabIndex}
          onSelect={(tabIndex) => setTabIndex(tabIndex)}
          selectedTabClassName="react-tabs__tab--selected"
        >
          <TabList className="react-tabs tab-padding">
            <div className="tab-container">
              <Tab>Main</Tab>
              <Tab>Account</Tab>
              <Tab>Deploy</Tab>
            </div>
          </TabList>
          {/* Main panel */}
          <TabPanel className="react-tab-panel">
            {accounts && accounts.length > 0 && (
              <div className="account-brief">
                <b>Account: </b>
                <span>{currAccount ? currAccount.checksumAddr || currAccount.pubAddr || currAccount.value : '0x'}</span>
                <br />
                <b>Balance: </b>
                <span>{accountBalance} wei</span>
              </div>
            )}
            {contract && (
              <div className="compiledOutput">
                <ReactJson
                  src={contract}
                  name="Contracts"
                  theme="monokai"
                  collapsed
                  collapseStringsAfterLength={12}
                  style={reactJSONViewStyle}
                  enableClipboard={handleCopy}
                />
              </div>
            )}
            {currAccount && (Object.keys(abi).length > 0 || bytecode.length > 0) && (
              <div className="contract-container">
                <ContractDeploy bytecode={bytecode} abi={abi} vscode={vscode} openAdvanceDeploy={openAdvanceDeploy} />
              </div>
            )}
          </TabPanel>
          {/* Account Panel */}
          <TabPanel>
            <Account vscode={vscode} />
          </TabPanel>
          {/* Advanced Deploy panel */}
          <TabPanel>
            {currAccount && (Object.keys(abi).length > 0 || bytecode.length > 0) && (
              <div className="contract-container">
                <Deploy bytecode={bytecode} abi={abi} vscode={vscode} errors={error!} />
              </div>
            )}
          </TabPanel>
        </Tabs>
      </div>
      <div className="process-msg-container">
        {processMessage && <pre className="processMessage">{processMessage}</pre>}
      </div>
      <div className="error-msg">{error && <pre>{error.message}</pre>}</div>
    </div>
  );
};
