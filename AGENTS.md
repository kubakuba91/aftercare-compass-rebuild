# Release workflow

- Start release branches from the latest `origin/main`. Preserve unrelated local work before changing branches.
- Commit every source file required by a feature, including new files, before releasing it. Never deploy production from a dirty working tree.
- Use the GitHub `main` deployment as the production release path. Do not deploy a local folder directly to production or promote an older build unless the user explicitly requests a recovery or rollback.
- Before merging, review the diff against current `origin/main`, run the relevant tests and production build, and confirm that the release retains existing features.
- After release, verify that Vercel's production commit matches `origin/main`. Record that commit in the release report.
- Keep credentials and local environment files out of Git.
