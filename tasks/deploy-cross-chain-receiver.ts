import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import {
  getPrivateKey,
  getProviderRpcUrl,
  getRouterConfig,
} from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import { Spinner } from "../helpers/spinner";
import { USDC_ADDRESSES, __deploymentsPath } from "../helpers/constants";
import {
  CrossChainReceiver,
  CrossChainReceiver__factory,
} from "../typechain-types";

task(
  `deploy-cross-chain-receiver`,
  `Deploys the CrossChainReceiver smart contract`
)
  .addOptionalParam(`router`, `router address`)
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const networkName = hre.network.name
        ? hre.network.name
        : hre.config.defaultNetwork;
      const routerAddress = taskArguments.router
        ? taskArguments.router
        : getRouterConfig(networkName).address;
      const usdcAddress = taskArguments.usdcToken
        ? taskArguments.usdcToken
        : USDC_ADDRESSES[networkName];

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(networkName);
      const provider = new JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);
      const deployer = wallet.connect(provider);
      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to deploy CrossChainReceiver on the ${networkName} blockchain using ${deployer.address} address.`
      );
      spinner.start();

      const crossChainReceiverFactory: CrossChainReceiver__factory =
        (await hre.ethers.getContractFactory(
          "CrossChainReceiver"
        )) as CrossChainReceiver__factory;
      const crossChainReceiver: CrossChainReceiver =
        await crossChainReceiverFactory.deploy(routerAddress);
      await crossChainReceiver.waitForDeployment();
      const crossChainReceiverAddress = await crossChainReceiver.getAddress();

      spinner.stop();
      console.log(
        `✅ CrossChainReceiver deployed at address ${crossChainReceiverAddress} on ${networkName} blockchain`
      );

      const filePath = join(
        __deploymentsPath,
        `${networkName}-CrossChainReceiver.json`
      );
      !existsSync(__deploymentsPath) && mkdirSync(__deploymentsPath);
      try {
        const data = {
          network: networkName,
          crossChainReceiver: crossChainReceiverAddress,
        };
        writeFileSync(filePath, JSON.stringify(data));
      } catch (error) {
        console.log(
          `ℹ️  Saving the CrossChainReceiver address to ${filePath} file failed, please save it manually from previous log, you will need it for further tasks`
        );
        console.error(`Error: ${error}`);
      }
    }
  );
