# AGENTS.md — TrackMaster Comparator

## Scope

This file applies to this repository:

```txt
C:\Users\bryan\aibry\projects\TrackMaster-Comparator
```

If this file conflicts with a parent `AGENTS.md`, follow this repo-level file for repo-specific work and the parent file for broad AIBRY operating policy.

## AIBRY Host Split

AIBRY uses a split-host model:

```txt
Fedora = infrastructure/control-plane host
Windows = app/runtime/operator host
```

Fedora owns infrastructure/control-plane concerns such as Postgres, durable storage, Cloudflare ingress, admin-proxy, aibry-admin, node-agent, systemd/Podman/Docker infrastructure, backups, rollback artifacts, and Fedora worker services.

Windows owns PM2-managed app runtimes, migrated app/API/UI processes where applicable, Garage Admin V2, and the Windows runtime worker.

Do not blur Fedora and Windows responsibilities.

## Secrets Policy

Never expose, log, commit, render, or pass to the frontend:

- `.env`
- `.env.*`
- API keys
- database passwords
- Cloudflare Access credentials
- AIBRY auth tokens
- worker auth tokens
- OAuth access tokens
- OAuth refresh tokens
- private keys/certificates
- service account JSON
- raw PM2 environment dumps

Do not ask the operator to paste secrets into chat.

Do not commit `node_modules`, unintended `dist`/build churn, raw logs, temporary browser profiles, database dumps, backup archives, or secrets.

## Git Hygiene

Before changes:

```bash
git status --short
git branch --show-current
git remote -v
```

Before any commit:

```bash
git diff --stat
git diff
```

Prefer targeted changes over broad rewrites. Avoid force-pushes unless explicitly approved.

## Project Role

TrackMaster Comparator is part of the TrackMaster/AIBRY app runtime group.

Windows owns app/runtime surfaces where applicable.

## Safety Rules

Do not commit secrets, `.env`, raw logs, temporary browser profiles, or generated artifacts unless intentionally tracked.

Do not change TrackMaster production API/database behavior from this repo unless explicitly requested.

## Validation

Inspect repo scripts first:

```bash
npm run
```

Use available build/test/check commands.

For changed JS files:

```bash
node --check path/to/file.js
```

Do not run production restarts or external destructive operations unless explicitly requested.

