# AGENTS.md

## Project Overview

- UTXO Utils is a React + Ionic + TypeScript application for Bitcoin UTXO analysis.
- The product focus is Bitcoin accounting, reporting, and data visualization workflows.
- The app should remain useful without internet access by relying on already cached local data.
- The app runs client-side and stores fetched financial data locally, so security and correctness are critical.
- Primary optimization target for agents in this repository is refactoring and code quality.

## Product Domain Context

- This project is Bitcoin-specific and models financial records from wallet addresses, UTXOs, and transactions.
- External market and blockchain data providers currently used are:
  - CoinGecko API for BTC pricing data.
  - mempool.space REST API for Bitcoin address and transaction data.
- Agents should preserve accounting and reporting correctness first, then optimize UX and implementation details.

## Scope And Precedence

- This file applies to the whole repository.
- User prompts override AGENTS.md instructions.
- If future nested AGENTS.md files are added, the closest file to the edited path takes precedence.

## Allowed Work Areas

- Frontend pages and components under `src/pages` and `src/components`.
- State and data flow under `src/hooks` and `src/context`.
- Domain models and helpers under `src/models` and `src/utils`.
- Tests and build/config scripts when requested by the task.
- Capacitor/Android changes are optional and should only be made when explicitly requested.

## Hard Boundaries

- Never read or edit files that are ignored by `.gitignore`.
- Do not introduce security vulnerabilities.
- Do not introduce known behavior regressions.
- Do not perform broad refactors that cross about three modules outside requested scope without user approval.

## Canonical Commands (npm)

- Install dependencies: `npm install`
- Start local development: `npm run dev`
- Build production bundle and type-check: `npm run build`
- Build development bundle and type-check: `npm run build:dev`
- Run lint auto-fixes: `npm run lint`
- Run formatter: `npm run prettier`
- Run unit tests: `npm run test:unit`
- Run e2e tests (only when prompt asks): `npx cypress run`
- Update historical pricing dataset: `npm run update:data`

## Quality Gates

- Run these checks before considering a task complete:
  - `npm run build`
  - `npm run lint`
  - `npm run prettier`
  - `npm run test:unit`
- Run Cypress only when the prompt explicitly asks for e2e coverage.

## Testing Policy

- Add or modify tests only when the prompt explicitly requests test changes.
- If tests are not requested, still run mandatory checks in the Quality Gates section.

## API Reliability Policy

Applies to calls to mempool.space, CoinGecko, and similar external services.

- Use a request timeout of 15 seconds.
- Retry up to 3 times for transient failures:
  - network failures
  - HTTP 429
  - HTTP 5xx
- Use exponential backoff with jitter between retries.
- On failures, show a user-friendly toast/message rather than failing silently.
- Keep cached/local data available when possible after API failures.
- Treat networked data as optional at runtime: core accounting, reporting, and visualization experiences must continue to work from local cached data when offline.
- Use structured error logs. A dedicated `LoggingService` abstraction is preferred but optional.

## Security And Privacy

- Treat all stored addresses, UTXO history, and transaction data as sensitive financial data.
- Avoid logging full sensitive payloads by default.
- Sensitive debug logging is allowed only when `VITE_ENABLE_DEBUG_LOGS=true`.
- Never commit secrets or credentials.
- Use `VITE_*` environment variables with safe fallback defaults.

## Collaboration Expectations

- Explain tradeoffs before risky edits.
- Ask for approval before large refactors.
- When presenting options, provide alternatives without forcing a recommendation.

## Definition Of Done

- Include a short change summary.
- Include risk and impact notes.
- Confirm which checks were run and their outcomes.

## Commit And PR Rules

- Use Conventional Commits with feature/module scopes.
- Follow repository commit rules in `CONTRIBUTING.md`.
- Example format: `feat(addresses): add cached balance refresh`

## Architecture Map

- `src/pages`: feature pages (`addresses`, `utxos`, `transactions`, `settings`, `alerts`, `archive`)
- `src/components`: reusable UI components and modals
- `src/hooks`: API integration, data orchestration, and formatting hooks
- `src/context`: shared app state (storage, pricing, toasts)
- `src/models`: Bitcoin data structures and parsers
- `src/utils`: pure utility helpers
- `data`: scripts and source files for historical pricing compression
- `android`: Capacitor Android integration

## Maintenance

- Keep this file up to date when workflows, commands, architecture, or quality gates change.
