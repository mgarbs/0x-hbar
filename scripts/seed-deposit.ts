import "dotenv/config";
import { parseArgs } from "node:util";
import {
  Client,
  AccountCreateTransaction,
  AccountId,
  Hbar,
  HbarUnit,
  PrivateKey,
  TransferTransaction,
  Status,
} from "@hashgraph/sdk";

const args = parseArgs({
  options: {
    amount: { type: "string", default: "2" },
    memo: { type: "string", default: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
    fund: { type: "string", default: "3" },
  },
}).values;

const OPERATOR_ID = required("OPERATOR_ACCOUNT_ID");
const OPERATOR_KEY = required("OPERATOR_PRIVATE_KEY");
const amountHbar = Number(args.amount);
const fundHbar = Number(args.fund);
const memo = String(args.memo);

if (!Number.isFinite(amountHbar) || amountHbar <= 0) {
  console.error("invalid --amount");
  process.exit(1);
}
if (fundHbar < amountHbar) {
  console.error("--fund must be >= --amount (plus enough for fees)");
  process.exit(1);
}

function required(k: string): string {
  const v = process.env[k];
  if (!v) { console.error(`missing env ${k}`); process.exit(1); }
  return v;
}

function parseKey(raw: string): PrivateKey {
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) return PrivateKey.fromStringECDSA(hex);
  return PrivateKey.fromString(raw);
}

const client = Client.forTestnet();
const operatorId = AccountId.fromString(OPERATOR_ID);
const operatorKey = parseKey(OPERATOR_KEY);
client.setOperator(operatorId, operatorKey);

console.log(`→ creating throwaway testnet sender account (fund ${fundHbar} ℏ)`);

const newKey = PrivateKey.generateECDSA();
const create = await new AccountCreateTransaction()
  .setKey(newKey.publicKey)
  .setInitialBalance(Hbar.from(fundHbar))
  .execute(client);
const createReceipt = await create.getReceipt(client);
const senderId = createReceipt.accountId!;
console.log(`  sender account id: ${senderId.toString()}`);

// Use senderKey-signed transfer so it pays the fees (like an exchange withdrawal).
client.setOperator(senderId, newKey);

console.log(`→ sending ${amountHbar} ℏ from ${senderId.toString()} to ${operatorId.toString()} with memo "${memo}"`);

const tx = await new TransferTransaction()
  .addHbarTransfer(senderId, Hbar.from(-amountHbar))
  .addHbarTransfer(operatorId, Hbar.from(amountHbar))
  .setTransactionMemo(memo.slice(0, 100))
  .execute(client);

const receipt = await tx.getReceipt(client);
if (receipt.status !== Status.Success) {
  console.error(`✗ transfer failed: ${receipt.status.toString()}`);
  process.exit(2);
}

const record = await tx.getRecord(client);
console.log(`✓ transfer tx id: ${record.transactionId.toString()}`);
console.log(`  consensus: ${record.consensusTimestamp?.toString() ?? "?"}`);
console.log(`  hashscan: https://hashscan.io/testnet/transaction/${encodeURIComponent(record.transactionId.toString())}`);
console.log("");
console.log("Detector should pick this up within ~1s. Watch the explorer at http://localhost:3000.");

client.close();
