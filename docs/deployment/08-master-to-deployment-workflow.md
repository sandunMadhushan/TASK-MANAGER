# 8 — Workflow: `master` vs `deployment` branch

This file is the **day-to-day Git story**: where you commit after localhost testing, how **`deployment`** stays in sync, and how hosting fits in.

> **Name note:** This repo might use **`main`** or **`master`** as the default branch. Replace `master` below with whichever name you use on GitHub.

---

## What each branch is for

| Branch | Purpose |
|--------|--------|
| **`master`** (or `main`) | Normal development. You test on **localhost**, commit and push here. This is your **source of truth** for app code. |
| **`deployment`** | Same app as `master`, plus anything you only want on the deploy line (e.g. `docs/deployment/`). **AWS backend deploy flow / Vercel** are configured from this branch for production. |

You **can** put deployment docs only on `deployment` and never merge `deployment` → `master`. You **still** bring new app code **from** `master` **into** `deployment` whenever you want production updated.

---

## Is this possible?

**Yes.**

1. You **push** the docs (and the rest of the repo) to a new branch called `deployment`.
2. After you add or change code on `master` (tested on localhost), you **update `deployment`** by merging `master` **into** `deployment` and pushing `deployment`.

That is the standard pattern: **one direction** for code flow into production branch: `master` → `deployment`.

---

## First-time setup: create `deployment` and push docs

Do this **once** (or when you first decide to use a deploy-only branch).

### Option A — `deployment` includes everything `master` has, plus extra docs

Use this if `master` already has the app and you add `docs/deployment/` on `master` first, **or** you create `deployment` from `master` and add docs only on `deployment`.

**If docs already exist on `master`:**

```bash
git checkout master
git pull origin master
git checkout -b deployment
git push -u origin deployment
```

**If you want docs only on `deployment` (not on `master`):**

```bash
git checkout master
git pull origin master
git checkout -b deployment
# add docs under docs/deployment/ if not already there
git add docs/deployment/
git commit -m "Add deployment documentation"
git push -u origin deployment
```

Then in your backend deploy flow and **Vercel**, set **Production branch/source** to **`deployment`**.

### Option B — You already have `deployment`; you only need to push

```bash
git checkout deployment
git push -u origin deployment
```

---

## Everyday workflow (the part you will repeat)

### 1. Develop and test on localhost

```bash
npm run server:dev    # terminal 1
npm run dev           # terminal 2
```

Change code, fix bugs, run through the app in the browser.

### 2. Commit on `master`

When you are happy **locally**:

```bash
git checkout master
git add .
git commit -m "Describe what you tested"
git push origin master
```

> Use **feature branches** if you like (`feature/foo` → merge PR into `master`). The important part: **stable, tested work lands on `master`**.

### 3. When you want **production** to match `master`

Only do this when you are ready for backend/Vercel to rebuild with the new code (e.g. right before or after you finish deployment setup).

```bash
git checkout deployment
git pull origin deployment          # optional: get latest deployment branch from GitHub
git merge master                    # brings all new commits from master into deployment
git push origin deployment
```

What happens next:

- GitHub’s `deployment` branch moves forward to include everything from `master` (plus whatever was already only on `deployment`, like extra docs).
- If **auto-deploy** is on, backend and Vercel start new builds from `deployment`.

### 4. Go back to normal coding on `master`

```bash
git checkout master
```

---

## Mental model

```
localhost testing  →  commit/push master  →  (when ready) merge master into deployment  →  push deployment  →  hosts rebuild
```

- **`master`**: moves often (every feature/fix you verify locally).
- **`deployment`**: moves when you **choose** to refresh production; each move should be a **merge from `master`** so the deployed app never lags behind accidentally for long.

---

## Merge conflicts

Rare if only `deployment` has extra files under `docs/deployment/` and you never edit those files on `master`. If both branches changed the **same** file, Git will ask you to resolve conflicts during `git merge master` on `deployment`.

---

## Do I ever merge `deployment` → `master`?

**Optional.**

- **No:** Keeps `master` free of deploy-only files. You only ever merge **`master` → `deployment`**.
- **Yes:** If you want the same `docs/deployment/` on `master` for everyone who clones default branch, merge `deployment` into `master` once (or occasionally). Not required for hosting to work.

---

## Checklist before pushing `deployment`

- [ ] Latest changes are committed on **`master`** and pushed.
- [ ] Localhost tests passed for those changes.
- [ ] On `deployment`: `git merge master` completed without unresolved conflicts.
- [ ] `git push origin deployment` succeeded.
- [ ] Watch backend/Vercel logs for a successful build (first time: env vars already set — see other guides).

---

## Related docs

- [00-git-branch-strategy.md](./00-git-branch-strategy.md) — why a non-default branch works with Vercel/any backend host.
- [README.md](./README.md) — full deployment guide index.
