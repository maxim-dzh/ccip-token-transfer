import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import {
  TransferUSDC,
  TransferUSDC__factory,
  MockCCIPRouter,
  MockCCIPRouter__factory,
  BurnMintERC677,
  BurnMintERC677__factory,
  CrossChainReceiver,
  CrossChainReceiver__factory,
} from "../typechain-types";

describe("TransferUSDC", function () {
  async function deployFixture() {
    const chainSelector = "16015286601757825753";
    const [owner] = await ethers.getSigners();
    const routerFactory: MockCCIPRouter__factory =
      await ethers.getContractFactory("MockCCIPRouter");
    const burnMintERC677Factory: BurnMintERC677__factory =
      await ethers.getContractFactory("BurnMintERC677");
    const transferUsdcFactory: TransferUSDC__factory =
      await ethers.getContractFactory("TransferUSDC");
    const crossChainReceiverFactory: CrossChainReceiver__factory =
      await ethers.getContractFactory("CrossChainReceiver");
    const supply = BigInt(1e27);
    const router: MockCCIPRouter = await routerFactory.deploy();

    // init tokens
    const link: BurnMintERC677 = await burnMintERC677Factory.deploy(
      "ChainLink Token",
      "LINK",
      18,
      supply
    );
    await link.grantMintRole(owner);
    await link.mint(owner, supply);

    const usdc: BurnMintERC677 = await burnMintERC677Factory.deploy(
      "USD Coin",
      "USDC",
      18,
      supply
    );
    await usdc.grantMintRole(owner);
    await usdc.mint(owner, supply);

    const transferUsdc: TransferUSDC = await transferUsdcFactory.deploy(
      router,
      link,
      usdc
    );
    await transferUsdc.allowlistDestinationChain(chainSelector, true);

    const crossChainReceiver: CrossChainReceiver =
      await crossChainReceiverFactory.deploy(router);
    await crossChainReceiver.allowlistSourceChain(chainSelector, true);
    await crossChainReceiver.allowlistSender(transferUsdc.getAddress(), true);

    return { router, transferUsdc, crossChainReceiver, usdc, chainSelector };
  }

  it("detect actual gas amount", async function () {
    const { router, transferUsdc, crossChainReceiver, usdc, chainSelector } =
      await loadFixture(deployFixture);
    const gasLimit = 62810;
    const amount = 10000;

    await usdc.approve(transferUsdc.getAddress(), amount);
    await transferUsdc.transferUsdc(
      chainSelector,
      crossChainReceiver.getAddress(),
      amount,
      gasLimit
    );
    // retrieve gas used from the last message executed by querying the router's events.
    const mockRouterEvents = await router.queryFilter(
      router.filters.MsgExecuted
    );
    const mockRouterEvent = mockRouterEvents[mockRouterEvents.length - 1];
    const gasUsed = mockRouterEvent.args.gasUsed;

    console.log("Final Gas Usage Report:");
    console.log("Gas used: %d", gasUsed.toString());
  });
});
