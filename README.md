# Ethereum Deposit Contract Interaction Script

## Overview
This Node.js script enables interaction with an Ethereum deposit contract. It is designed to facilitate transactions such as deposits, using environment variables for configuration and leveraging the Ethereum JavaScript API.

## Features
- Connect to Ethereum nodes via JSON-RPC.
- Perform deposit transactions to the specified contract address.
- Utilize environment variables for secure and flexible configuration.
- Log transaction details and confirmation.

## Requirements
- Node.js
- npm (Node Package Manager)
- An Ethereum node accessible via JSON-RPC
- A funded Ethereum wallet

## Installation
Before running the script, ensure Node.js and npm are installed on your system. Then, install the required packages using npm:

```bash
npm install
cp .env-example .env
```

### Configuration
Create a .env file in the root directory of the project, using .env-example as a template. Configure the following variables:

- PROVIDER_URL: URL of the Ethereum node
- PRIVATE_KEY: Private key of the Ethereum wallet
- CONTRACT_ADDRESS: Address of the Ethereum deposit contract

Optional variables for transaction configuration:

- DEPOSIT_VALUE: The value to deposit (in ETH)
- GAS_LIMIT: Gas limit for the transaction
- GAS_PRICE: Gas price in Gwei

Public key, withdrawal credentials, and signature:

- PUBKEY_HEX
- WITHDRAWAL_CREDENTIALS_HEX
- SIGNATURE_HEX

### Usage

After configuring the .env file, run the script with:

```bash
node send.js
```
The script will connect to the Ethereum network, interact with the contract, and log transaction details.

### Disclaimer
This script is provided for educational purposes. Always test thoroughly in a safe environment before using it in production.
Ensure that your private key and other sensitive details are kept secure.
### License
MIT

### Contributing
Contributions to the script are welcome. Please follow standard coding practices and submit pull requests for any enhancements.
