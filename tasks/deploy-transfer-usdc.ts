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
import {
  LINK_ADDRESSES,
  USDC_ADDRESSES,
  __deploymentsPath,
} from "../helpers/constants";
import { TransferUSDC, TransferUSDC__factory } from "../typechain-types";

task(`deploy-transfer-usdc`, `Deploys the TransferUSDC smart contract`)
  .addOptionalParam(`router`, `The address of the Router contract`)
  .addOptionalParam(`link`, `The address of the LINK token`)
  .addOptionalParam(`usdc`, `The address of the USDC token`)
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const networkName = hre.network.name
        ? hre.network.name
        : hre.config.defaultNetwork;
      const routerAddress = taskArguments.router
        ? taskArguments.router
        : getRouterConfig(networkName).address;
      const linkAddress = taskArguments.link
        ? taskArguments.link
        : LINK_ADDRESSES[networkName];
      const usdcAddress = taskArguments.usdc
        ? taskArguments.usdc
        : USDC_ADDRESSES[networkName];

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(networkName);
      const provider = new JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);
      const deployer = wallet.connect(provider);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to deploy TransferUSDC on the ${networkName} blockchain using ${deployer.address} address, with the Router address ${routerAddress}, LINK address ${linkAddress} and USDC address ${usdcAddress} provided as constructor arguments`
      );
      spinner.start();

      const transferUSDCFactory: TransferUSDC__factory =
        (await hre.ethers.getContractFactory(
          "TransferUSDC"
        )) as TransferUSDC__factory;
      const transferUSDC: TransferUSDC = await transferUSDCFactory.deploy(
        routerAddress,
        linkAddress,
        usdcAddress
      );
      await transferUSDC.waitForDeployment();
      const transferUSDCAddress = await transferUSDC.getAddress();

      spinner.stop();
      console.log(
        `✅ TransferUSDC deployed at address ${transferUSDCAddress} on ${networkName} blockchain`
      );

      const filePath = join(__deploymentsPath, `${networkName}.json`);
      !existsSync(__deploymentsPath) && mkdirSync(__deploymentsPath);
      try {
        const data = {
          network: networkName,
          transferUsdc: transferUSDCAddress,
        };
        writeFileSync(filePath, JSON.stringify(data));
      } catch (error) {
        console.log(
          `ℹ️  Saving the TransferUSDC address to ${filePath} file failed, please save it manually from previous log, you will need it for further tasks`
        );
        console.error(`Error: ${error}`);
      }
    }
  );
