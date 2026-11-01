import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const receiptSchema = z.object({
  donorId: z.string().min(1),
  amountCents: z.number().int().positive(),
  campaign: z.string().min(1),
});

export type Receipt = z.infer<typeof receiptSchema>;

export function receiptEvent(receipt: Receipt) {
  const checked = receiptSchema.parse(receipt);
  return {
    message: "donor receipt issued",
    level: "info",
    context: { kind: "donor_receipt", ...checked },
    idempotency_key: `receipt:${checked.donorId}:${checked.campaign}:${checked.amountCents}`,
  };
}

export async function sendReceipt(receipt: Receipt, client = new InfraiClient()): Promise<unknown> {
  return client.ingest(receiptEvent(receipt));
}

