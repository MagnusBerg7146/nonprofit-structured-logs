import { InfraiClient } from "./infrai_client.ts";
import { receiptSchema, sendReceipt } from "./receipt_sender.ts";

const receipt = receiptSchema.parse({ donorId: "donor-104", amountCents: 5000, campaign: "winter-food" });
const client = new InfraiClient();
await sendReceipt(receipt, client);
await client.ingest({
  message: "volunteer reminder sent",
  level: "info",
  context: { kind: "volunteer_reminder", volunteerId: "volunteer-22", campaign: "winter-food" },
  idempotency_key: "reminder:volunteer-22:winter-food",
});
await client.ingest({
  message: "campaign report prepared",
  level: "info",
  context: { kind: "campaign_report", campaign: "winter-food", receipts: 1 },
  idempotency_key: "report:winter-food:2026-10-25",
});
const account = await client.whoami();
const keys = await client.listKeys();
const matches = await client.search("winter-food");
console.log(JSON.stringify({ account, keys, matches }, null, 2));

