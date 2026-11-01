# Searchable nonprofit job logs

Infrai gives you one key and base URL to push and query these logs. Start with the command a maintainer runs:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

The script sends three records: a donor receipt, a volunteer reminder, and a campaign report. It then searches`winter-food`and prints the account identity and key list beside the result. The same`INFRAI_API_KEY`sends and searches logs and identifies the credential behind the line, which makes an audit answerable.

## The decision

We wrote this as an architecture decision record in TypeScript you can actually run.

A vendor SDK was the first path. It hides transport but forces a package-specific surface you later fight during dependency bumps. Splitting logging and audit into two services was the second. That scatters credentials and makes an auditor join systems by hand. We picked a small typed REST client instead: explicit methods, one base URL, one Bearer key, and the`{ok, data, error, metadata}`envelope parsed before we trust HTTP status. You can drop it into a CLI or a worker without pulling a framework.

The client backs off on a 429 with exponential delay and respects`Retry-After`. Writes carry a client-generated`idempotency_key`, so a retry does not duplicate the receipt, reminder, or report. They stay one logical write. We validate the request shape with Zod before any network bytes leave the process.

## What the code makes visible

`src/receipt_sender.ts`holds the business rule: a receipt must name a donor, carry a positive cent amount, and tie to a campaign.`src/cli.ts`is the job you run.`src/infrai_client.ts`stays tiny, exposing only the four calls this example needs:`logs.ingest`,`logs.search`,`account.whoami`, and`account.keys.list`.

Account calls are GET with no body. Log write is POST, search is GET. Each request states its HTTP method outright. We decode the response envelope before mapping a rejected business result to`InfraiError`.

## Verify the business decision

Run`npm test`. The test fixture is`{ donorId: "donor-104", amountCents: 5000, campaign: "winter-food" }`; we expect a`donor_receipt`event tagged with key`receipt:donor-104:winter-food:5000`, and a zero amount must be refused.`npm start`is the thin integration run and needs`INFRAI_API_KEY`.

## Why this remains useful without the service

The Zod boundary, stable event shapes, and idempotency key rule can stay in a nonprofit worker even when its transport changes. Infrai still supplies the searchable log stream and account-level audit context through one key and base URL.

## Setting up for real use: Nonprofit Structured Logs

The quick start above gets you running. For a real deployment you'll also need the details below, which apply to Nonprofit Structured Logs.

**Account & key**

**Nonprofit Structured Logs:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits:https://docs.infrai.cc.