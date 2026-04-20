# Desktop Release + Auto-Update (GitHub Releases)

This guide explains exactly how to publish a **new desktop version** that updates existing installs (no uninstall/reinstall).

It assumes you already:

- added updater `pubkey` in `src-tauri/tauri.conf.json`
- configured `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in **GitHub repository secrets**
- enabled updater plugin and `createUpdaterArtifacts`
- committed workflow file: `.github/workflows/desktop-release.yml`

---

## 1) Bump version (required every release)

Use the version sync script from repo root:

```bash
npm run release:version -- 0.1.2
```

Optional (also create tag):

```bash
npm run release:version -- 0.1.2 --tag
```

If you did not use `--tag`, create it manually:

```bash
git tag -a v0.1.2 -m "Nexus Tasks v0.1.2"
```

Push branch + tag:

```bash
git push origin deployment
git push origin v0.1.2
```

> Updater only triggers when version increases (`0.1.1` -> `0.1.2`).

## 2) Watch workflow run (tag push triggers CI)

After pushing the `v0.1.2` tag, GitHub Actions workflow `Desktop Release (Tauri Updater)` runs automatically and:

- installs dependencies
- builds signed Tauri bundles
- uploads updater assets to the GitHub release (`latest.json`, installer, `.sig`)

Then:

- GitHub -> **Actions** -> `Desktop Release (Tauri Updater)`
- Wait until the run completes successfully.
- The release `v0.1.2` is created/updated automatically.

## 3) Verify release assets

```bash
gh release view v0.1.2
```

Confirm assets include:

- `latest.json`
- installer (`.msi` and/or `.exe`)
- matching `.sig` for each installer

## 4) Test update flow

1. Install old version (e.g. `0.1.1`).
2. Publish new release (`v0.1.2`) with assets above.
3. Open app -> **Settings -> Check for updates**.
4. Accept update install.
5. Restart app and confirm new version is running.

---

## Troubleshooting

- **No update found**: version was not bumped.
- **Signature or verification error**: wrong private key/password or `pubkey` mismatch.
- **Update check fails**: missing `latest.json` or missing `.sig`.
- **Wrong files uploaded**: artifacts not from same version/tag build.

## Optional: local/manual fallback

If CI is unavailable, you can still build and upload manually by setting local signing env vars and using `gh release upload`. Keep CI as the default for repeatability.

