# Deployment

Updated: 2026-11-05 (Pacific)

- Source: `https://github.com/Zruty0/space-teamster.git`, branch `main`.
- Public game: `https://zruty0.github.io/space-teamster/`.
- GitHub Pages publishes the root of `gh-pages`; source and deployment history are separate. Deploy only when Pete requests it.
- Run the relevant regression suites and `npm run build`. Existing Vite CJS/large-chunk warnings are known; compilation/test failures block release.
- Commit source/artwork/docs and push `main` normally. Generated Vite logs, `node_modules` and `dist` stay untracked/ignored; no live saves belong in the repo.
- Use an isolated `gh-pages` worktree, leaving the main checkout and hidden development server undisturbed. Copy the built `dist/index.html` and assets there, retain `.nojekyll`, and preserve previous hashed assets for already-open browser sessions.
- Include `release.json` in the deployment with the source commit, build timestamp and SHA-256 hashes of the newly built files. Commit and push `gh-pages` normally, never force-push.
- Wait for GitHub Pages publication. Verify public HTML, the main bundle and contract-worker bytes against the build, then smoke-test the public desktop page using an isolated browser profile. A successful branch push alone is not proof of a live deployment.
- Record the source/deployment commits and verified URL in the project vault. No agent/vault push is implied by a game deployment request.
