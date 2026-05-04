import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("MyToken deploy", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });
  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return DECIMALS", async () => {
      expect(await myTokenC.decimals()).equal(18);
    });
    it("should return 0 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });
  });

  // 1MT = 1 * 10^18
  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });

    // owner 가 최초 배포자 signer0이 Minting 하는 테스트 케이스 만들기
    it("should allow owner to mint tokens", async () => {
      const owner = signers[0];
      const mintingAmount = hre.ethers.parseUnits("100", DECIMALS);
      await expect(myTokenC.connect(owner).mint(mintingAmount, owner.address))
        .not.to.be.reverted;
    });

    // TDD: Test Driven Development
    it("should return or revert when minting infinitly", async () => {
      const hacker = signers[2];
      const mintingAgainAmount = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        myTokenC.connect(hacker).mint(mintingAgainAmount, hacker.address),
      ).to.be.revertedWith("You are not authorized to manage this token");
    });

    describe("Transfer", () => {
      it("should have 0.5MT", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];
        await expect(
          myTokenC.transfer(
            hre.ethers.parseUnits("0.5", DECIMALS),
            signer1.address,
          ),
        )
          .to.emit(myTokenC, "Transfer")
          .withArgs(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("0.5", DECIMALS),
          );

        expect(1)
          .to.emit(myTokenC, "Transfer")
          .withArgs(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("0.4", DECIMALS),
          );
        expect(await myTokenC.balanceOf(signer1.address)).equal(
          hre.ethers.parseUnits("0.5", DECIMALS),
        );

        const filter = myTokenC.filters.Transfer(signer0.address);
        const logs = await myTokenC.queryFilter(filter, 0, "latest");
      });

      it("should be reverted with insufficient balance error", async () => {
        const signer1 = signers[1];
        await expect(
          myTokenC.transfer(
            hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
            signer1.address,
          ),
        ).to.be.revertedWith("insufficient balance");
      });
    });
    describe("TransferFrom", () => {
      it("should emit Approval event", async () => {
        const signer1 = signers[1];
        await expect(
          myTokenC.approve(
            signer1.address,
            hre.ethers.parseUnits("10", DECIMALS),
          ),
        )
          .to.emit(myTokenC, "Approval")
          .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
      });

      it("should be reverted with insufficient allowance error", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];
        await expect(
          myTokenC
            .connect(signer1)
            .transferFrom(
              signer0.address,
              signer1.address,
              hre.ethers.parseUnits("1", DECIMALS),
            ),
        ).to.be.revertedWith("insufficient allowance");
      });
      it("should transfer tokens with transferFrom", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];
        const transferAmount = hre.ethers.parseUnits("10", DECIMALS);
        // approve
        await myTokenC.approve(signer1.address, transferAmount);
        // transferFrom
        await myTokenC
          .connect(signer1)
          .transferFrom(signer0.address, signer1.address, transferAmount);

        // check balance
        //signer1 balance
        expect(await myTokenC.balanceOf(signer1.address)).equal(transferAmount);

        //signer0 balance
        const expectedBalance =
          MINTING_AMOUNT * 10n ** DECIMALS - transferAmount;
        expect(await myTokenC.balanceOf(signer0.address)).equal(
          expectedBalance,
        );
      });
    });
  });
});
