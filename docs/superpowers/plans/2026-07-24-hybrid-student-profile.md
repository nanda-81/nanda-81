# Hybrid Student GitHub Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the GitHub profile visually distinctive and recruiter-friendly while ensuring the README and profile updater remain reliable without network-dependent dashboard widgets.

**Architecture:** Keep the authored README and generated signal region in place. Replace fragile metric images with local, accessible content and update the generator so offline checks compare stable content rather than a newly generated timestamp. Add focused validation tests around profile data, README assets, and offline behavior.

**Tech Stack:** Markdown, local SVG assets, Node.js 22, Node built-in test runner, GitHub Actions.

## Global Constraints

- Preserve the terminal-style banner, project icons, and colorful visual hierarchy.
- Position the author as a student full-stack developer building practical AI-powered products.
- No third-party GitHub stats, streak, or contribution-snake image embeds.
- The updater must never write secrets to tracked files.
- Tests must pass with `npm test`; offline `npm run update:check` must pass against the committed generated section.

---

### Task 1: Make the updater deterministic and validate profile data

**Files:**
- Modify: `scripts/update-profile.mjs`
- Test: `scripts/update-profile.test.mjs`

**Interfaces:**
- Preserve `loadProfileData`, `renderGeneratedSection`, and `replaceGeneratedSection` exports.
- Add `validateProfileData(data)` and `renderGeneratedSection(summary, profileData, options)` behavior without changing existing callers.

- [ ] **Step 1: Write failing tests** for required non-empty strings, valid link schemes, unique featured repositories, and stable offline rendering.
- [ ] **Step 2: Run `npm test`** and confirm the new assertions fail for the missing validation/stability behavior.
- [ ] **Step 3: Implement minimal validation and a stable-date option** so offline checks reuse the existing generated date and do not rewrite README content when GitHub is unavailable.
- [ ] **Step 4: Run `npm test`** and confirm all tests pass.

### Task 2: Remove fragile dashboard embeds while improving visual hierarchy

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: local SVG assets and the generated profile signal.
- Produces: GitHub-renderable Markdown with no stats/streak/snake image dependencies.

- [ ] **Step 1: Write a README-focused test** that fails when deprecated stats URLs or snake embeds are present and when referenced local assets are missing.
- [ ] **Step 2: Run `npm test`** and confirm it fails against the current README.
- [ ] **Step 3: Rewrite the hero and content sections** to use the approved student hybrid positioning, retain the banner/project cards, add a compact “currently building / open to” signal, and replace the control-room widgets with a local “engineering signal” text panel.
- [ ] **Step 4: Run `npm test`** and confirm the README checks pass.

### Task 3: Verify the complete profile workflow

**Files:**
- Modify: `README-maintenance.md` if command guidance changes.

- [ ] **Step 1: Run `npm test`**.
- [ ] **Step 2: Run `npm run update:check`** with network unavailable and confirm exit code 0 and no README diff.
- [ ] **Step 3: Run `git diff --check`** and inspect the final diff for accidental edits outside the intended files.
- [ ] **Step 4: Commit the implementation** with `git add README.md scripts/update-profile.mjs scripts/update-profile.test.mjs README-maintenance.md` and `git commit -m "feat: harden hybrid student profile"`.
