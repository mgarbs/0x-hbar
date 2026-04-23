import {
  TransferTransaction,
  AccountId,
  Hbar,
  HbarUnit,
  TransactionId,
  Status,
} from "@hashgraph/sdk";
import type { HederaCtx } from "./client.js";

export interface FeeSplit {
  gross: bigint;
  userAmount: bigint;
  operatorFee: bigint;
  hollowCost: bigint;
  networkBudget: bigint;
  destinationIsHollow: boolean;
  belowMinimum: boolean;
  minGross: bigint;
}

export interface SplitConfig {
  operatorFeeBps: number;
  hollowCreateTinybars: bigint;
  networkFeeBudgetTinybars: bigint;
  destinationIsHollow: boolean;
}

export function computeSplit(gross: bigint, cfg: SplitConfig): FeeSplit {
  const feeBps = BigInt(cfg.operatorFeeBps);
  const hollowCost = cfg.destinationIsHollow ? cfg.hollowCreateTinybars : 0n;
  const network = cfg.networkFeeBudgetTinybars;

  // minimum gross so user_amount >= 1 tinybar after 2% fee + hollow + network budget
  // user = gross*(10000-fee)/10000 - hollow - network
  // solve for gross when user = 1: gross = (1 + hollow + network) * 10000 / (10000 - fee)
  const ceilDiv = (n: bigint, d: bigint) => (n + d - 1n) / d;
  const minGross = ceilDiv((1n + hollowCost + network) * 10000n, 10000n - feeBps);

  const belowMinimum = gross < minGross;
  if (belowMinimum) {
    return {
      gross,
      userAmount: 0n,
      operatorFee: 0n,
      hollowCost,
      networkBudget: network,
      destinationIsHollow: cfg.destinationIsHollow,
      belowMinimum: true,
      minGross,
    };
  }

  const operatorFee = (gross * feeBps) / 10000n;
  const userAmount = gross - operatorFee - hollowCost - network;

  return {
    gross,
    userAmount,
    operatorFee,
    hollowCost,
    networkBudget: network,
    destinationIsHollow: cfg.destinationIsHollow,
    belowMinimum: false,
    minGross,
  };
}

export async function submitForward(params: {
  ctx: HederaCtx;
  split: FeeSplit;
  destinationEvm: string;
  memo: string;
}): Promise<{ transactionId: string; status: string }> {
  const { ctx, split, destinationEvm, memo } = params;
  if (split.belowMinimum) {
    throw new Error("cannot forward: below minimum");
  }

  const dest = AccountId.fromEvmAddress(0, 0, stripHex(destinationEvm));
  const treasuryCredit = split.operatorFee + split.hollowCost;

  const txId = TransactionId.generate(ctx.operatorId);

  const tx = new TransferTransaction()
    .setTransactionId(txId)
    .addHbarTransfer(
      ctx.operatorId,
      Hbar.from(-Number(split.userAmount + treasuryCredit), HbarUnit.Tinybar)
    )
    .addHbarTransfer(dest, Hbar.from(Number(split.userAmount), HbarUnit.Tinybar))
    .addHbarTransfer(ctx.treasuryId, Hbar.from(Number(treasuryCredit), HbarUnit.Tinybar))
    .setTransactionMemo(memo.slice(0, 100))
    .freezeWith(ctx.client);

  const signed = await tx.sign(ctx.operatorKey);
  const resp = await signed.execute(ctx.client);
  const receipt = await resp.getReceipt(ctx.client);

  if (receipt.status !== Status.Success) {
    throw new Error(`forward status=${receipt.status.toString()}`);
  }

  return {
    transactionId: txId.toString(),
    status: receipt.status.toString(),
  };
}

export async function submitTreasurySweep(params: {
  ctx: HederaCtx;
  amountTinybars: bigint;
  memo: string;
}): Promise<{ transactionId: string; status: string }> {
  const { ctx, amountTinybars, memo } = params;
  const txId = TransactionId.generate(ctx.operatorId);
  const tx = new TransferTransaction()
    .setTransactionId(txId)
    .addHbarTransfer(ctx.operatorId, Hbar.from(-Number(amountTinybars), HbarUnit.Tinybar))
    .addHbarTransfer(ctx.treasuryId, Hbar.from(Number(amountTinybars), HbarUnit.Tinybar))
    .setTransactionMemo(memo.slice(0, 100))
    .freezeWith(ctx.client);
  const signed = await tx.sign(ctx.operatorKey);
  const resp = await signed.execute(ctx.client);
  const receipt = await resp.getReceipt(ctx.client);
  if (receipt.status !== Status.Success) {
    throw new Error(`sweep status=${receipt.status.toString()}`);
  }
  return { transactionId: txId.toString(), status: receipt.status.toString() };
}

function stripHex(s: string): string {
  return s.startsWith("0x") ? s.slice(2) : s;
}
