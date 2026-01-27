# AGENTS.md — Project Context & Working Rules

This file is the single source of truth for AI coding agents working in this repo.
Keep it short, accurate, and focused on how to be effective here.

## Project Summary

- Name: `react-global-audio`
- Type: small TypeScript library
- Goal: route-safe global audio manager + React hook
- Core design: module-level singleton audio manager + `useSyncExternalStore`

## Architecture (Must-Know)

- Global singleton lives in `src/core/manager.ts`
- React hook lives in `src/react/useGlobalAudio.ts`
- Progress persistence helpers live in `src/core/storage.ts`
- Public API surface is intentionally small and exported from `src/index.ts`

Important intent:

- The singleton is deliberate so audio state survives route changes
- Multiple hook usages should always see the same shared audio instance/state
- Avoid refactors that introduce multiple audio instances unless explicitly requested

## Tooling & Commands (npm)

Use npm (not pnpm).

- Install: `npm ci`
- Build: `npm run build`
- Format: `npm run format`
- Format check: `npm run format:check`
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`

## Formatting & Linting

- Prettier is configured via `.prettierrc` and `.prettierignore`
- ESLint uses flat config in `eslint.config.js`
- ESLint integrates `eslint-config-prettier` to avoid rule conflicts

## Git Hooks

- Husky is used
- Prepare: `npm run prepare`
- Pre-commit runs:
  - `npm run format`
  - `npm run lint`

If hooks are not installed locally, run:

1. `npm i -D husky`
2. `npm run prepare`

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- CI runs on PRs and pushes to: `develop`, `main`, `master`
- Steps: `npm ci` → `format:check` → `lint` → `build`

## Branching & Rulesets (Repository Settings)

- Primary integration branch: `develop`
- `develop` should be protected via rulesets (PRs, CI checks, no force push)
- CI status check name to require: `CI`

## Code Style Guidelines

- Prefer explicit, readable code over clever tricks
- Preserve existing public API unless asked to change it
- Comments should explain intent/why (not restate the obvious)
- Keep changes minimal and scoped to the task

## Safe Change Policy

Before changing core behavior in `manager.ts` or `useGlobalAudio.ts`:

1. Confirm the intended behavior with the user
2. Avoid breaking global singleton semantics
3. Avoid introducing multiple audio instances implicitly

## Quick File Map

- Core manager: `src/core/manager.ts`
- Hook: `src/react/useGlobalAudio.ts`
- Types: `src/core/types.ts`
- Storage: `src/core/storage.ts`
- Constants: `src/core/constants.ts`
- Public exports: `src/index.ts`

## Notes

- This repo has Korean intent-focused comments in core files
- Keep new comments consistent with that tone when appropriate
