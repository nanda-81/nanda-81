# Profile maintenance guide

The profile has two kinds of content:

- Authored content: the hero, project stories, toolkit, and open-source explanation in `README.md`.
- Generated content: the region between `PROFILE:GENERATED:START` and `PROFILE:GENERATED:END`.

To update the living profile:

1. Edit `profile-data.json` when your current focus, learning goal, links, or featured project order changes.
2. Keep repository names exact and use public repositories only.
3. Run `npm test` and then `npm run update:check`.
   The check is intentionally safe offline; it validates the committed generated section when the GitHub API is unavailable.
4. Review the diff. The updater must only change the generated region.
5. Commit the authored change and generated refresh together when the result is accurate.

The updater uses the repository-scoped `GITHUB_TOKEN` in Actions. Never place a personal access token in this repository, README, workflow file, or chat.
