# Web3 Smart Contract Workshop

## Prerequisites

### Setup your working directory

-   Install [Node.js](https://nodejs.org/en/) (Current version)
-   Install [VS Code](https://code.visualstudio.com/Download) + [VS Code Ride extension](https://marketplace.visualstudio.com/items?itemName=wavesplatform.waves-ride)
-   Clone this repository locally and open it in your editor

Open a terminal and enter the following command:

```sh
npm install
```

### Virtualizing a private blockchain using Docker

-   Install [Docker Desktop](https://hub.docker.com/search?q=Docker%20Desktop&type=edition&offering=community)
-   Start Docker (Give it some time, after 30 seconds it should be fully booted up)

Open a terminal and enter the following command:

```sh
./start-local-network.sh
```

If you can't execute the shell script (Should work on all UNIX systems), [open it](./start-local-network.sh) open it and enter the commands manually.
Wait for 30 seconds, then open [http://localhost:3000](http://localhost:3000). You should now see a local version of the Waves block explorer.

_You could omit this step and use the testnet blockchain, i will update this guide when I find the time_

## Running & testing the smart contracts

All configuration for surfboard can be found in [surfboard.config.json](./surfboard.config.json).
Here you can define seeds for multiple environments (private, testnet, mainnet).

_Be sure to never commit a mainnet seed with funds on it!_

All `Ride` contracts can be found in the [ride](./ride) folder.
The corresponding [MochaJS](https://mochajs.org) tests can be found in the [test](./test) folder.

### Notepad

This smart contract enables users to store a personal note in the account state.

#### Corresponding files

-   [Contract](./ride/notepad.ride)
-   [Test](./test/notepad.js)

#### Running the test

```sh
npm run notepad
```

### Family wallet

This contract allows multiple users to deposit and withdraw \$WAVES.
It uses account state to track fund allocation for each user and allows/denies withdrawals according to it.

#### Corresponding files

-   [Contract](./ride/familyWallet.ride)
-   [Test](./test/familyWallet.js)

#### Running the test

```sh
npm run familyWallet
```

### Multisig wallet

Implementation of a 2-of-3 multi signature wallet.

#### Corresponding files

-   [Contract](./ride/multiSig.ride)
-   [Test](./test/multiSig.js)

#### Running the test

```sh
npm run multiSig
```

### Hackme contract

This contract demonstrates a security vulnerability in @Verifier from the family wallet contract. A hacker exploits it and overwrites the contract.
The blackHat contract allows him to transfer all funds out of it.

#### Corresponding files

-   [Vulnerable contract](./ride/hackMe.ride)
-   [BlackHat contract](./ride/blackHat.ride)
-   [Test](./test/hackMe.js)

#### Running the test

```sh
npm run hackMe
```

## Running the REPL

Open a terminal and enter the following command:

```sh
npm run repl
```
