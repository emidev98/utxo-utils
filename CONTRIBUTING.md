# Contributing

## Commit Message Standard

This repository uses Conventional Commits v1.0.0.

Format:

`<type>(<scope>): <description>`

Examples:

- `feat(addresses): add bulk import validation`
- `fix(usePricing): handle CoinGecko timeout fallback`
- `refactor(utxos): simplify grouping logic`

## Allowed Types

- `feat`: introduce a new feature
- `fix`: patch a bug
- `refactor`: internal code change that does not change behavior
- `perf`: performance improvement
- `test`: add or update tests
- `docs`: documentation-only changes
- `build`: changes to build system or dependencies
- `ci`: CI/CD configuration changes
- `chore`: maintenance tasks with no production behavior changes

## Scope Rules

- Use feature or module scopes.
- Prefer scopes that match repository areas, such as:
  - `addresses`
  - `utxos`
  - `transactions`
  - `settings`
  - `alerts`
  - `hooks`
  - `context`
  - `models`
  - `utils`
  - `build`
  - `android`

## Description Rules

- Use imperative mood (for example: "add", "fix", "refactor").
- Keep the summary concise and specific.
- Do not end with a period.

## Breaking Changes

- Add `!` after type/scope and describe the breaking change in the body.

Example:

`feat(api)!: change tx response normalization`

## Recommended Pre-Commit Checks

- `npm run build`
- `npm run lint`
- `npm run prettier`
- `npm run test:unit`
- Run `npx cypress run` only when e2e coverage is requested.
