const { ContainerType, ByteVectorType } = require("@chainsafe/ssz");
const { NumberUintType } = require("@chainsafe/ssz");
const { BigNumber } = require("bignumber.js");
const { ethers } = require("ethers");
require('dotenv').config();

const providerUrl = process.env.PROVIDER_URL;
const privateKey = process.env.PRIVATE_KEY;
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

const depositDataContainer = new ContainerType({
  fields: {
    pubkey: new ByteVectorType({
      length: 48,
    }),
    withdrawalCredentials: new ByteVectorType({
      length: 32,
    }),
    amount: new NumberUintType({
      byteLength: 8,
    }),
    signature: new ByteVectorType({
      length: 96,
    }),
  },
});

function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join("");
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  const transactionParameters = {
    value: ethers.utils.parseEther(process.env.DEPOSTI_VALUE),
    gasLimit: process.env.GAS_LIMIT,
    gasPrice: ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei"),
  };

  const bnInput = new BigNumber(32);
  const reconstructedRootAmount = bnInput.multipliedBy(1e9).toNumber();

  const pubkeyHex = process.env.PUBKEY_HEX;
  const pubkeyBytes = Buffer.from(pubkeyHex, "hex");

  const withdrawalCredentialsHex = process.env.WITHDRAWAL_CREDENTIALS_HEX;
  const withdrawalCredentialsBytes = Buffer.from(
    withdrawalCredentialsHex,
    "hex"
  );

  const signatureHex = process.env.SIGNATURE_HEX;
  const signatureBytes = Buffer.from(signatureHex, "hex");

  const reconstructedKeyFile = {
    pubkey: pubkeyBytes,
    withdrawalCredentials: withdrawalCredentialsBytes,
    amount: reconstructedRootAmount,
    signature: signatureBytes,
  };

  const byteRoot = depositDataContainer.hashTreeRoot(reconstructedKeyFile);
  const reconstructedDepositDataRoot = `0x${buf2hex(byteRoot)}`;

  try {
    const tx = await contract.deposit(
      reconstructedKeyFile.pubkey,
      reconstructedKeyFile.withdrawalCredentials,
      reconstructedKeyFile.signature,
      reconstructedDepositDataRoot,
      transactionParameters
    );

    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
}

main();
