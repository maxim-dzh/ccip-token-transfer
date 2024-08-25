import { join } from "path";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig, getDeploymentInfo } from "../helpers/utils";
import { Spinner } from "../helpers/spinner";
import { __deploymentsPath, USDC_ADDRESSES } from "../helpers/constants";
import { TransferUSDC, TransferUSDC__factory } from "../typechain-types";

task(
  `transfer-usdc`,
  `Call the transferUsdc function of the TransferUSDC smart contract`
)
  .addParam(
    `receiverNetwork`,
    `The network of your EOA that will receive your tokens`
  )
  .addParam(`receiver`, `Addres of your EOA`)
  .addParam(`amount`, `Amount in wei`)
  .addOptionalParam(
    `transferUsdc`,
    `The address of the TransferUSDC smart contract`
  )
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const networkName = hre.network.name
        ? hre.network.name
        : hre.config.defaultNetwork;
      const transferUSDCAddress = taskArguments.transferUsdc
        ? taskArguments.transferUsdc
        : getDeploymentInfo(networkName).transferUsdc;
      if (!transferUSDCAddress) {
        console.error(
          `❌ TransferUSDC address is undefined. Did you run the "npx hardhat deploy-transfer-usdc" command? Was the "${join(
            __deploymentsPath,
            `${networkName}.json`
          )}" file generated? Try to provide the address of a TransferUSDC smart contract via --transferUsdc flag.`
        );
        return 1;
      }
      const [signer] = await hre.ethers.getSigners();
      const transferUSDC: TransferUSDC = TransferUSDC__factory.connect(
        transferUSDCAddress,
        signer
      );
      const spinner: Spinner = new Spinner();
      const destinationChainSelector = getRouterConfig(
        taskArguments.receiverNetwork
      ).chainSelector;
      if (!destinationChainSelector) {
        console.error(`❌ destinationChainSelector is undefined`);
        return 1;
      }

      console.log(
        `ℹ️  Attempting to call the transferUsdc function on the TransferUSDC smart contract on the ${networkName} blockchain with amount ${taskArguments.amount}. We send to ${destinationChainSelector} ${taskArguments.receiver}`
      );
      spinner.start();

      const tx = await transferUSDC.transferUsdc(
        destinationChainSelector,
        taskArguments.receiver,
        taskArguments.amount,
        0
      );
      await tx.wait();

      spinner.stop();
      console.log(`✅ success: ${tx.hash}`);
    }
  );
