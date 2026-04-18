#!/usr/bin/env node
/**
 * Compile ETHSecTestBadge.sol, deploy to Sepolia, mint tokenId #1 to a
 * recipient address. Prints the contract address.
 *
 * Usage: node deploy-test-badge.mjs <recipient>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const recipient = process.argv[2];
if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
  console.error("Usage: node deploy-test-badge.mjs <0x...>");
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

// Deployer key — prefer env var, fall back to a wallet JSON file path.
// Neither file nor env should ever be committed.
const rawKey = process.env.DEPLOYER_PRIVATE_KEY;
const walletFile = process.env.DEPLOYER_WALLET_JSON;
let privateKey;
if (rawKey) {
  privateKey = rawKey.startsWith("0x") ? rawKey : "0x" + rawKey;
} else if (walletFile) {
  const j = JSON.parse(fs.readFileSync(walletFile, "utf8"));
  privateKey = j.privateKey.startsWith("0x") ? j.privateKey : "0x" + j.privateKey;
} else {
  console.error("Set either DEPLOYER_PRIVATE_KEY or DEPLOYER_WALLET_JSON (path to {privateKey} JSON).");
  process.exit(1);
}

// --- 1. Compile with solc --------------------------------------------------

function findImport(importPath) {
  const candidates = [
    path.resolve(__dirname, "node_modules", importPath),
    path.resolve(__dirname, "../node_modules", importPath),
    path.resolve(__dirname, "../../node_modules", importPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return { contents: fs.readFileSync(c, "utf8") };
    }
  }
  return { error: `File not found: ${importPath}` };
}

const contractPath = path.resolve(__dirname, "contracts/ETHSecTestBadge.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: { "ETHSecTestBadge.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

console.log("▸ Compiling ETHSecTestBadge.sol …");
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length) {
  console.error("Compilation errors:");
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}

const artifact = output.contracts["ETHSecTestBadge.sol"]["ETHSecTestBadge"];
const abi = artifact.abi;
const bytecode = "0x" + artifact.evm.bytecode.object;
console.log(`  ✔ bytecode size: ${(bytecode.length / 2 - 1)} bytes`);

// --- 2. Deploy -------------------------------------------------------------

const account = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

const bal = await publicClient.getBalance({ address: account.address });
console.log(`▸ Deployer: ${account.address}  balance: ${Number(bal) / 1e18} ETH`);
if (bal < parseEther("0.01")) {
  console.error("Balance too low (need ~0.01 Sepolia ETH). Fund the wallet and retry.");
  process.exit(1);
}

console.log("▸ Deploying ETHSecTestBadge(initialOwner=deployer) …");
const deployTx = await walletClient.deployContract({
  abi,
  bytecode,
  args: [account.address],
});
console.log(`  tx: ${deployTx}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash: deployTx });
if (!receipt.contractAddress) {
  console.error("Deploy receipt missing contractAddress:", receipt);
  process.exit(1);
}
const contractAddress = receipt.contractAddress;
console.log(`  ✔ deployed at: ${contractAddress}`);

// --- 3. Mint tokenId #1 to recipient --------------------------------------

console.log(`▸ Minting tokenId #1 to ${recipient} …`);
const mintTx = await walletClient.writeContract({
  address: contractAddress,
  abi,
  functionName: "safeMint",
  args: [recipient],
});
console.log(`  tx: ${mintTx}`);

const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
console.log(`  ✔ minted. block: ${mintReceipt.blockNumber}`);

// --- 4. Verify ownership --------------------------------------------------

const owner = await publicClient.readContract({
  address: contractAddress,
  abi,
  functionName: "ownerOf",
  args: [1n],
});
console.log(`▸ ownerOf(1) = ${owner}`);
if (owner.toLowerCase() !== recipient.toLowerCase()) {
  console.error("Owner mismatch! expected", recipient, "got", owner);
  process.exit(1);
}

console.log("");
console.log("=== SUCCESS ===");
console.log(`CONTRACT: ${contractAddress}`);
console.log(`CHAIN_ID: 11155111 (Sepolia)`);
console.log(`OWNER:    ${recipient} holds tokenId #1`);
console.log(`EXPLORER: https://sepolia.etherscan.io/address/${contractAddress}`);
