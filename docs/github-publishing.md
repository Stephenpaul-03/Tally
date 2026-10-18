# Preparing the public repository

The repository includes a README, contribution guide, issue forms, a pull request template, third-party notices, and an automated check workflow. The checks workflow does not publish releases or use signing credentials.

## Before the first public push

Review `git status` and `git diff --check`. Commit the intended source, lockfile, docs, asset notices, config plugins, and release scripts together. The Android release configuration depends on files under `plugins/` and `scripts/`; do not publish only the app screens.

Build outputs, native project directories, local environment files, keystores, and local finance databases are ignored. Ignore rules do not remove files already committed. Check the staged files before committing, and keep APKs in GitHub Releases rather than in the source tree.

Switzer files are local-only and excluded from source history. Contributors must obtain their own copies from Fontshare using the [font setup guide](../assets/fonts/README.md). Keep those files and the private `.local-backups/` recovery snapshots out of public source archives. See [third-party notices](../THIRD_PARTY_NOTICES.md).

If restricted assets or credentials have already been committed, deleting them from the latest revision does not remove them from earlier history. Review the history that will be published. Do not rewrite history that others already use without coordinating first.

## Connect GitHub

Create the intended repository on GitHub, then configure its URL locally. No remote URL is embedded in Tally's documentation or workflows.

```sh
git remote add origin <your-repository-url>
git push -u origin HEAD
```

If a remote already exists, inspect `git remote -v` and use the intended remote rather than adding a duplicate. Enable private vulnerability reporting in GitHub if you want to receive security reports through the Security tab.

GitHub Actions runs `npm ci` and `npm run check:release` on pushes and pull requests. Its token has read-only repository permissions. Native builds, signing, and device testing follow the separate [Android release guide](android-release.md).
