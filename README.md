## CCIP-token-transfer

> **Note**
>
> This repository represents an example of using a Chainlink CCIP protocol to send USDC token between two chains
> with gasLimit calculation via test and hardhat MockCCIPRouter.

## Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Current LTS Node.js version](https://nodejs.org/en/about/releases/)

Verify installation by typing:

```shell
node -v
```

and

```shell
npm -v
```

## Getting Started

1. Clone the repository

```
git clone https://github.com/maxim-dzh/ccip-token-transfer.git
cd ccip-token-transfer
```

2. Install packages

```
npm install
```

3. Compile contracts

```
npx hardhat compile
```

4. To check how it works run

```bash
npx hardhat test --network hardhat
```
