const {
  ContainerType,
  ByteVectorType,
  NumberUintType,
} = require("@chainsafe/ssz");
const { BigNumber } = require("bignumber.js");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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
    pubkey: new ByteVectorType({ length: 48 }),
    withdrawalCredentials: new ByteVectorType({ length: 32 }),
    amount: new NumberUintType({ byteLength: 8 }),
    signature: new ByteVectorType({ length: 96 }),
  },
});

function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join("");
}

function createLockDirectory(filePath) {
  const lockDir = `${filePath}-locks`;
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir);
  }
  return lockDir;
}

function checkLockFile(lockDir, pubkey) {
  const lockFilePath = path.join(lockDir, `${pubkey}.lock`);
  return fs.existsSync(lockFilePath);
}

function createLockFile(lockDir, pubkey) {
  const lockFilePath = path.join(lockDir, `${pubkey}.lock`);
  fs.writeFileSync(lockFilePath, "");
}

async function processFile(filePath) {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  const depositData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const lockDir = createLockDirectory(filePath);

  for (const data of depositData) {
    const pubkeyHex = data.pubkey;
    if (checkLockFile(lockDir, pubkeyHex)) {
      console.log(
        `Transaction for pubkey ${pubkeyHex} already processed. Skipping.`
      );
      continue;
    }

    const pubkeyBytes = Buffer.from(pubkeyHex, "hex");
    const withdrawalCredentialsBytes = Buffer.from(
      data.withdrawal_credentials,
      "hex"
    );
    const amount = data.amount;
    const signatureBytes = Buffer.from(data.signature, "hex");

    const transactionParameters = {
      value: ethers.utils.parseEther(String(amount / 1e9)),
      gasLimit: process.env.GAS_LIMIT,
      gasPrice: ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei"),
    };

    const reconstructedKeyFile = {
      pubkey: pubkeyBytes,
      withdrawalCredentials: withdrawalCredentialsBytes,
      amount: amount,
      signature: signatureBytes,
    };

    try {
      const tx = await contract.deposit(
        reconstructedKeyFile.pubkey,
        reconstructedKeyFile.withdrawalCredentials,
        reconstructedKeyFile.signature,
        `0x${buf2hex(depositDataContainer.hashTreeRoot(reconstructedKeyFile))}`,
        transactionParameters
      );

      console.log("Transaction sent. Hash:", tx.hash);
      createLockFile(lockDir, pubkeyHex);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }
  }
}

async function main() {
  // Check if a file path argument is provided
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: node script.js <file_path>");
    process.exit(1);
  }

  const filePath = args[0];

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Process the specified file
  await processFile(filePath);
}

main();
