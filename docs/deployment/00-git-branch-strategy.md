# 0 — Git branch strategy (deploy without merging to main)

## Your question

> If I put all of this on a **new branch**, commit to GitHub, and **never merge to main/master**, can I still do **all deployments** from that branch?

## Short answer: **Yes**

Every major host lets you choose **which branch** is used for:

- **Production** deploys, and/or  
- **Preview** deploys per branch  

So you can:

1. Create a branch (example name: `deployment` or `production-config`).
2. Add **only** these `docs/deployment/*.md` files on that branch (optional: nothing else).
3. Push the branch to GitHub.
4. In **Vercel**, **Render**, etc., set **Production Branch** (or “deploy branch”) to that branch name instead of `main`.

The platform will **clone that branch** and run **whatever code exists on that branch**. So your app (`src/`, `server/`, `package.json`, …) must be **on that branch too** — which it will be, if you branched from `main` and only added docs (or docs + small config files later).

## What “works” means in practice

| Scenario | Result |
|----------|--------|
| Branch = `main` + **only** new files under `docs/deployment/` | Deployed app code is **the same** as `main` at the time you branched (plus harmless doc files). **Deployments work.** |
| You never merge **into** `main` | **Fine.** `main` stays without deployment docs; **production still builds from `deployment`** (or whatever branch you chose). |
| `main` moves forward with new features | Your **deployment branch is behind** until you **update it**. |

## Keeping production up to date without merging deployment → main

You want **localhost unchanged** and **main** maybe “clean” of deploy docs. Typical workflow:

1. Keep developing on `main` (or feature branches merged to `main`).
2. When you want production to match latest app code, on your machine run:

   ```bash
   git checkout deployment
   git merge main
   git push origin deployment
   ```

   That **only updates the deployment branch**; it does **not** put deployment docs on `main` unless you merged the other direction.

3. Your hosting services will **auto-redeploy** when `deployment` pushes (if you enabled that).

You **never** have to merge `deployment` → `main` if you do not want those files on `main`.

## Optional: docs only on `main` instead

If you **do** merge `docs/deployment/` into `main`, deployments can still use branch `main`. This guide supports **either** approach; the branch-only approach is **valid and common**.

## Daily workflow (master + deployment)

For concrete commands — test on localhost, commit to **`master`**, then merge **`master` → `deployment`** and push — see **[08-master-to-deployment-workflow.md](./08-master-to-deployment-workflow.md)**. Use `main` instead of `master` there if that is your default branch name.

## Summary

- **Yes**, you can deploy **entirely** from a non-`main` branch.  
- Set each service’s **production branch** to that branch.  
- Refresh that branch from `main`/`master` when you want new code live, using **`git merge main`** (or `git merge master`) on the deployment branch (one direction).  
- **Local `.env`** stays for localhost; production uses **dashboard env vars** only (see other guides).
