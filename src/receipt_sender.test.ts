import assert from "node:assert/strict";
import test from "node:test";
import { receiptEvent, receiptSchema } from "./receipt_sender.ts";

test("a receipt is accepted only when its amount and campaign are present", () => {
  const event = receiptEvent({ donorId: "donor-104", amountCents: 5000, campaign: "winter-food" });
  assert.equal(event.context.kind, "donor_receipt");
  assert.equal(event.idempotency_key, "receipt:donor-104:winter-food:5000");
  assert.throws(() => receiptSchema.parse({ donorId: "donor-104", amountCents: 0, campaign: "winter-food" }));
});

