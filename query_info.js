const { ethers } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(
  "http://88.99.94.109:10545"
);

const contractAddress = "0x4242424242424242424242424242424242424242";
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

// 3. Connect to the contract and fetch the version
async function main() {
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  const root = await contract.get_deposit_root()
  console.log("Contract Version:", root);

  const count = await contract.get_deposit_count()
  console.log("Contract deposit count:", count);
}

main();
