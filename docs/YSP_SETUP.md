# YSP Open Higgsfield Studio setup

## What this fork is

A self-hostable creative studio fork of Autom8AI/Open-Higgsfield-AI. Its current clients use **KIE AI**, not the official Higgsfield API or Muapi. The inherited upstream README below the YSP notice is historical documentation and does not describe this fork accurately. Provider generation can incur charges; open source does not mean free inference. Prompts and reference files are sent to the selected provider.

## Start the studio

Use Node 22 or a supported newer release, then:

```sh
npm ci
npm run vite:dev
```

The Vite studio is the primary interface in this fork. Open the local URL printed by Vite, select API key connection, and enter a key from https://kie.ai/api-key. The Next interface can also be started with `npm run dev`.

The standalone browser app keeps the user's KIE key in browser storage. Use it only on a device/profile you control. Do not insert an organization-wide key into bundled frontend code. The inherited Netlify factory backend requires separate setup; it is not configured for YSP. The author's hosted development proxy has been removed.

## Automation

A separate manual n8n workflow named **YSP Open Higgsfield - Image to Drive** has been created in the YSP Marketing personal project. It is inactive and awaits credentials.

1. Connect Google Drive inside n8n and choose that credential on the upload node. ChatGPT/Composio Drive access does not transfer to n8n.
2. Configure both KIE HTTP nodes with the same KIE credential. For an existing HTTP Header Auth credential, use header `Authorization` and value `Bearer YOUR_KEY`; select generic auth type `httpHeaderAuth`. For a new templated credential, use the authorization header template below and enter the key only in the credential UI.
3. In Job settings enter the prompt. The first workflow supports `nano-banana-2`, square PNG output at 1K. Verify the current provider schema before extending model support.
4. Manually execute one intended image job. The workflow submits once, records the task ID, polls, downloads all outputs, and uploads the actual files to the studio's private Drive folder.
5. Verify both the generated image and the uploaded Drive file before treating the workflow as live-tested.

Credential template (not a secret):

```json
{"headers":{"Authorization":"Bearer {{api_key}}"}}
```

UI generations and workflow generations are separate entry points. The workflow does not automatically receive every browser generation. Composio is available for account/tool orchestration; it is not a required intermediary for each generation or Drive upload.

## Recover without another charge

Set `resumeTaskId` in Job settings to an existing task ID. This skips submission. Do not repeat a POST after a timeout until provider logs confirm whether a task was created. Polling is bounded to 16 iterations at 15 seconds and the n8n account's 300-second execution maximum. A slow provider read may hit the execution limit earlier; recover using the retained task ID. Resume does not cancel provider work. Check Drive for the task-based filename before archiving again; this initial workflow does not deduplicate repeated archive attempts.

## Repairs and evidence

- Corrected the Next key-entry screen to identify KIE.
- Parsed serialized `resultJson` and exposed consistent output URLs in both app clients.
- Stopped polling immediately on terminal job/authentication errors; retained bounded retries for transient reads.
- Corrected the standalone upload service endpoint.
- Removed development proxies to the original author's Netlify backend and enabled TLS verification.
- Excluded Next build output and environment secrets from version control.

Validation completed: seven mock tests and both Vite and Next production builds. Run:

```sh
node --test tests/kie-jobs.test.mjs
npm run vite:build
npm run build
```

Not completed: provider credential test, paid end-to-end generation, n8n-to-Drive upload, browser interaction QA, and hosting deployment. This is a tested setup foundation, not a production readiness claim. The broad inherited model catalog and optional factory backend have not been audited end to end.

## Deployment choices

For the standalone Vite app, deploy the `dist` output from `npm run vite:build` to a static host under your account. Users must provide their own KIE key. Do not enable the optional factory backend without configuring and reviewing its authentication, database, and server secrets. For Next, use a Node-compatible host with `npm run build` and `npm run start`. Hosting selection and provider credentials remain setup steps.

## References

- https://docs.kie.ai/getting-started
- https://docs.kie.ai/market/common/get-task-detail
- https://docs.kie.ai/file-upload-api/quickstart
