# TODOs

## Jest / React Router v7 compatibility workaround

**What:** Remove `jest.moduleNameMapper` in `package.json` and the TextEncoder polyfill in `src/setupTests.js`.

**Why:** React Router v7's `package.json` has `"main": "./dist/main.js"` but that file doesn't exist. CRA bundles Jest 27, which can't read the `exports` field, so we manually point Jest to the real entry. The TextEncoder polyfill is needed because react-router-dom v7 uses it internally and CRA's jsdom doesn't include it.

**Pros:** Removes fragile hardcoded paths into `node_modules` that could break on a react-router-dom patch update.

**Cons:** Can't be done until either react-router-dom fixes its `main` field OR CRA upgrades to Jest 28+ (which supports `exports`). CRA is largely unmaintained, so this may require migrating to Vite or a newer test runner.

**Context:** Added in the CI + unit tests PR (branch `az/claude-rework`). The exact files: `package.json` `jest.moduleNameMapper` block and `src/setupTests.js` lines 7-10.

**Depends on:** react-router-dom shipping a fix, or project migrating away from CRA.
