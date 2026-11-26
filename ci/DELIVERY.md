# Verified delivery

Run the repository workflow on the exact candidate commit. A successful run uploads `delivery/manifest.json` with the full source commit, tree and SHA-256 of every explicitly selected delivery file. Only the workflow's successful test/build path creates a delivery artifact. Test reports are evidence, not a release.

Production publication is a separate explicit step using the existing hosting path. Verify the artifact manifest, deployment receipt and actual production resources against the approved commit; record the deployed SHA/tag independently of main and CI head. Do not upload credentials, environment files, user data or local reports. Do not change site/repository visibility or create persistent deployment credentials.

After each completed and verified version: review the exact source/test/build diff, push only that project's intended commit/branch, verify remote HEAD and Actions for that same SHA, and update its existing release record. Never push all local files or force existing history. Failed or blocked checks stay failed.

Existing hosting integrations may have their own production triggers. This workflow adds build artifacts only and does not change those integrations. Review that existing behavior before merging a branch.

Legacy browser scripts were tied to removed onboarding selectors and fixed answers despite randomized corpus selection. They now exercise the actual trial → preference → today flow, use explicit synthetic queues for grading/history, and answer the current card for randomized review. Existing privacy, XSS, duplicate merge, stale-request and review-count assertions remain; only obsolete labels/coverage and catalog-size semantics are updated. No product HTML/JS is changed.
