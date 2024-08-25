import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getDeploymentInfo } from "../helpers/utils";
import { Spinner } from "../helpers/spinner";
import { __deploymentsPath } from "../helpers/constants";
import {
  CrossChainReceiver,
  CrossChainReceiver__factory,
} from "../typechain-types";

task(
  `prepare-cross-chain-receiver`,
  `Prepare the CrossChainReceiver smart contract`
)
  .addParam(`sourceChainSelector`, `chain selector to allow`)
  .addParam(`sender`, `address of TransferUSDC smart contract`)
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const networkName = hre.network.name
        ? hre.network.name
        : hre.config.defaultNetwork;
      const crossChainReceiverAddress = getDeploymentInfo(
        `${networkName}-CrossChainReceiver`
      ).crossChainReceiver;
      if (!crossChainReceiverAddress) {
        console.error(`❌ CrossChainReceiverAddress address is undefined`);
        return 1;
      }
      const [signer] = await hre.ethers.getSigners();
      const crossChainReceiver: CrossChainReceiver =
        CrossChainReceiver__factory.connect(crossChainReceiverAddress, signer);
      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to call the allowlistSourceChain function on the CrossChainReceiver smart contract on the ${networkName}}`
      );
      spinner.start();
      const tx = await crossChainReceiver.allowlistSourceChain(
        taskArguments.sourceChainSelector,
        true
      );
      await tx.wait();

      spinner.stop();
      console.log(
        `✅ now the source chain ${taskArguments.sourceChainSelector} is allowed, transaction hash: ${tx.hash}`
      );

      console.log(
        `ℹ️  Attempting to call the allowlistSender function on the CrossChainReceiver smart contract on the ${networkName}}`
      );
      spinner.start();
      const allowSenderTx = await crossChainReceiver.allowlistSender(
        taskArguments.sender,
        true
      );
      await allowSenderTx.wait();

      spinner.stop();
      console.log(
        `✅ now the sender ${taskArguments.sender} is allowed, transaction hash: ${allowSenderTx.hash}`
      );
    }
  );
