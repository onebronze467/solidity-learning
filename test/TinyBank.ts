import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let managers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    managers = [signers[0], signers[1], signers[2]];

    const managerAddresses = managers.map((m) => m.address);

    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
      managerAddresses,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managerAddresses,
    ]);

    const setManagerSelector =
      myTokenC.interface.getFunction("setManager").selector;
    const setManagerActionId = setManagerSelector.padEnd(66, "0");

    for (const manager of managers) {
      await myTokenC.connect(manager).confirmAction(setManagerActionId);
    }

    await myTokenC.setManager(await tinyBankC.getAddress());
  });

  describe("Initialize state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);
      expect(await myTokenC.balanceOf(signer0)).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });
  describe("withdraw", () => {
    it("should return 0 staked after withdrawing total token:", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT every blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()),
      );
    });
    it("should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[3];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });
  });

  describe("Access Control (ManagedAccess)", () => {
    let nonManager: HardhatEthersSigner;
    let actionId: string;

    beforeEach(async () => {
      nonManager = signers[3];
      const selector =
        tinyBankC.interface.getFunction("setRewardPerBlock").selector;
      actionId = selector.padEnd(66, "0");
    });

    it("should revert with 'You are not a manager' when a non-manager calls confirmAction", async () => {
      await expect(
        tinyBankC.connect(nonManager).confirmAction(actionId),
      ).to.be.revertedWith("You are not a manager");
    });

    it("should revert with 'Not all confirmed yet' when not all managers have confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("2", DECIMALS);
      await tinyBankC.connect(managers[0]).confirmAction(actionId);
      await tinyBankC.connect(managers[1]).confirmAction(actionId);
      await expect(
        tinyBankC.setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("should allow setRewardPerBlock after all managers confirm", async () => {
      const rewardToChange = hre.ethers.parseUnits("2", DECIMALS);
      await tinyBankC.connect(managers[0]).confirmAction(actionId);
      await tinyBankC.connect(managers[1]).confirmAction(actionId);
      await tinyBankC.connect(managers[2]).confirmAction(actionId);
      await expect(tinyBankC.setRewardPerBlock(rewardToChange)).to.not.be
        .reverted;
    });
  });
});
