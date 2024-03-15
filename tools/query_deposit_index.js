const ethers = require("ethers");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const providerUrl = process.env.PROVIDER_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

const contractABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "pubkey",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "withdrawal_credentials",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "amount",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
      { indexed: false, internalType: "bytes", name: "index", type: "bytes" },
    ],
    name: "DepositEvent",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bytes", name: "pubkey", type: "bytes" },
      {
        internalType: "bytes",
        name: "withdrawal_credentials",
        type: "bytes",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "bytes32", name: "deposit_data_root", type: "bytes32" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_count",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get_deposit_root",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
];

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const contract = new ethers.Contract(contractAddress, contractABI, provider);

const batchSize = 100; 

function littleEndianToNumber(hexString) {
  const byteArray = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
  const bigEndianArray = byteArray.reverse();
  const bigEndianHexString = bigEndianArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return parseInt(bigEndianHexString, 16);
}

const initKeys = 4096;
async function fetchEventsInRange(fromBlock, toBlock, filePath) {
    const events = await contract.queryFilter("DepositEvent", fromBlock, toBlock);
    events.forEach(event => {
      console.log(`Block Number: ${parseInt(event.blockNumber, 16)}`);
      console.log(`Transaction: ${event.transactionHash}`);
      console.log(`Pubkey: ${event.args.pubkey}`);
      console.log(`Withdrawal Credentials: ${event.args.withdrawal_credentials}`);
      console.log(`Amount: ${event.args.amount}`);
      console.log(`Signature: ${event.args.signature}`);
      let index = littleEndianToNumber(event.args.index);
      index = index + initKeys;
      console.log(`Index: ${index}`);
      console.log("------------------------");

      const dataString = `${event.args.pubkey}:${index}\n`;
      fs.appendFileSync(filePath, dataString);
  });
}

async function main() {
    const filePath = path.join(__dirname, 'validator_index.txt');

    let fromBlock = 0;
    let latestBlock = await provider.getBlockNumber();

    while (fromBlock < latestBlock) {
        let toBlock = fromBlock + batchSize;
        if (toBlock > latestBlock) {
            toBlock = latestBlock;
        }

        console.log(`Fetching events from block ${fromBlock} to ${toBlock}`);
        await fetchEventsInRange(fromBlock, toBlock, filePath);

        fromBlock = toBlock + 1;
    }
}

main().catch(console.error);
