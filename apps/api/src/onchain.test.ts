import { describe, it, expect } from "vitest";
import type { Address } from "viem";
import { makeOwnershipChecker, type MinimalPublicClient } from "./onchain.js";

const CONTRACT = ("0x" + "b".repeat(40)) as Address;
const OWNER = ("0x" + "a".repeat(40)) as Address;
const OTHER = ("0x" + "c".repeat(40)) as Address;

function mockClient(handlers: {
  ownerOf?: (tokenId: bigint) => Address | Promise<Address>;
  balanceOf?: (wallet: Address) => bigint | Promise<bigint>;
  ownerOfThrows?: boolean;
  balanceOfThrows?: boolean;
}): MinimalPublicClient {
  return {
    readContract: async (args) => {
      if (args.functionName === "ownerOf") {
        if (handlers.ownerOfThrows) throw new Error("ownerOf revert");
        return handlers.ownerOf!(args.args[0] as bigint);
      }
      if (args.functionName === "balanceOf") {
        if (handlers.balanceOfThrows) throw new Error("balanceOf revert");
        return handlers.balanceOf!(args.args[0] as Address);
      }
      throw new Error(`unexpected fn: ${args.functionName as string}`);
    },
  };
}

describe("makeOwnershipChecker", () => {
  it("ownsThisToken=true when ownerOf == wallet (case-insensitive) and balance is reported", async () => {
    const checker = makeOwnershipChecker(
      mockClient({
        ownerOf: () => OWNER.toUpperCase() as Address,
        balanceOf: () => 1n,
      }),
      CONTRACT,
    );
    const r = await checker.check(42n, OWNER);
    expect(r.ownsThisToken).toBe(true);
    expect(r.balance).toBe(1n);
  });

  it("ownsThisToken=false when ownerOf != wallet", async () => {
    const checker = makeOwnershipChecker(
      mockClient({ ownerOf: () => OTHER, balanceOf: () => 1n }),
      CONTRACT,
    );
    const r = await checker.check(42n, OWNER);
    expect(r.ownsThisToken).toBe(false);
    expect(r.balance).toBe(1n);
  });

  it("ownsThisToken=false when ownerOf reverts (e.g. tokenId nonexistent)", async () => {
    const checker = makeOwnershipChecker(
      mockClient({ ownerOfThrows: true, balanceOf: () => 0n }),
      CONTRACT,
    );
    const r = await checker.check(42n, OWNER);
    expect(r.ownsThisToken).toBe(false);
    expect(r.balance).toBe(0n);
  });

  it("balance=0n when balanceOf reverts", async () => {
    const checker = makeOwnershipChecker(
      mockClient({ ownerOf: () => OWNER, balanceOfThrows: true }),
      CONTRACT,
    );
    const r = await checker.check(42n, OWNER);
    expect(r.ownsThisToken).toBe(true);
    expect(r.balance).toBe(0n);
  });
});

// Will be enabled in Phase 8 once a real ERC-721 (TestBadge) is deployed to Sepolia.
describe.skip("onchain ownership (sepolia integration)", () => {
  it("verifies against deployed Sepolia TestBadge", async () => {
    /* wired in Phase 8 task 8.2 */
  });
});
