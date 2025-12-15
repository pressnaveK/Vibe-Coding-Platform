## Vibe Coding Platform — Trigger.dev + E2B

This fork replaces the Vercel Sandbox runtime with Trigger.dev workflows on top of E2B sandboxes. The UI is the same: create a sandbox, generate files, run commands with live logs, and fetch preview URLs.

### Prerequisites
- Node.js 22.x
- Keys/accounts:
  - `TRIGGER_SECRET_KEY` (Trigger.dev → Project → API Keys → Secret key)
  - `TRIGGER_API_KEY` (locally set this to the same as `TRIGGER_SECRET_KEY`)
  - `TRIGGER_PROJECT_ID` (Trigger.dev → Project settings)
  - `E2B_API_KEY` (https://e2b.dev dashboard → Keys)
  - Model access: either `OPENAI_API_KEY` 

### Setup (A → Z)
1) Install deps  
```bash
npm install
```

2) Create `.env.local` in the repo root  
```bash
TRIGGER_SECRET_KEY=tr_dev_...
TRIGGER_API_KEY=$TRIGGER_SECRET_KEY   # reuse the secret locally
TRIGGER_PROJECT_ID=proj_...
E2B_API_KEY=e2b_...
OPENAI_API_KEY=sk_...                 
```

3) Start Trigger.dev worker (keep it running)  
```bash
npx trigger.dev dev
# optional: silence the warning
# npx trigger.dev dev --localstorage-file .trigger.dev/localstorage.json 
```

4) Start the web app  
```bash
npm run dev
# open http://localhost:3000
```

5) Use the UI  
- Create sandbox → should succeed if keys are set.  
- Run commands; logs stream via Trigger.dev.  
- File explorer reads from E2B; preview URLs use `Sandbox.getHost(port)`.

### How it works
- `trigger/e2b-tasks.ts`: Trigger.dev tasks for sandbox creation and command execution.
- `lib/execution/trigger-e2b.ts`: helper wrappers calling `tasks.trigger`, `runs.poll`, `streams.read`.
- `/api/sandboxes/*`: status, file reads, command status, and log streaming via Trigger.dev/E2B.

### Notes
- If you see “Trigger secret missing”, recheck `TRIGGER_SECRET_KEY`/`TRIGGER_API_KEY` and restart both dev processes.
- The nuqs `localStorage` warning is benign on the server; ignore it.
- Turbopack may warn about multiple lockfiles; harmless locally.
- `reasoningEffort` warnings with `gpt-4o-mini` are safe to ignore.
